/**
 * Application Constants
 */

// User Roles
const USER_ROLES = {
  USER: 'USER',
  VENDOR: 'VENDOR',
  /** @deprecated ZEVYGO has no Worker role — kept for legacy JWT compatibility */
  WORKER: 'WORKER',
  ADMIN: 'ADMIN'
};

// Token Types
const TOKEN_TYPES = {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PHONE_VERIFICATION: 'PHONE_VERIFICATION',
  REFRESH_TOKEN: 'REFRESH_TOKEN'
};

// Vendor Approval Status
const VENDOR_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
};

// Worker Status
const WORKER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE'
};

// Booking Status
const BOOKING_STATUS = {
  SEARCHING: 'searching', // Initial search phase
  REQUESTED: 'requested', // Waiting for vendor to accept
  AWAITING_PAYMENT: 'awaiting_payment', // Accepted by vendor, waiting for user payment
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACCEPTED: 'accepted',
  ASSIGNED: 'assigned',
  JOURNEY_STARTED: 'journey_started',
  VISITED: 'visited',
  IN_PROGRESS: 'in_progress',
  WORK_DONE: 'work_done',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  COLLECTED_BY_VENDOR: 'collected_by_vendor',
  PLAN_COVERED: 'plan_covered' // For plan_benefit bookings until bill is finalized
};

// Service Status
const SERVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted'
};

// Bill Status
const BILL_STATUS = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  PAID: 'paid',
  CANCELLED: 'cancelled'
};

// Booking Type
const BOOKING_TYPE = {
  INSTANT: 'instant',
  SCHEDULED: 'scheduled'
};

// ─── NEW: Service Listing Status ───
const LISTING_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  PAUSED: 'PAUSED',
  SUSPENDED: 'SUSPENDED'
};

// ─── NEW: KYC Verification Status ───
const KYC_STATUS = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  RESUBMISSION_REQUIRED: 'RESUBMISSION_REQUIRED'
};

// ─── NEW: Service fulfillment (delivery vs on-site visit) ───
const SERVICE_FULFILLMENT_TYPE = {
  DELIVERY: 'DELIVERY',
  ON_SITE: 'ON_SITE'
};

// ─── Tracking UX (live GPS vs presence/duration vs hybrid) ───
const TRACKING_TYPE = {
  LIVE: 'live',
  STATUS_ONLY: 'status_only',
  HYBRID: 'hybrid'
};

// ─── NEW: Booking Mode (per service listing) ───
const BOOKING_MODE = {
  INSTANT: 'INSTANT',
  SCHEDULED: 'SCHEDULED',
  BOTH: 'BOTH',
  REQUEST_QUOTE: 'REQUEST_QUOTE'
};

// ─── NEW: Pricing Model ───
const PRICING_MODEL = {
  FIXED: 'FIXED',
  PER_VISIT: 'PER_VISIT',
  HOURLY: 'HOURLY',
  DAILY: 'DAILY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  PER_UNIT: 'PER_UNIT',
  CUSTOM_QUOTE: 'CUSTOM_QUOTE'
};

// ─── NEW: Vendor Account Status ───
const VENDOR_ACCOUNT_STATUS = {
  INCOMPLETE: 'INCOMPLETE',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
  BLOCKED: 'BLOCKED'
};

module.exports = {
  USER_ROLES,
  TOKEN_TYPES,
  VENDOR_STATUS,
  WORKER_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SERVICE_STATUS,
  BILL_STATUS,
  BOOKING_TYPE,
  LISTING_STATUS,
  KYC_STATUS,
  BOOKING_MODE,
  PRICING_MODEL,
  VENDOR_ACCOUNT_STATUS,
  SERVICE_FULFILLMENT_TYPE,
  TRACKING_TYPE
};
