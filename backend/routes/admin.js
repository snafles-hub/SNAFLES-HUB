const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments({ role: { $in: ['customer', 'buyer'] } });
    const totalVendors = await Vendor.countDocuments();
    const pendingVendorApprovals = await Vendor.countDocuments({ status: 'pending_verification' });

    const recentUsers = await User.find({ role: { $in: ['customer', 'buyer'] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const recentVendors = await Vendor.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name slug status createdAt')
      .populate('owner', 'name email');

    res.json({
      stats: {
        totalUsers,
        totalVendors,
        pendingApprovals: pendingVendorApprovals
      },
      recentActivity: {
        users: recentUsers,
        vendors: recentVendors
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin)
router.get('/users', adminAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['customer', 'vendor', 'admin', 'buyer']),
  query('status').optional().isIn(['active', 'inactive', 'banned']),
  query('search').optional().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, role, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (status) {
      if (status === 'active') filter.isActive = true;
      if (status === 'inactive') filter.isActive = false;
      if (status === 'banned') filter.isBanned = true;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/admin/vendors
// @desc    Get all vendor profiles with filtering and pagination
// @access  Private (Admin)
router.get('/vendors', adminAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['verified', 'pending_verification', 'rejected', 'suspended', 'unverified']),
  query('search').optional().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (status) {
      if (status === 'unverified') {
        filter.status = { $ne: 'verified' };
      } else {
        filter.status = status;
      }
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { domainSub: { $regex: search, $options: 'i' } }
      ];
    }

    const vendors = await Vendor.find(filter)
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments(filter);

    res.json({
      vendors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalVendors: total,
        hasNext: skip + vendors.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get admin vendors error:', error);
    res.status(500).json({ message: 'Server error while fetching vendors' });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (ban/unban, activate/deactivate)
// @access  Private (Admin)
router.put('/users/:id/status', adminAuth, [
  body('status').isIn(['active', 'inactive', 'banned']).withMessage('Invalid status'),
  body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from modifying other admins
    if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Cannot modify other admin accounts' });
    }

    // Update user status
    if (status === 'active') {
      user.isActive = true;
      user.isBanned = false;
    } else if (status === 'inactive') {
      user.isActive = false;
      user.isBanned = false;
    } else if (status === 'banned') {
      user.isActive = false;
      user.isBanned = true;
    }

    // Add reason to user's status history
    if (reason) {
      if (!user.statusHistory) user.statusHistory = [];
      user.statusHistory.push({
        status,
        reason,
        changedBy: req.user._id,
        changedAt: new Date()
      });
    }

    await user.save();

    res.json({
      message: 'User status updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

// @route   PUT /api/admin/vendors/:id/status
// @desc    Update vendor verification status
// @access  Private (Admin)
router.put('/vendors/:id/status', adminAuth, [
  body('status').isIn(['pending_verification', 'verified', 'rejected', 'suspended']).withMessage('Invalid status'),
  body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, reason } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    vendor.status = status;
    vendor.isVerified = status === 'verified';
    if (status === 'suspended') vendor.isActive = false;

    // Add verification history on user record for backward compatibility
    if (reason) {
      if (!vendor.verificationHistory) vendor.verificationHistory = [];
      vendor.verificationHistory.push({
        status,
        reason,
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      });
    }

    await vendor.save();

    res.json({
      message: 'Vendor status updated successfully',
      vendor
    });
  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(500).json({ message: 'Server error while updating vendor status' });
  }
});

const updateVendorStatus = (status) => async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    vendor.status = status;
    vendor.isVerified = status === 'verified';
    if (status === 'suspended') vendor.isActive = false;
    await vendor.save();
    res.json({ message: `Vendor ${status}`, vendor });
  } catch (error) {
    console.error(`Vendor ${status} error:`, error);
    res.status(500).json({ message: 'Server error while updating vendor' });
  }
};

router.patch('/vendors/:id/verify', adminAuth, updateVendorStatus('verified'));
router.patch('/vendors/:id/reject', adminAuth, updateVendorStatus('rejected'));
router.patch('/vendors/:id/suspend', adminAuth, updateVendorStatus('suspended'));

// Negotiation moderation endpoints removed for Phase-1

// Admin products approvals
router.get('/products', adminAuth, async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 20 } = req.query;
    const Product = require('../models/Product');
    const filter = {};
    if (status === 'PENDING') filter.status = 'PENDING';
    if (status === 'APPROVED') filter.status = 'APPROVED';
    if (status === 'REJECTED') filter.status = 'REJECTED';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Product.countDocuments(filter);
    res.json({ products, pagination: { total, page: parseInt(page) } });
  } catch (e) {
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

router.patch('/products/:id/approve', adminAuth, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const p = await Product.findByIdAndUpdate(req.params.id, { status: 'APPROVED', approved: true }, { new: true });
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Approved', product: p });
  } catch (e) {
    res.status(500).json({ message: 'Server error while approving product' });
  }
});

router.patch('/products/:id/reject', adminAuth, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const p = await Product.findByIdAndUpdate(req.params.id, { status: 'REJECTED', approved: false }, { new: true });
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Rejected', product: p });
  } catch (e) {
    res.status(500).json({ message: 'Server error while rejecting product' });
  }
});

module.exports = router;
