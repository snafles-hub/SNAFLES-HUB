const baseDomain = (process.env.BASE_STORE_DOMAIN || 'snfhub.com').toLowerCase();

function parseSlugFromHost(host) {
  if (!host) return null;
  const normalized = host.toLowerCase();
  if (!normalized.endsWith(baseDomain)) return null;
  const withoutDomain = normalized.replace(new RegExp(`\\.?${baseDomain}$`), '');
  const slug = withoutDomain.replace(/\.$/, '');
  if (!slug || slug === 'www') return null;
  return slug.replace(/^\./, '');
}

function parseSlugFromPath(pathname = '') {
  const match = pathname.match(/^\/stores\/([^/]+)/i);
  return match ? match[1] : null;
}

module.exports = function resolveVendorFromDomain(req, _res, next) {
  if (!req.vendorSlug) {
    const hostSlug = parseSlugFromHost(req.headers.host);
    if (hostSlug) {
      req.vendorSlug = hostSlug;
    }
  }

  if (!req.vendorSlug) {
    const pathSlug = parseSlugFromPath(req.path);
    if (pathSlug) {
      req.vendorSlug = pathSlug;
    }
  }

  next();
};
