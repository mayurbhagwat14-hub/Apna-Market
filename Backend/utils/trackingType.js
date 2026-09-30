const { TRACKING_TYPE, BOOKING_STATUS } = require('./constants');

const VALID_TRACKING_TYPES = Object.values(TRACKING_TYPE);

/** Default tracking UX per official ZEVYGO category slug */
const TRACKING_TYPE_BY_SLUG = {
  'driver-booking': TRACKING_TYPE.LIVE,
  'cook-maharaj-booking': TRACKING_TYPE.LIVE,
  'worker-helper-booking': TRACKING_TYPE.LIVE,
  'tiffin-service-booking': TRACKING_TYPE.LIVE,
  'dj-sound-booking': TRACKING_TYPE.LIVE,
  'photographer-videographer-booking': TRACKING_TYPE.LIVE,
  'makeup-artist-booking': TRACKING_TYPE.LIVE,
  'electrician-booking': TRACKING_TYPE.LIVE,
  'plumber-booking': TRACKING_TYPE.LIVE,
  'ac-refrigerator-wm-ro-service-booking': TRACKING_TYPE.LIVE,
  'pest-control-booking': TRACKING_TYPE.LIVE,
  'housekeeping-cleaning-booking': TRACKING_TYPE.LIVE,
  'healthcare-service-booking': TRACKING_TYPE.STATUS_ONLY,
  'room-booking-rental': TRACKING_TYPE.STATUS_ONLY,
  'marriage-hall-booking': TRACKING_TYPE.STATUS_ONLY,
  'security-guard-booking': TRACKING_TYPE.STATUS_ONLY
};

const normalizeTrackingType = (value) => {
  const raw = String(value || '').toLowerCase().replace(/-/g, '_');
  if (raw === 'statusonly') return TRACKING_TYPE.STATUS_ONLY;
  if (VALID_TRACKING_TYPES.includes(raw)) return raw;
  return TRACKING_TYPE.LIVE;
};

const defaultTrackingTypeForSlug = (slug) => {
  const key = String(slug || '').toLowerCase().trim();
  return TRACKING_TYPE_BY_SLUG[key] || TRACKING_TYPE.LIVE;
};

/**
 * Listing override > category field > slug default > live
 */
const resolveTrackingType = ({ category, listing, booking } = {}) => {
  if (booking?.trackingType) return normalizeTrackingType(booking.trackingType);
  if (booking?.tracking?.type) return normalizeTrackingType(booking.tracking.type);
  if (listing?.trackingType) return normalizeTrackingType(listing.trackingType);
  if (category?.trackingType) return normalizeTrackingType(category.trackingType);
  return defaultTrackingTypeForSlug(category?.slug || listing?.categorySlug || booking?.categorySlug);
};

const usesLiveLocation = (trackingType) => {
  const type = normalizeTrackingType(trackingType);
  return type === TRACKING_TYPE.LIVE || type === TRACKING_TYPE.HYBRID;
};

const usesPresence = (trackingType) => {
  const type = normalizeTrackingType(trackingType);
  return type === TRACKING_TYPE.STATUS_ONLY || type === TRACKING_TYPE.HYBRID;
};

/** Skip journey_started for posted/duration services */
const skipsJourney = (trackingType) =>
  normalizeTrackingType(trackingType) === TRACKING_TYPE.STATUS_ONLY;

const trackingTypeOf = (booking) =>
  normalizeTrackingType(booking?.trackingType || booking?.tracking?.type);

const allowedVendorStatusTransitions = (trackingType) => {
  const type = normalizeTrackingType(trackingType);
  const common = {
    [BOOKING_STATUS.VISITED]: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.WORK_DONE, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.WORK_DONE, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.WORK_DONE]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED]
  };

  if (type === TRACKING_TYPE.STATUS_ONLY) {
    return {
      [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED],
      [BOOKING_STATUS.AWAITING_PAYMENT]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED],
      [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.VISITED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
      [BOOKING_STATUS.ASSIGNED]: [BOOKING_STATUS.VISITED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
      [BOOKING_STATUS.ACCEPTED]: [BOOKING_STATUS.VISITED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
      ...common
    };
  }

  return {
    [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.AWAITING_PAYMENT]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED],
    [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.JOURNEY_STARTED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.ASSIGNED]: [BOOKING_STATUS.JOURNEY_STARTED, BOOKING_STATUS.VISITED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.ACCEPTED]: [BOOKING_STATUS.JOURNEY_STARTED, BOOKING_STATUS.VISITED, BOOKING_STATUS.CANCELLED],
    [BOOKING_STATUS.JOURNEY_STARTED]: [BOOKING_STATUS.VISITED, BOOKING_STATUS.CANCELLED],
    ...common
  };
};

const canEmitLiveLocation = (booking) => {
  if (!usesLiveLocation(trackingTypeOf(booking))) return false;
  const status = String(booking?.status || '').toLowerCase();
  if (trackingTypeOf(booking) === TRACKING_TYPE.HYBRID) {
    return status === BOOKING_STATUS.JOURNEY_STARTED || status === BOOKING_STATUS.VISITED;
  }
  return status === BOOKING_STATUS.JOURNEY_STARTED || status === BOOKING_STATUS.VISITED;
};

const buildTrackingSubdoc = (trackingType) => {
  const type = normalizeTrackingType(trackingType);
  const doc = { type };
  if (usesLiveLocation(type)) {
    doc.live = {
      lat: null,
      lng: null,
      heading: 0,
      lastUpdatedAt: null
    };
  }
  if (usesPresence(type)) {
    doc.presence = {
      checkedInAt: null,
      checkedOutAt: null,
      notes: null
    };
  }
  return doc;
};

module.exports = {
  TRACKING_TYPE_BY_SLUG,
  VALID_TRACKING_TYPES,
  normalizeTrackingType,
  defaultTrackingTypeForSlug,
  resolveTrackingType,
  usesLiveLocation,
  usesPresence,
  skipsJourney,
  trackingTypeOf,
  allowedVendorStatusTransitions,
  canEmitLiveLocation,
  buildTrackingSubdoc
};
