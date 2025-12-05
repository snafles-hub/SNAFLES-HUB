const mongoose = require('mongoose');

const hubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    trim: true
  },
  baseDomain: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: String
  }
}, { timestamps: true });

hubSchema.index({ isActive: 1 });

module.exports = mongoose.model('Hub', hubSchema);
