const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    alias: 'buyerId'
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    alias: 'vendorId'
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      alias: 'productId'
    },
    name: String,
    price: {
      type: Number,
      alias: 'priceAtPurchase'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: String,
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    vendorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  shipping: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'upi', 'cod', 'wallet', 'helperpoints'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    amount: Number
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  total: {
    type: Number,
    required: true,
    alias: 'totalAmount'
  },
  subtotal: Number,
  shippingCost: {
    type: Number,
    default: 0
  },
  tax: Number,
  discount: {
    type: Number,
    default: 0
  },
  coupon: {
    code: String,
    discount: Number
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    status: String,
    updates: [{
      status: String,
      location: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      description: String
    }]
  },
  notes: String
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

orderSchema.virtual('shippingAddress')
  .get(function() {
    return this.shipping;
  })
  .set(function(value) {
    this.shipping = value;
  });

// Index for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'tracking.trackingNumber': 1 });
orderSchema.index({ vendor: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
