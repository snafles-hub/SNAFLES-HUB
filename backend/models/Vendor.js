const mongoose = require('mongoose');

const slugify = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const locationSchema = new mongoose.Schema({
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true, default: 'India' },
  pincode: { type: String, trim: true }
}, { _id: false });

const vendorSchema = new mongoose.Schema({
  // Multi-tenant store identity
  name: {
    type: String,
    required: true,
    trim: true,
    alias: 'storeName'
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    trim: true
  },
  hub: {
    type: String,
    default: 'snafleshub',
    lowercase: true,
    trim: true
  },
  domainSub: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
    sparse: true
  },
  domainPath: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  publicIpFromShIvy: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending_verification', 'verified', 'rejected', 'suspended'],
    default: 'pending_verification',
    index: true
  },
  address: {
    type: String,
    trim: true
  },
  location: locationSchema,

  // Legacy/business profile data kept for compatibility
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String
  },
  banner: {
    type: String
  },
  categories: [{
    type: String,
    enum: ['Jewelry', 'Decor', 'Clothing', 'Accessories', 'Home', 'Art']
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0
  },
  tagline: {
    type: String,
    trim: true,
    maxlength: 140
  },
  about: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  socialLinks: {
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    youtube: { type: String, trim: true },
    website: { type: String, trim: true }
  },
  showcaseMedia: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },
    url: { type: String, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true }
  }],
  highlights: [{
    title: { type: String, trim: true },
    body: { type: String, trim: true },
    ctaLabel: { type: String, trim: true },
    ctaUrl: { type: String, trim: true }
  }],
  storefrontTheme: {
    primaryColor: { type: String, trim: true, default: '#0f172a' },
    accentColor: { type: String, trim: true, default: '#f97316' },
    heroLayout: { type: String, trim: true, enum: ['minimal', 'showcase', 'stacked'], default: 'showcase' },
    featuredCollections: [{ type: String, trim: true }]
  },
  followersCount: {
    type: Number,
    default: 0
  },
  contact: {
    email: {
      type: String,
      trim: true
    },
    phone: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true,
    alias: 'ownerUserId',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for search
vendorSchema.index({ name: 'text', description: 'text' });
vendorSchema.index({ 'location.city': 1, 'location.state': 1, 'location.country': 1 });
vendorSchema.index({ categories: 1 });
vendorSchema.index({ isActive: 1, isVerified: 1 });
vendorSchema.index({ owner: 1 }, { sparse: true });
vendorSchema.index({ slug: 1 }, { unique: true });
vendorSchema.index({ domainSub: 1 }, { sparse: true, unique: true });
vendorSchema.index({ domainPath: 1 }, { sparse: true, unique: true });
vendorSchema.index({ status: 1 });

vendorSchema.pre('validate', function(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  if (!this.domainSub && this.slug) {
    this.domainSub = `${this.slug}.snfhub.com`;
  }
  if (!this.domainPath && this.slug) {
    this.domainPath = `/stores/${this.slug}`;
  }
  next();
});

module.exports = mongoose.model('Vendor', vendorSchema);
