const mongoose = require('mongoose');

const vendorFollowSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

vendorFollowSchema.index({ vendor: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('VendorFollow', vendorFollowSchema);
