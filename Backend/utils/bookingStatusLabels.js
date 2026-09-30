/**
 * Contextual booking status labels — delivery vs on-site service.
 */
const { BOOKING_STATUS } = require('./constants');
const { skipsJourney } = require('./trackingType');

const DELIVERY_SLUGS = new Set(['tiffin', 'food', 'meals', 'catering']);

const normalizeFulfillment = (type) =>
  String(type || 'ON_SITE').toUpperCase() === 'DELIVERY' ? 'DELIVERY' : 'ON_SITE';

const resolveServiceFulfillmentType = ({ category, listing, booking } = {}) => {
  if (booking?.serviceFulfillmentType) {
    return normalizeFulfillment(booking.serviceFulfillmentType);
  }
  if (category?.serviceFulfillmentType) {
    return normalizeFulfillment(category.serviceFulfillmentType);
  }
  const slug = String(category?.slug || listing?.categorySlug || '').toLowerCase();
  if (DELIVERY_SLUGS.has(slug)) return 'DELIVERY';
  return 'ON_SITE';
};

const STATUS_LABELS = {
  DELIVERY: {
    [BOOKING_STATUS.SEARCHING]: 'Finding provider',
    [BOOKING_STATUS.REQUESTED]: 'Waiting for provider',
    [BOOKING_STATUS.AWAITING_PAYMENT]: 'Pay advance to confirm',
    [BOOKING_STATUS.CONFIRMED]: 'Order confirmed',
    [BOOKING_STATUS.ACCEPTED]: 'Order accepted',
    [BOOKING_STATUS.ASSIGNED]: 'Provider assigned',
    [BOOKING_STATUS.JOURNEY_STARTED]: 'Out for delivery',
    [BOOKING_STATUS.VISITED]: 'Arrived at your door',
    [BOOKING_STATUS.IN_PROGRESS]: 'Handing over',
    [BOOKING_STATUS.WORK_DONE]: 'Delivered — pay balance',
    [BOOKING_STATUS.COMPLETED]: 'Order complete',
    [BOOKING_STATUS.CANCELLED]: 'Cancelled',
    [BOOKING_STATUS.REJECTED]: 'Declined'
  },
  ON_SITE: {
    [BOOKING_STATUS.SEARCHING]: 'Finding provider',
    [BOOKING_STATUS.REQUESTED]: 'Waiting for provider',
    [BOOKING_STATUS.AWAITING_PAYMENT]: 'Pay advance to confirm',
    [BOOKING_STATUS.CONFIRMED]: 'Booking confirmed',
    [BOOKING_STATUS.ACCEPTED]: 'Booking accepted',
    [BOOKING_STATUS.ASSIGNED]: 'Provider assigned',
    [BOOKING_STATUS.JOURNEY_STARTED]: 'Provider on the way',
    [BOOKING_STATUS.VISITED]: 'Provider arrived',
    [BOOKING_STATUS.IN_PROGRESS]: 'Service in progress',
    [BOOKING_STATUS.WORK_DONE]: 'Work done — pay balance',
    [BOOKING_STATUS.COMPLETED]: 'Completed',
    [BOOKING_STATUS.CANCELLED]: 'Cancelled',
    [BOOKING_STATUS.REJECTED]: 'Declined'
  }
};

const VENDOR_ACTION_LABELS = {
  DELIVERY: {
    startJourney: 'Start Delivery',
    arrived: 'Arrived at customer',
    workDone: 'Mark Delivered'
  },
  ON_SITE: {
    startJourney: 'Start Journey',
    arrived: "I've Arrived",
    workDone: 'Mark Work Done'
  }
};

const NOTIFICATION_COPY = {
  DELIVERY: {
    journeyStarted: 'Your order is out for delivery!',
    vendorReached: 'Delivery partner has arrived. Share OTP to receive your order.',
    visitVerified: 'Order handover verified. Enjoy!',
    workDone: 'Your order has been delivered.'
  },
  ON_SITE: {
    journeyStarted: 'Your provider is on the way!',
    vendorReached: 'Provider has reached your location. Share OTP to start service.',
    visitVerified: 'Visit verified. Service can begin.',
    workDone: 'Service work has been completed.'
  }
};

const getStatusLabel = (status, fulfillmentType = 'ON_SITE') => {
  const key = normalizeFulfillment(fulfillmentType);
  const normalized = String(status || '').toLowerCase();
  return STATUS_LABELS[key][normalized]
    || STATUS_LABELS.ON_SITE[normalized]
    || String(status || 'pending').replace(/_/g, ' ');
};

const getVendorActionLabels = (fulfillmentType = 'ON_SITE') =>
  VENDOR_ACTION_LABELS[normalizeFulfillment(fulfillmentType)];

const getNotificationCopy = (event, fulfillmentType = 'ON_SITE') => {
  const key = normalizeFulfillment(fulfillmentType);
  return NOTIFICATION_COPY[key][event] || NOTIFICATION_COPY.ON_SITE[event] || '';
};

/** Statuses where live GPS tracking is meaningful for the customer */
const isLiveTrackingStatus = (status, trackingType) => {
  if (skipsJourney(trackingType)) return false;
  return [BOOKING_STATUS.JOURNEY_STARTED, BOOKING_STATUS.VISITED].includes(String(status || '').toLowerCase());
};

module.exports = {
  resolveServiceFulfillmentType,
  getStatusLabel,
  getVendorActionLabels,
  getNotificationCopy,
  isLiveTrackingStatus,
  normalizeFulfillment
};
