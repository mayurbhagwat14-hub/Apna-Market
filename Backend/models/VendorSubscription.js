const mongoose = require('mongoose');

/**
 * VendorSubscription — Tracks a vendor's subscription purchase.
 * Each purchase creates one record. The latest ACTIVE subscription
 * determines whether the vendor's shop is advertised/live.
 */
const vendorSubscriptionSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorAdPlan',
    required: true
  },
  // Snapshot of plan details at time of purchase (so price changes don't affect old records)
  planSnapshot: {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationType: { type: String, required: true },
    durationValue: { type: Number, required: true },
    features: [{ type: String }]
  },
  // Subscription timeline
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  // Status tracking
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING_PAYMENT'],
    default: 'PENDING_PAYMENT',
    index: true
  },
  // Payment details
  amountPaid: {
    type: Number,
    required: true,
    min: 0
  },
  // GST calculation (18% by default)
  gstAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Razorpay payment details
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'free', 'admin_granted'],
    default: 'razorpay'
  },
  // Receipt / Invoice number for this subscription
  receiptNumber: {
    type: String,
    default: null
  },
  // Auto-renew flag (future use)
  autoRenew: {
    type: Boolean,
    default: false
  },
  // Notes from admin (if manually granted)
  adminNote: {
    type: String,
    default: ''
  },
  // Who cancelled and why (if cancelled)
  cancelledBy: {
    type: String,
    enum: ['vendor', 'admin', 'system', null],
    default: null
  },
  cancelReason: {
    type: String,
    default: ''
  },
  cancelledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for quick lookups
vendorSubscriptionSchema.index({ vendorId: 1, status: 1, endDate: -1 });
vendorSubscriptionSchema.index({ status: 1, endDate: 1 }); // For expiry cron job
vendorSubscriptionSchema.index({ razorpayOrderId: 1 });

/**
 * Virtual: Calculate remaining days
 */
vendorSubscriptionSchema.virtual('remainingDays').get(function () {
  if (this.status !== 'ACTIVE') return 0;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

/**
 * Virtual: Is expired?
 */
vendorSubscriptionSchema.virtual('isExpired').get(function () {
  return new Date() > this.endDate;
});

// Ensure virtuals are included in JSON output
vendorSubscriptionSchema.set('toJSON', { virtuals: true });
vendorSubscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VendorSubscription', vendorSubscriptionSchema);
