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
  const vendors = [
    {
      name: 'Baani Makover',
      description: 'Professional makeup artist offering premium cosmetics and personalized beauty solutions.',
      logo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop',
      banner: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop',
      location: 'Mumbai, India',
      categories: ['Accessories', 'Art'],
      rating: 4.8,
      reviews: 0,
      contact: {
        email: 'orders@banimakeovers.com',
        phone: '+91 98765 12345',
        website: 'https://banimakeovers.com'
      },
      isVerified: true,
    },
    {
      name: 'Tanmay Arora',
      description: 'Master craftsman specializing in traditional Indian jewelry with a modern twist.',
      logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      banner: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=400&fit=crop',
      location: 'New Delhi, India',
      categories: ['Jewelry', 'Accessories'],
      rating: 4.9,
      reviews: 0,
      contact: {
        email: 'orders@tanmayarora.com',
        phone: '+91 98765 43210',
        website: 'https://tanmayarora.com'
      },
      isVerified: true,
    },
  ]

  for (const vendorData of vendors) {
    const existingVendor = await Vendor.findOne({ name: vendorData.name })
    if (!existingVendor) {
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
      name: 'Press-on Nails - Lilac & Nude Glitter Set',
      description: 'Handcrafted press-on nail set with lilac polish and nude glitter tips.',
      detailedDescription: 'Salon-quality press-on nails featuring a soft lilac finish and nude glitter accents. Easy to apply and reusable with care.',
      price: 1499,
      originalPrice: 1799,
      images: ['/images/products/baani-nails-001.jpg'],
      category: 'Accessories',
      vendor: baani._id,
      stock: 24,
      rating: 4.9,
      reviews: 0,
      featured: true,
      tags: ['nails', 'press-on', 'glitter', 'lilac', 'beauty'],
      approved: true,
      status: 'APPROVED'
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
    
    console.log('🌱 Seeding demo accounts + requested vendors...');
    await seedUsers();
    await seedVendors();
    await seedProducts();
    console.log('✅ Seeding completed.');
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
