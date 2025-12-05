// Placeholder service for future Sh-Ivy integrations.
module.exports = {
  async savePublicEndpoint(vendor, publicIpFromShIvy) {
    vendor.publicIpFromShIvy = publicIpFromShIvy;
    return vendor.save();
  },
  async pingEndpoint(_endpoint) {
    // TODO: implement health checks when Sh-Ivy proxying is available
    return { reachable: false };
  }
};
