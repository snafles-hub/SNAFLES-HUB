const mongoose = require('mongoose');
require('dotenv').config();

function hasDbInUri(u) {
  return /mongodb(\+srv)?:\/\/[^/]+\/[^?]+/.test(u);
}

async function run() {
  const baseUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/';
  const dbName = process.env.DB_NAME || 'snafleshub';
  const vendorName = process.env.VENDOR_NAME || 'Banni Makeover';

  const uri = hasDbInUri(baseUri) ? baseUri : baseUri.replace(/\/?$/, '/') + dbName;

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const dbConnected = mongoose.connection?.db?.databaseName || dbName;
    console.log(`Connected to MongoDB db='${dbConnected}'`);
    const Vendor = require('../models/Vendor');
    const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`^${escape(vendorName)}$`, 'i');
    const doc = await Vendor.findOne({ name: nameRegex }).lean();
    if (!doc) {
      console.log(`No vendor found matching "${vendorName}".`);
    } else {
      console.log(JSON.stringify(doc, null, 2));
    }
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
