const Vendor = require('../models/Vendor');

const DEFAULT_VENDOR_LOGO = process.env.DEFAULT_VENDOR_LOGO || 'https://placehold.co/200x200?text=Vendor';
const DEFAULT_VENDOR_BANNER = process.env.DEFAULT_VENDOR_BANNER || 'https://placehold.co/800x320?text=Vendor+Banner';

const buildVendorLocation = (address = {}) => {
  if (!address) return 'India';
  const parts = [address.city, address.state, address.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'India';
};

const findVendorForUser = async (user, { allowCreate = false, payload = {} } = {}) => {
  if (!user) return null;

  let vendor = await Vendor.findOne({ owner: user._id });
  if (vendor) return vendor;

  if (user.email) {
    vendor = await Vendor.findOne({ 'contact.email': user.email });
    if (vendor) {
      if (!vendor.owner) {
        vendor.owner = user._id;
        await vendor.save();
      }
      return vendor;
    }
  }

  if (!allowCreate) return null;

  const fallbackName = user.name ? `${user.name}'s Store` : 'Independent Vendor';
  const vendorName = payload.vendorName || fallbackName;
  const vendorDescription = payload.vendorDescription || payload.description || 'Independent vendor on SnaflesHub';

  const freshVendor = new Vendor({
    owner: user._id,
    name: vendorName,
    description: vendorDescription,
    logo: (Array.isArray(payload.images) && payload.images[0]) || DEFAULT_VENDOR_LOGO,
    banner: DEFAULT_VENDOR_BANNER,
    location: buildVendorLocation(user.address),
    categories: payload.category ? [payload.category] : [],
    contact: {
      email: user.email || 'vendor@snafleshub.local',
      phone: user.phone || '',
      website: payload.vendorWebsite || ''
    },
    isVerified: false
  });

  await freshVendor.save();
  return freshVendor;
};

const ensureVendorProfileForUser = async (user, payload = {}) => {
  return findVendorForUser(user, { allowCreate: true, payload });
};

module.exports = {
  ensureVendorProfileForUser,
  findVendorForUser,
  DEFAULT_VENDOR_LOGO,
  DEFAULT_VENDOR_BANNER,
  buildVendorLocation
};
