const express = require('express');
const { auth, vendorAuth } = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { findVendorForUser } = require('../services/vendorProfileService');

const router = express.Router();

// @route   GET /api/vendor/analytics/dashboard
// @desc    Get vendor dashboard analytics
// @access  Private (Vendor)
router.get('/dashboard', vendorAuth, async (req, res) => {
  try {
    const vendorDoc = await findVendorForUser(req.user, { allowCreate: true });
    if (!vendorDoc) {
      return res.status(404).json({ message: 'Vendor profile not configured yet' });
    }

    const vendorId = vendorDoc._id;
    const vendorUserId = req.user._id;

    // Get basic counts
    const totalProducts = await Product.countDocuments({
      isActive: true,
      $or: [
        { vendor: vendorId },
        { vendorUser: vendorUserId }
      ]
    });
    const totalOrders = await Order.countDocuments({
      $or: [
        { 'items.vendor': vendorId },
        { 'items.vendorUser': vendorUserId }
      ]
    });
    
    // Get revenue data
    const revenueData = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          $or: [
            { 'items.vendor': vendorId },
            { 'items.vendorUser': vendorUserId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const averageOrderValue = revenueData.length > 0 ? revenueData[0].averageOrderValue : 0;

    // Get pending orders
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending', 'processing'] },
      $or: [
        { 'items.vendor': vendorId },
        { 'items.vendorUser': vendorUserId }
      ]
    });

    // Get low stock products
    const lowStockProducts = await Product.countDocuments({
      stock: { $lte: 5 },
      isActive: true,
      $or: [
        { vendor: vendorId },
        { vendorUser: vendorUserId }
      ]
    });

    // Get average rating
    const ratingData = await Product.aggregate([
      {
        $match: {
          isActive: true,
          $or: [
            { vendor: vendorId },
            { vendorUser: vendorUserId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const averageRating = ratingData.length > 0 ? ratingData[0].averageRating : 0;

    // Get recent products
    const recentProducts = await Product.find({
      isActive: true,
      $or: [
        { vendor: vendorId },
        { vendorUser: vendorUserId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name price stock rating sales image status');

    // Get recent orders
    const recentOrders = await Order.find({
      $or: [
        { 'items.vendor': vendorId },
        { 'items.vendorUser': vendorUserId }
      ]
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber total status createdAt items');

    // Get sales data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: thirtyDaysAgo },
          $or: [
            { 'items.vendor': vendorId },
            { 'items.vendorUser': vendorUserId }
          ]
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          dailyRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        pendingOrders,
        lowStockProducts,
        averageRating: Math.round(averageRating * 10) / 10
      },
      recentProducts,
      recentOrders,
      salesData
    });
  } catch (error) {
    console.error('Get vendor analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching analytics' });
  }
});

// @route   GET /api/vendor/analytics/products
// @desc    Get vendor products with analytics
// @access  Private (Vendor)
router.get('/products', vendorAuth, async (req, res) => {
  try {
    const vendorDoc = await findVendorForUser(req.user, { allowCreate: true });
    if (!vendorDoc) {
      return res.status(404).json({ message: 'Vendor profile not configured yet' });
    }

    const vendorId = vendorDoc._id;
    const vendorUserId = req.user._id;
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {
      $or: [
        { vendor: vendorId },
        { vendorUser: vendorUserId }
      ]
    };
    if (status) {
      if (status === 'active') filter.isActive = true;
      if (status === 'inactive') filter.isActive = false;
      if (status === 'low_stock') filter.stock = { $lte: 5 };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('name price stock rating reviews sales image status category createdAt');

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
    console.error('Get vendor products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// @route   GET /api/vendor/analytics/orders
// @desc    Get vendor orders with analytics
// @access  Private (Vendor)
router.get('/orders', vendorAuth, async (req, res) => {
  try {
    const vendorDoc = await findVendorForUser(req.user, { allowCreate: true });
    if (!vendorDoc) {
      return res.status(404).json({ message: 'Vendor profile not configured yet' });
    }

    const vendorId = vendorDoc._id;
    const vendorUserId = req.user._id;
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {
      $and: [
        {
          $or: [
            { 'items.vendor': vendorId },
            { 'items.vendorUser': vendorUserId }
          ]
        }
      ]
    };
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$and.push({
        $or: [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'user.name': { $regex: search, $options: 'i' } }
        ]
      });
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('orderNumber total status createdAt items payment');

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: skip + orders.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// Negotiations removed for Phase-1

// @route   GET /api/vendor/analytics/sales-report
// @desc    Get sales report for date range
// @access  Private (Vendor)
router.get('/sales-report', vendorAuth, async (req, res) => {
  try {
    const vendorDoc = await findVendorForUser(req.user, { allowCreate: true });
    if (!vendorDoc) {
      return res.status(404).json({ message: 'Vendor profile not configured yet' });
    }

    const vendorId = vendorDoc._id;
    const vendorUserId = req.user._id;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Build date filter
    const baseMatch = {
      status: 'delivered',
      $or: [
        { 'items.vendor': vendorId },
        { 'items.vendorUser': vendorUserId }
      ]
    };
    const dateFilter = { ...baseMatch };
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Group by date
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%U';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const salesReport = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $match: {
          $or: [
            { 'items.vendor': vendorId },
            { 'items.vendorUser': vendorUserId }
          ]
        }
      },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          productImage: '$product.image',
          totalSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      salesReport,
      topProducts
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ message: 'Server error while fetching sales report' });
  }
});

module.exports = router;
