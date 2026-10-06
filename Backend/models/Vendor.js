const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { VENDOR_STATUS } = require('../utils/constants');

const vendorCategoryEnrollmentSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(VENDOR_STATUS),
    default: VENDOR_STATUS.PENDING
  },
  documents: [{
    label: { type: String, required: true },
    url: { type: String, required: true }
  }],
  appliedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedReason: {
    type: String,
    default: null
  },
  dynamicAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: true });

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['vendor'],
    default: 'vendor'
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  password: {
    type: String,
    select: false
  },
  businessName: {
    type: String,
    trim: true
  },
  service: {
    type: [String], // Changed to array for multiple categories
    default: [],
    // required: [true, 'Please provide at least one service category'] 
  },
  categories: {
    type: [String],
    default: []
  },
  skills: {
    type: [String],
    default: []
  },
  // Dynamic form answers filled by vendor during onboarding per category
  serviceDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dynamicFormAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Per-category enrollment applications and approval status
  categoryEnrollments: [vendorCategoryEnrollmentSchema],
  aadhar: {
    number: {
      type: String,
      required: [true, 'Please provide Aadhar number'],
      trim: true
    },
    document: {
      type: String, // Cloudinary URL (Front Side)
      required: [true, 'Please upload Aadhar Front document']
    },
    backDocument: {
      type: String, // Cloudinary URL (Back Side)
      required: [true, 'Please upload Aadhar Back document']
    }
  },
  pan: {
    number: {
      type: String,
      required: [true, 'Please provide PAN number'],
      trim: true,
      uppercase: true
    },
    document: {
      type: String, // Cloudinary URL
      required: [true, 'Please upload PAN document']
    }
  },
  otherDocuments: [{
    type: String // Cloudinary URLs
  }],
  accountStatus: {
    type: String,
    enum: ['INCOMPLETE', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'BLOCKED'],
    default: 'INCOMPLETE',
    index: true
  },
  providerType: {
    type: String,
    enum: ['INDIVIDUAL', 'BUSINESS'],
    default: 'INDIVIDUAL'
  },
  businessDetails: {
    businessName: { type: String, trim: true, default: null },
    businessLogo: { type: String, default: null },
    businessDescription: { type: String, trim: true, default: null },
    businessType: { type: String, default: null },
    teamSize: { type: Number, default: 1 },
    gstin: { type: String, trim: true, uppercase: true, default: null },
    businessAddress: { type: String, trim: true, default: null }
  },
  bankDetails: {
    accountHolderName: { type: String, trim: true, default: null },
    accountNumber: { type: String, trim: true, default: null },
    ifscCode: { type: String, trim: true, uppercase: true, default: null },
    bankName: { type: String, trim: true, default: null },
    upiId: { type: String, trim: true, default: null },
    isVerified: { type: Boolean, default: false }
  },
  profileCompletion: {
    type: Number,
    default: 20,
    min: 0,
    max: 100
  },
  blockedDates: [{
    type: Date
  }],
  holidayDates: [{
    type: Date
  }],
  isAvailableNow: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: Object.values(VENDOR_STATUS),
    default: VENDOR_STATUS.PENDING
  },
  approvalDate: {
    type: Date
  },
  rejectedReason: {
    type: String
  },
  profilePhoto: {
    type: String,
    default: null
  },
  address: {
    fullAddress: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  wallet: {
    dues: {
      type: Number,
      default: 0 // Amount owed TO admin (from cash collection)
    },
    earnings: {
      type: Number,
      default: 0 // Amount owed BY admin (net income from jobs)
    },
    totalCashCollected: {
      type: Number,
      default: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0
    },
    totalSettled: {
      type: Number,
      default: 0
    },
    cashLimit: {
      type: Number,
      default: 10000
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockedAt: {
      type: Date,
      default: null
    },
    blockReason: {
      type: String,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // ─── LOCAL STORE MARKETING & PROMOTIONS ───
  shopPhotos: [{
    url: { type: String, required: true },
    caption: { type: String, default: '' },
    category: { type: String, default: 'Storefront' }, // Storefront, Interior, Counter, Products, Menu
    uploadedAt: { type: Date, default: Date.now },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    rejectedReason: { type: String, default: null }
  }],
  offers: [{
    title: { type: String, required: true },
    tagline: { type: String, default: '' },
    discountBadge: { type: String, default: 'OFFER' }, // e.g. "20% OFF", "FLAT ₹100 OFF", "BOGO"
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    offerType: { type: String, enum: ['PERCENTAGE', 'FLAT', 'BOGO', 'FESTIVE', 'SPECIAL'], default: 'PERCENTAGE' },
    code: { type: String, default: 'APNAOFFER' },
    imageUrl: { type: String, default: '' },
    validTill: { type: Date, default: null },
    terms: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    viewsCount: { type: Number, default: 0 },
    claimsCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    rejectedReason: { type: String, default: null }
  }],
  marketingStats: {
    storeViews: { type: Number, default: 1240 },
    offerClicks: { type: Number, default: 186 },
    inquiriesCalls: { type: Number, default: 34 },
    customerLikes: { type: Number, default: 92 }
  },
  // Settings
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    soundAlerts: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    serviceRange: {
      type: Number,
      default: 10, // Default 10km service range for the vendor
      min: 1
    }
  },
  // Real-time Location
  location: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  // GeoJSON Location for 2dsphere indexing (fast geo queries)
  geoLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  // Real-time Online Status
  isOnline: {
    type: Boolean,
    default: false,
    index: true
  },
  lastSeenAt: {
    type: Date,
    default: null
  },
  currentSocketId: {
    type: String,
    default: null
  },
  // Availability Status
  availability: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'ON_JOB', 'OFFLINE'],
    default: 'OFFLINE',
    index: true
  },
  // Rating & Stats
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalJobs: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  cancelledJobs: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  // Business Hours
  businessHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
  },

  // FCM Push Notification Tokens
  fcmTokens: {
    type: [String],
    default: []
  },
  fcmTokenMobile: {
    type: [String],
    default: []
  },
  loginSessionId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
vendorSchema.index({ approvalStatus: 1 });
vendorSchema.index({ 'wallet.earnings': -1 });
vendorSchema.index({ geoLocation: '2dsphere' }); // Fast geo queries
vendorSchema.index({ isOnline: 1, availability: 1, approvalStatus: 1 }); // Compound index for vendor search
vendorSchema.index({ 'categoryEnrollments.categoryId': 1, 'categoryEnrollments.status': 1 }); // Index for category-gated queries


// Hash password before saving
vendorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
vendorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Vendor', vendorSchema);

