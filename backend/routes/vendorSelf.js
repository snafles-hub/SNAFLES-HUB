const express = require('express');
const { body, validationResult } = require('express-validator');
const Vendor = require('../models/Vendor');
const { vendorAuth } = require('../middleware/auth');
const shIvyService = require('../services/shIvyService');

const router = express.Router();

async function loadVendor(req) {
  return Vendor.findOne({ owner: req.user._id });
}

async function attachVendor(req, res, next) {
  try {
    const vendor = await loadVendor(req);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found for this account' });
    }
    req.vendorProfile = vendor;
    next();
  } catch (error) {
    console.error('Vendor load error:', error);
    res.status(500).json({ message: 'Server error loading vendor' });
  }
}

function ensureVerified(req, res, next) {
  if (req.vendorProfile.status !== 'verified') {
    return res.status(403).json({ message: 'Vendor is not verified yet' });
  }
  next();
}

// @route   PATCH /api/vendor/me/profile
// @desc    Update vendor profile/personalization fields
// @access  Private (Vendor/Admin)
router.patch('/me/profile', vendorAuth, attachVendor, [
  body('tagline').optional().isString().isLength({ max: 140 }),
  body('about').optional().isString().isLength({ max: 2000 }),
  body('socialLinks').optional().isObject(),
  body('showcaseMedia').optional().isArray(),
  body('highlights').optional().isArray(),
  body('storefrontTheme').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowed = ['tagline', 'about', 'socialLinks', 'showcaseMedia', 'highlights', 'storefrontTheme'];
    const update = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });

    const vendor = await Vendor.findByIdAndUpdate(
      req.vendorProfile._id,
      update,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Profile updated', vendor });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({ message: 'Server error while updating vendor profile' });
  }
});

// @route   PATCH /api/vendor/me/public-endpoint
// @desc    Save vendor public endpoint from Sh-Ivy
// @access  Private (Vendor/Admin)
router.patch('/me/public-endpoint', vendorAuth, attachVendor, [
  body('publicIpFromShIvy').trim().isLength({ min: 5 }).withMessage('publicIpFromShIvy is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vendor = await shIvyService.savePublicEndpoint(req.vendorProfile, req.body.publicIpFromShIvy);
    res.json({ message: 'Public endpoint saved', vendor });
  } catch (error) {
    console.error('Save Sh-Ivy endpoint error:', error);
    res.status(500).json({ message: 'Server error while saving endpoint' });
  }
});

// Note: product and order endpoints removed for community-only experience
module.exports = router;
