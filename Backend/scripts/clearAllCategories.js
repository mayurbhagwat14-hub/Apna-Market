const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('../config/db');

async function clearAllCategories() {
  try {
    await connectDB();
    const Category = require('../models/Category');
    const result = await Category.deleteMany({});
    console.log(`✅ Successfully deleted all ${result.deletedCount} categories from the database.`);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing categories:', err);
    process.exit(1);
  }
}

clearAllCategories();
