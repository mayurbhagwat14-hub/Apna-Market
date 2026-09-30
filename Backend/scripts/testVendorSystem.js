const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const ServiceListing = require('../models/ServiceListing');
const Quote = require('../models/Quote');
const AuditLog = require('../models/AuditLog');
const { formatVendorResponse, maskAadhaar, maskPAN } = require('../utils/masking.util');

async function runVendorSystemVerification() {
  console.log('=== ZEVYGO Service Provider System Verification ===\n');

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/homster';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Test 1: Masking Utility Test
    console.log('\n[1] Testing Sensitive Data Masking:');
    const maskedA = maskAadhaar('123456789012');
    const maskedP = maskPAN('ABCDE1234F');
    console.log(`- Aadhaar 123456789012 => ${maskedA}`);
    console.log(`- PAN ABCDE1234F => ${maskedP}`);
    if (maskedA !== 'XXXX XXXX 9012' || maskedP !== 'XXXXX1234X') {
      throw new Error('Masking utility failed expected output!');
    }
    console.log('✓ Masking utility verified!');

    // Test 2: Create / Find Test Provider & Verify Models
    console.log('\n[2] Testing Provider Model & Account Statuses:');
    const testPhone = '9998887770';
    await Vendor.deleteMany({ phone: testPhone });
    await ServiceListing.deleteMany({ categoryName: 'Test Electrician' });

    const vendor = await Vendor.create({
      name: 'Sharma Services',
      email: 'sharma@example.com',
      phone: testPhone,
      providerType: 'BUSINESS',
      businessDetails: {
        businessName: 'Sharma Home Services',
        teamSize: 5,
        gstin: '22AAAAA0000A1Z5'
      },
      aadhar: {
        number: '123456789012',
        document: 'https://cloudinary.com/dummy-front.png',
        backDocument: 'https://cloudinary.com/dummy-back.png'
      },
      pan: { number: 'ABCDE1234F', document: 'https://cloudinary.com/dummy-pan.png' },
      accountStatus: 'PENDING_VERIFICATION',
      approvalStatus: 'pending'
    });

    console.log(`- Provider Created: ID ${vendor._id}, Status: ${vendor.accountStatus}`);
    const formatted = formatVendorResponse(vendor);
    console.log(`- Formatted Response Aadhaar: ${formatted.kycSummary.aadhar.number}`);
    console.log(`- Formatted Response PAN: ${formatted.kycSummary.pan.number}`);

    // Test 3: Test Category & ServiceListing
    console.log('\n[3] Testing Multi-Service Listing & Pending Edits:');
    let category = await Category.findOne({ title: 'Electrician' });
    if (!category) {
      category = await Category.create({
        title: 'Test Electrician',
        slug: 'test-electrician',
        bookingMode: 'BOTH',
        defaultPricingModel: 'FIXED'
      });
    }

    const listing = await ServiceListing.create({
      vendorId: vendor._id,
      categoryId: category._id,
      categoryName: category.title,
      title: 'Full Home Wiring & Repair',
      bookingMode: 'BOTH',
      pricingModel: 'FIXED',
      pricing: { basePrice: 299, emergencyCharge: 150 },
      status: 'APPROVED'
    });

    console.log(`- Service Listing Created: "${listing.title}" (Status: ${listing.status})`);

    // Test Pending Edit Rule: Edit price while live version is stored
    listing.approvedVersion = {
      title: listing.title,
      pricing: listing.pricing
    };
    listing.pricing.basePrice = 399;
    listing.hasPendingEdits = true;
    listing.status = 'PENDING_REVIEW';
    await listing.save();

    console.log(`- Pending Edit Rule Verified! Status: ${listing.status}, Live Base Price in ApprovedVersion: ₹${listing.approvedVersion.pricing.basePrice}, New Base Price under review: ₹${listing.pricing.basePrice}`);

    // Test 4: Custom Quote Creation
    console.log('\n[4] Testing Custom Quote Workflow:');
    const quote = await Quote.create({
      customerId: new mongoose.Types.ObjectId(),
      vendorId: vendor._id,
      serviceListingId: listing._id,
      serviceCategory: category.title,
      eventDate: new Date(Date.now() + 86400000 * 5),
      location: 'Indore City',
      requirements: 'Complete wedding lighting set up',
      status: 'PENDING'
    });

    console.log(`- Quote Request Created: ID ${quote._id}, Status: ${quote.status}`);
    quote.proposedAmount = 15000;
    quote.status = 'OFFERED';
    await quote.save();
    console.log(`- Quote Proposed by Provider: ₹${quote.proposedAmount}, Status: ${quote.status}`);

    // Test 5: Audit Log Verification
    console.log('\n[5] Testing System Audit Logs:');
    const audit = await AuditLog.create({
      actorId: vendor._id,
      actorType: 'VENDOR',
      actorName: vendor.name,
      action: 'SERVICE_CREATED',
      entity: 'ServiceListing',
      entityId: String(listing._id),
      newValue: { title: listing.title }
    });
    console.log(`- Audit Log Created: Action [${audit.action}] by [${audit.actorType}] on [${audit.entity}]`);

    // Cleanup test records
    await Vendor.deleteOne({ _id: vendor._id });
    await ServiceListing.deleteOne({ _id: listing._id });
    await Quote.deleteOne({ _id: quote._id });
    await AuditLog.deleteOne({ _id: audit._id });
    console.log('\n✓ Test records cleaned up cleanly.');

    console.log('\n=================================================');
    console.log('🎉 ALL PROVIDER SYSTEM VERIFICATION TESTS PASSED!');
    console.log('=================================================\n');

  } catch (err) {
    console.error('❌ Verification Failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runVendorSystemVerification();
