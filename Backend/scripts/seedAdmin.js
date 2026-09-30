require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not defined in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'admin@admin.com';
    const password = 'admin123';

    let admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      console.log('No admin found with email:', email, '- creating new super_admin account...');
      admin = new Admin({
        name: 'Super Admin',
        email: email,
        password: password,
        role: 'super_admin',
        isActive: true
      });
      await admin.save();
      console.log(`✅ Admin created successfully!`);
    } else {
      console.log('Existing admin found. Resetting password and ensuring super_admin role...');
      admin.password = password;
      admin.role = 'super_admin';
      admin.isActive = true;
      await admin.save();
      console.log(`✅ Admin updated successfully!`);
    }

    // Verify password check
    const verified = await admin.comparePassword(password);
    console.log(`Verification - Login check with '${password}':`, verified ? 'SUCCESS' : 'FAILED');

    console.log('\n--- ADMIN DEMO CREDENTIALS ---');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     ${admin.role}`);
    console.log('-------------------------------\n');

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

seedAdmin();
