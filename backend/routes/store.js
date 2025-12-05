const express = require('express');
const Vendor = require('../models/Vendor');
const resolveVendorFromDomain = require('../middleware/resolveVendorFromDomain');

const router = express.Router();
router.use(resolveVendorFromDomain);

const extractSlug = (req) => req.params.slug || req.vendorSlug;

async function findActiveVendor(slug) {
  if (!slug) return null;
  return Vendor.findOne({
    slug: slug.toLowerCase(),
    isActive: true,
    status: 'verified'
  });
}

async function ensureVendor(req, res) {
  const slug = extractSlug(req);
  if (!slug) {
    res.status(400).json({ message: 'Vendor slug is required' });
    return null;
  }
  const vendor = await findActiveVendor(slug);
  if (!vendor) {
    res.status(404).json({ message: 'Vendor not found' });
    return null;
  }
  return vendor;
}

async function getInfo(req, res) {
  try {
    const vendor = await ensureVendor(req, res);
    if (!vendor) return;
    res.json({
      store: {
        name: vendor.name,
        slug: vendor.slug,
        status: vendor.status,
        location: vendor.location,
        address: vendor.address,
        domainSub: vendor.domainSub,
        domainPath: vendor.domainPath,
        tagline: vendor.tagline,
        about: vendor.about,
        socialLinks: vendor.socialLinks,
        showcaseMedia: vendor.showcaseMedia,
        highlights: vendor.highlights,
        storefrontTheme: vendor.storefrontTheme,
        followersCount: vendor.followersCount
      }
    });
  } catch (error) {
    console.error('Public store info error:', error);
    res.status(500).json({ message: 'Server error while fetching store info' });
  }
}

router.get('/:slug/info', getInfo);
router.get('/info', getInfo);

module.exports = router;
