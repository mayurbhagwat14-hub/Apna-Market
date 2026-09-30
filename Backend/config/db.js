const mongoose = require('mongoose');

/**
 * Ensure default super_admin account exists
 */
const ensureDefaultAdmin = async () => {
  try {
    const Admin = require('../models/Admin');
    const existing = await Admin.findOne({ email: 'admin@admin.com' });
    if (!existing) {
      const admin = new Admin({
        name: 'Super Admin',
        email: 'admin@admin.com',
        password: 'admin123',
        role: 'super_admin',
        isActive: true
      });
      await admin.save();
      console.log('✅ Default Super Admin created: admin@admin.com / admin123');
    }
  } catch (err) {
    console.error('Error ensuring default admin:', err.message);
  }
};

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await ensureDefaultAdmin();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;


