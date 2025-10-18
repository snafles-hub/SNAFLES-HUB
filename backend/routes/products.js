const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const { auth, vendorAuth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/auth');
const {
  ensureVendorProfileForUser
} = require('../services/vendorProfileService');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['Jewelry', 'Decor', 'Clothing', 'Accessories', 'Home', 'Art']).withMessage('Invalid category'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('sortBy').optional().isIn(['name', 'price', 'rating', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('kind').optional().isIn(['NEW', 'SECOND_HAND']).withMessage('Invalid kind')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured,
      vendor
    } = req.query;

    // Build filter object
    const filter = { isActive: true, approved: true, status: 'APPROVED' };
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (featured === 'true') {
      filter.featured = true;
    }
    
    if (vendor) {
      filter.vendor = vendor;
    }
    if (req.query.kind) {
      filter.kind = req.query.kind;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filter)
      .populate('vendor', 'name logo location contact owner')
      .populate('vendorUser', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', [
  // Ensure valid MongoID to avoid cast errors
  param('id').isMongoId().withMessage('Invalid product id'),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name logo location rating contact owner')
      .populate('vendorUser', 'name email')
      .populate('customerReviews.user', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error while fetching product' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Vendor/Admin)
router.post('/', vendorAuth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['Jewelry', 'Decor', 'Clothing', 'Accessories', 'Home', 'Art']).withMessage('Invalid category'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('kind').optional().isIn(['NEW', 'SECOND_HAND']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const isAdmin = req.user.role === 'admin';
    let vendorDoc = null;
    let vendorUserId = null;

    if (isAdmin) {
      if (!req.body.vendor) {
        return res.status(400).json({ message: 'Vendor is required' });
      }
      vendorDoc = await Vendor.findById(req.body.vendor);
      if (!vendorDoc) {
        return res.status(400).json({ message: 'Vendor not found' });
      }
      vendorUserId = req.body.vendorUser || vendorDoc.owner || null;
    } else {
      vendorDoc = await ensureVendorProfileForUser(req.user, req.body);
      vendorUserId = req.user._id;
    }

    const baseData = { ...req.body };
    delete baseData.vendor;
    delete baseData.vendorUser;

    const productData = {
      ...baseData,
      vendor: vendorDoc ? vendorDoc._id : undefined,
      vendorUser: vendorUserId,
      approved: isAdmin ? Boolean(req.body.approved) : false,
      status: isAdmin ? (req.body.status || (req.body.approved ? 'APPROVED' : 'PENDING')) : 'PENDING',
      kind: req.body.kind || 'NEW'
    };

    if (!productData.approved) {
      productData.status = 'PENDING';
    } else if (!productData.status) {
      productData.status = 'APPROVED';
    }

    const product = new Product(productData);
    await product.save();

    await product.populate([
      { path: 'vendor', select: 'name logo location contact owner' },
      { path: 'vendorUser', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Vendor/Admin)
router.put('/:id', vendorAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns the product or is admin
    if (req.user.role !== 'admin' && product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const isAdmin = req.user.role === 'admin';
    const update = { ...req.body };

    if (!isAdmin) {
      delete update.vendor;
      delete update.vendorUser;
      update.vendor = product.vendor;
      update.vendorUser = product.vendorUser || req.user._id;
    } else {
      if (update.vendor && product.vendor.toString() !== update.vendor.toString()) {
        const vendorDoc = await Vendor.findById(update.vendor);
        if (!vendorDoc) {
          return res.status(400).json({ message: 'Vendor not found' });
        }
        update.vendor = vendorDoc._id;
        if (vendorDoc.owner) {
          update.vendorUser = vendorDoc.owner;
        }
      }
      if (update.vendorUser === undefined && product.vendorUser) {
        update.vendorUser = product.vendorUser;
      }
    }

    // Any edit sets status back to pending for re-approval unless admin explicitly approves
    update.status = 'PENDING';
    update.approved = false;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    )
      .populate('vendor', 'name logo location contact owner')
      .populate('vendorUser', 'name email');

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Vendor/Admin)
router.delete('/:id', vendorAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns the product or is admin
    if (req.user.role !== 'admin' && product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add product review
// @access  Private
router.post('/:id/reviews', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { rating, comment } = req.body;

    // Add review
    product.customerReviews.push({
      user: req.user._id,
      name: req.user.name,
      rating,
      comment
    });

    // Update rating and review count
    const totalRating = product.customerReviews.reduce((sum, review) => sum + review.rating, 0);
    product.rating = totalRating / product.customerReviews.length;
    product.reviews = product.customerReviews.length;

    await product.save();

    res.json({
      message: 'Review added successfully',
      review: product.customerReviews[product.customerReviews.length - 1]
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error while adding review' });
  }
});

// @route   PUT /api/products/:id/approve
// @desc    Approve or unapprove a product (Admin)
// @access  Private (Admin)
router.put('/:id/approve', adminAuth, [
  body('approved').isBoolean().withMessage('approved must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { approved } = req.body;
    const update = approved ? { approved: true, status: 'APPROVED' } : { approved: false, status: 'REJECTED' };
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('vendor', 'name logo');

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product approval status updated', product });
  } catch (error) {
    console.error('Approve product error:', error);
    res.status(500).json({ message: 'Server error while updating approval' });
  }
});

module.exports = router;
