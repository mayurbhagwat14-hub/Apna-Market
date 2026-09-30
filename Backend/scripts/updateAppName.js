const mongoose = require('mongoose');
require('dotenv').config();

async function fixAppName() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const res = await db.collection('settings').updateMany({}, { $set: { appName: 'Zevygo' } });
    console.log('UPDATED_SETTINGS_COUNT:', res.modifiedCount);
  } catch (err) {
    console.error('Error updating settings:', err);
  } finally {
    mongoose.disconnect();
  }
}

fixAppName();
