require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadAndUpdate() {
  console.log('Uploading apna_market_icon_512.png to Cloudinary...');
  const iconPath = path.join(__dirname, '../apna_market_icon_512.png');
  const res = await cloudinary.uploader.upload(iconPath, {
    folder: 'Homster/branding',
    public_id: 'apna_market_icon_clean',
    overwrite: true
  });
  console.log('Uploaded! Secure URL:', res.secure_url);

  // Copy locally to Frontend/public
  const frontendPublicDir = path.join(__dirname, '../../Frontend/public');
  fs.copyFileSync(iconPath, path.join(frontendPublicDir, 'apna-market-icon.png'));
  console.log('Copied to Frontend/public/apna-market-icon.png');

  // Also update MongoDB settings
  await mongoose.connect(process.env.MONGODB_URI);
  const updateResult = await mongoose.connection.db.collection('settings').updateOne(
    { type: 'global' },
    { $set: { appLogo: res.secure_url } }
  );
  console.log('MongoDB settings updated, modified count:', updateResult.modifiedCount);

  // Also check if any setting doc was updated
  const setting = await mongoose.connection.db.collection('settings').findOne({ type: 'global' });
  console.log('Current appLogo in settings:', setting?.appLogo);

  await mongoose.disconnect();
}

uploadAndUpdate().catch(console.error);
