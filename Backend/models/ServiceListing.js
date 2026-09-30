const mongoose = require('mongoose');
const { LISTING_STATUS } = require('../utils/constants');

/**
 * ServiceListing Model
 * Represents a vendor's service offering for a specific category.
 * One vendor can have one listing per category.
 * Contains all service-specific information, pricing, availability, area, and documents.
 */
const serviceListingSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  categoryName: {
    type: String,
    required: true,
    trim: true
  },

  // ─── BASIC INFORMATION ───
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  shortDescription: {
    type: String,
    trim: true,
    default: ''
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  languages: [{
    type: String,
    trim: true
  }],

  // ─── STATUS & APPROVAL ───
  status: {
    type: String,
    enum: Object.values(LISTING_STATUS),
    default: LISTING_STATUS.DRAFT,
    index: true
  },
  rejectedReason: {
    type: String,
    default: null
  },
  adminNotes: {
    type: String,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  // ─── BOOKING CONFIGURATION ───
  bookingMode: {
    type: String,
    enum: ['INSTANT', 'SCHEDULED', 'BOTH', 'REQUEST_QUOTE'],
    default: 'BOTH'
  },
  /** Optional override of category trackingType (null = inherit) */
  trackingType: {
    type: String,
    enum: ['live', 'status_only', 'hybrid'],
    required: false
  },
  bookingConfig: {
    minAdvanceBookingMinutes: { type: Number, default: 30 },
    maxAdvanceBookingDays: { type: Number, default: 30 },
    minServiceDurationMinutes: { type: Number, default: 30 },
    maxServiceDurationMinutes: { type: Number, default: 480 },
    autoAcceptBookings: { type: Boolean, default: false },
    requireAdvancePayment: { type: Boolean, default: false },
    advancePaymentPercent: { type: Number, default: 0 }
  },

  // ─── PRICING MODEL ───
  pricingModel: {
    type: String,
    enum: ['FIXED', 'PER_VISIT', 'HOURLY', 'DAILY', 'MONTHLY', 'YEARLY', 'PER_UNIT', 'CUSTOM_QUOTE'],
    default: 'FIXED'
  },
  pricing: {
    basePrice: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 },
    dailyRate: { type: Number, default: 0 },
    monthlyRent: { type: Number, default: 0 },
    yearlyRent: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    visitingCharge: { type: Number, default: 0 },
    labourCharge: { type: Number, default: 0 },
    emergencyCharge: { type: Number, default: 0 },
    nightCharge: { type: Number, default: 0 },
    outstationPrice: { type: Number, default: 0 },
    perKmRate: { type: Number, default: 0 },
    perMealRate: { type: Number, default: 0 },
    perShiftRate: { type: Number, default: 0 },
    halfDayRate: { type: Number, default: 0 },
    fullDayRate: { type: Number, default: 0 },
    packagePrice: { type: Number, default: 0 },
    weeklyRate: { type: Number, default: 0 },
    extraKmCharge: { type: Number, default: 0 },
    driverAllowance: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    maintenanceCharge: { type: Number, default: 0 },
    perSqftRate: { type: Number, default: 0 },
    inspectionCharge: { type: Number, default: 0 },
    perGuardRate: { type: Number, default: 0 }
  },

  // ─── AVAILABILITY ───
  availability: {
    isAvailableNow: { type: Boolean, default: true },
    workingDays: {
      monday: { isOpen: { type: Boolean, default: true }, shifts: [{ start: String, end: String }] },
      tuesday: { isOpen: { type: Boolean, default: true }, shifts: [{ start: String, end: String }] },
      wednesday: { isOpen: { type: Boolean, default: true }, shifts: [{ start: String, end: String }] },
      thursday: { isOpen: { type: Boolean, default: true }, shifts: [{ start: String, end: String }] },
      friday: { isOpen: { type: Boolean, default: true }, shifts: [{ start: String, end: String }] },
      saturday: { isOpen: { type: Boolean, default: true }, shifts: [{ start: String, end: String }] },
      sunday: { isOpen: { type: Boolean, default: false }, shifts: [{ start: String, end: String }] }
    },
    breakTimes: [{ start: String, end: String }],
    blockedDates: [{ type: Date }],
    holidays: [{ type: Date }],
    temporaryUnavailable: { type: Boolean, default: false },
    unavailableUntil: { type: Date, default: null }
  },

  // ─── SERVICE AREA ───
  serviceArea: {
    city: { type: String, trim: true, default: '' },
    areas: [{ type: String, trim: true }],
    pincodes: [{ type: String, trim: true }],
    radiusKm: { type: Number, default: 10, min: 1 }
  },
  serviceAreaRadiusKm: {
    type: Number,
    default: 10,
    min: 1
  },

  // ─── CANCELLATION POLICY ───
  cancellation: {
    cancellationAllowed: { type: Boolean, default: true },
    cancellationWindowHours: { type: Number, default: 24 },
    cancellationFeePercent: { type: Number, default: 0 },
    reschedulingAllowed: { type: Boolean, default: true },
    reschedulingWindowHours: { type: Number, default: 12 }
  },

  // ─── DYNAMIC FORM ANSWERS (Category-Specific Fields) ───
  dynamicFormAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  pricingFormAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  availabilityFormAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  serviceAreaFormAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  bookingRulesFormAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  documentsFormAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Answers keyed by listingForm id/key: { [formId]: { fieldKey: value } }
  listingFormAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // ─── DOCUMENTS (Service-Specific Certificates, Licenses) ───
  documents: [{
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['license', 'certificate', 'insurance', 'registration', 'permit', 'other'], default: 'other' },
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  }],

  // ─── PORTFOLIO / SERVICE PHOTOS ───
  portfolioPhotos: [{
    type: String
  }],
  portfolioVideos: [{
    type: String
  }],

  // ─── CATALOG ITEMS (Zomato-Style Sub-Services/Menu) ───
  catalogItems: [mongoose.Schema.Types.Mixed],

  // ─── VERSIONING: Keeps approved version live while edits are reviewed ───
  approvedVersion: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  hasPendingEdits: {
    type: Boolean,
    default: false
  },
  pendingEditSubmittedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// ─── INDEXES ───
serviceListingSchema.index({ vendorId: 1, categoryId: 1 }, { unique: true });
serviceListingSchema.index({ status: 1, categoryName: 1 });
serviceListingSchema.index({ status: 1, vendorId: 1 });
serviceListingSchema.index({ categoryId: 1, status: 1 });
serviceListingSchema.index({ 'serviceArea.city': 1, status: 1 });
serviceListingSchema.index({ 'serviceArea.pincodes': 1, status: 1 });

module.exports = mongoose.model('ServiceListing', serviceListingSchema);
