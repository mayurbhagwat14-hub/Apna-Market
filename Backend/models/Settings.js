const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['text', 'number', 'select', 'multiselect', 'date', 'time', 'textarea', 'file', 'toggle'],
    required: true
  },
  options: [{ type: String, trim: true }],
  required: { type: Boolean, default: false },
  helpText: { type: String, default: null, trim: true },
  minValue: { type: Number, default: null },
  maxValue: { type: Number, default: null },
  order: { type: Number, default: 0 }
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'global',
    unique: true
  },
  appName: {
    type: String,
    default: 'App'
  },
  appLogo: {
    type: String,
    default: ''
  },
  visitedCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  serviceGstPercentage: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  partsGstPercentage: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  servicePayoutPercentage: {
    type: Number,
    default: 90, // Vendor gets 90% of service base price
    min: 0,
    max: 100
  },
  partsPayoutPercentage: {
    type: Number,
    default: 100, // Vendor gets 100% of parts base price
    min: 0,
    max: 100
  },
  tdsPercentage: {
    type: Number,
    default: 1, // 1% default TDS u/s 194-O
    min: 0,
    max: 100
  },
  platformFeePercentage: {
    type: Number,
    default: 1, // 1% default platform fee
    min: 0,
    max: 100
  },
  vendorCashLimit: {
    type: Number,
    default: 10000,
    min: 0
  },
  cancellationPenalty: {
    type: Number,
    default: 49,
    min: 0
  },
  maxSearchTime: {
    type: Number,
    default: 5, // 5 minutes default
    min: 1
  },
  waveDuration: {
    type: Number,
    default: 60, // 60 seconds per wave default
    min: 10
  },
  searchRadius: {
    type: Number,
    default: 10, // 10 km default search radius
    min: 1
  },
  // Razorpay Settings
  razorpayKeyId: {
    type: String,
    default: null
  },
  razorpayKeySecret: {
    type: String,
    default: null
  },
  razorpayWebhookSecret: {
    type: String,
    default: null
  },
  // Cloudinary Settings
  cloudinaryCloudName: {
    type: String,
    default: null
  },
  cloudinaryApiKey: {
    type: String,
    default: null
  },
  cloudinaryApiSecret: {
    type: String,
    default: null
  },
  // Future extensible fields
  currency: {
    type: String,
    default: 'INR'
  },

  // Billing & Invoice Configuration
  companyName: {
    type: String,
    default: 'TodayMyDream'
  },
  companyGSTIN: {
    type: String,
    default: ''
  },
  companyPAN: {
    type: String,
    default: ''
  },
  companyAddress: {
    type: String,
    default: ''
  },
  companyCity: {
    type: String,
    default: ''
  },
  companyState: {
    type: String,
    default: ''
  },
  companyPincode: {
    type: String,
    default: ''
  },
  companyPhone: {
    type: String,
    default: ''
  },
  companyEmail: {
    type: String,
    default: ''
  },
  appName: {
    type: String,
    default: 'Zevygo'
  },
  appLogo: {
    type: String,
    default: ''
  },

  // Invoice Settings
  invoicePrefix: {
    type: String,
    default: 'INV'
  },
  sacCode: {
    type: String,
    default: '998599'  // Event services SAC code
  },
  currentInvoiceNumber: {
    type: Number,
    default: 0
  },

  // Support Settings
  supportEmail: {
    type: String,
    default: ''
  },
  supportPhone: {
    type: String,
    default: ''
  },
  supportWhatsapp: {
    type: String,
    default: ''
  },
  isOnlinePaymentEnabled: {
    type: Boolean,
    default: true
  },
  /** Percent of total charged as advance after vendor accepts (rest after service). */
  advancePaymentPercent: {
    type: Number,
    default: 30,
    min: 0,
    max: 100
  },
  /** Flat convenience / platform handling fee added to checkout total. */
  convenienceFee: {
    type: Number,
    default: 20,
    min: 0
  },
  /**
   * Reusable listing wizard forms applied across all service categories.
   * Admin creates once; vendors see them on every category (when applyToAll is true).
   */
  commonListingForms: [{
    id: { type: String, required: true },
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['fields', 'menu', 'photos'], default: 'fields' },
    enabled: { type: Boolean, default: true },
    applyToAll: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    fields: [formFieldSchema]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
