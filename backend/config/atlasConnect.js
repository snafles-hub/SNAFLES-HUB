const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas connection string set in env (e.g. MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster0.mongodb.net/dbname)
const ATLASS_URI = process.env.MONGODB_ATLAS_URI;

if (!ATLASS_URI) {
  console.warn('⚠️  MONGODB_ATLAS_URI is not set; Atlas connection will be skipped.');
}

const ATLAS_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 8000,
  keepAlive: true,
};

async function connectAtlas() {
  if (!ATLASS_URI) {
    throw new Error('MONGODB_ATLAS_URI must be defined to connect to MongoDB Atlas');
  }

  try {
    await mongoose.connect(ATLASS_URI, ATLAS_OPTIONS);
    console.log('🔥 Connected to MongoDB Atlas');
  } catch (error) {
    console.error('🔥 MongoDB Atlas connection error:', error?.message || error);
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB Atlas disconnected');
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB Atlas reconnected');
});

if (require.main === module) {
  connectAtlas().catch(() => process.exit(1));
}

module.exports = { connectAtlas };
