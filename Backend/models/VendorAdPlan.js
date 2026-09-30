const mongoose = require('mongoose');

/**
 * VendorAdPlan — Advertisement/Subscription plans created by Admin.
 * Vendors purchase these plans to advertise their shops on the platform.
 * Admin sets price, duration, features, and can toggle plans active/inactive.
 */
const vendorAdPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    unique: true
  },
  tagline: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Plan price is required'],
    min: 0
  },
  // Duration type: 'daily', 'weekly', 'monthly', 'yearly'
  durationType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: [true, 'Duration type is required'],
    default: 'monthly'
  },
  // How many units of the durationType (e.g., 1 month, 3 months, 7 days)
  durationValue: {
    type: Number,
    required: [true, 'Duration value is required'],
    default: 1,
    min: 1
  },
  // Features list (displayed on plan card)
  features: [{
    type: String,
    trim: true
  }],
  // Badge label for the plan card (e.g., "POPULAR", "BEST VALUE", "NEW")
  badge: {
    type: String,
    default: '',
    trim: true
  },
  // Priority/order for display sorting (lower = shown first)
  displayOrder: {
    type: Number,
    default: 0
  },
  // Is this plan currently available for purchase?
  isActive: {
    type: Boolean,
    default: true
  },
  // How many vendors have purchased this plan (stats for admin)
  totalPurchases: {
    type: Number,
    default: 0
  },
  // Total revenue generated from this plan
  totalRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for fetching active plans sorted by display order
vendorAdPlanSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('VendorAdPlan', vendorAdPlanSchema);
