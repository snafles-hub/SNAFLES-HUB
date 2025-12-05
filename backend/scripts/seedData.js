const mongoose = require('mongoose');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snafleshub');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const users = [
    {
      name: 'Sarah Johnson',
      email: 'demo@snafles.com',
      password: 'demo123',
      phone: '+1 (555) 123-4567',
      address: {
        street: '123 Demo Street',
        city: 'Demo City',
        state: 'CA',
        zipCode: '90210',
        country: 'US'
      },
      loyaltyPoints: 1250,
      preferences: {
        newsletter: true,
        smsNotifications: false
      }
    },
    {
      name: 'Vendor User',
      email: 'vendor@snafles.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '+91 98765 43210',
      address: {
        street: '123 Artisan Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      },
      loyaltyPoints: 0,
      preferences: {
        newsletter: false,
        smsNotifications: false
      }
    },
    {
      name: 'Vendor User Two',
      email: 'vendor2@snafles.com',
      password: 'vendor123',
      role: 'vendor',
      phone: '+91 99999 11111',
      address: {
        street: '12 Vendor Lane',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001',
        country: 'India'
      }
    },
    {
      name: 'Admin User',
      email: 'admin@snafles.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1 (555) 000-0000',
      address: {
        street: '789 Admin Street',
        city: 'Admin City',
        state: 'CA',
        zipCode: '90210',
        country: 'US'
      }
    }
  ];

  for (const userData of users) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.name}`);
    } else {
      console.log(`User already exists: ${userData.name}`);
    }
  }
};

const seedVendors = async () => {
  // Seed exactly two vendor profiles as requested: Baani Makover and Tanmay Arora
  const ownerEmailByVendor = {
    'Baani Makover': 'vendor@snafles.com',
    'Tanmay Arora': 'vendor2@snafles.com'
  };
  const owners = await User.find({ email: { $in: Object.values(ownerEmailByVendor) } });
  const ownerLookup = new Map();
  owners.forEach((u) => ownerLookup.set(u.email, u._id));

  const vendors = [
    {
      name: 'Baani Makover',
      description: 'Professional makeup artist offering premium cosmetics and personalized beauty solutions.',
      logo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
      banner: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop',
      location: {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400001'
      },
      categories: ['Accessories', 'Art'],
      rating: 4.8,
      reviews: 0,
      contact: {
        email: 'orders@banimakeovers.com',
        phone: '+91 98765 12345',
        website: 'https://banimakeovers.com'
      },
      isVerified: true,
      status: 'verified'
    },
    {
      name: 'Tanmay Arora',
      description: 'Master craftsman specializing in traditional Indian jewelry with a modern twist.',
      logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      banner: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=400&fit=crop',
      location: {
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        pincode: '110001'
      },
      categories: ['Jewelry', 'Accessories'],
      rating: 4.9,
      reviews: 0,
      contact: {
        email: 'orders@tanmayarora.com',
        phone: '+91 98765 43210',
        website: 'https://tanmayarora.com'
      },
      isVerified: true,
      status: 'verified'
    },
  ]

  for (const vendorData of vendors) {
    const existingVendor = await Vendor.findOne({ name: vendorData.name })
    if (!existingVendor) {
      const ownerEmail = ownerEmailByVendor[vendorData.name];
      if (ownerEmail && ownerLookup.has(ownerEmail)) {
        vendorData.owner = ownerLookup.get(ownerEmail);
      }
      const vendor = new Vendor(vendorData)
      await vendor.save()
      console.log(`Created vendor: ${vendorData.name}`)
    } else {
      console.log(`Vendor already exists: ${vendorData.name}`)
    }
  }
};

const seedProducts = async () => {
  const baani = await Vendor.findOne({ name: 'Baani Makover' })
  if (!baani) {
    console.log('Vendor "Baani Makover" not found; skipping product seed.')
    return
  }

  const products = [
    {
      name: 'Tailored Frock Collection',
      description: 'This Tailored Frock product is handmade and good quality, crafted with love and care.',
      detailedDescription: 'Hand-stitched using premium cotton and silk blends, the Tailored Frock Collection celebrates timeless silhouettes that flatter every figure. Each piece is finished with artisan embroidery and adjustable straps for comfort.',
      price: 3499,
      originalPrice: 4299,
      images: [
        '/images/products/tailored-frock-001.jpg',
        '/images/products/tailored-frock-002.jpg'
      ],
      category: 'Clothing',
      vendor: baani._id,
      stock: 18,
      rating: 4.9,
      reviews: 14,
      featured: true,
      tags: ['frock', 'tailored', 'handmade', 'clothing'],
      approved: true,
      status: 'APPROVED',
      negotiable: false,
      shipping: {
        type: 'FLAT',
        amount: 250,
        city: 'Mumbai'
      },
      specifications: {
        material: 'Cotton blend with silk lining',
        care: 'Dry clean recommended',
        origin: 'Made in India',
        sizes: 'S, M, L, XL'
      }
    }
  ]

  for (const productData of products) {
    const existingProduct = await Product.findOne({ name: productData.name })
    if (!existingProduct) {
      const product = new Product(productData)
      await product.save()
      console.log(`Created product: ${productData.name}`)
    } else {
      console.log(`Product already exists: ${productData.name}`)
    }
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Seeding demo accounts + Baani Makover data...');
    await seedUsers();
    await seedVendors();
    await seedProducts();
    console.log('? Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
