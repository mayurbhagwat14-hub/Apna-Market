export const TRACKING_TYPE = {
  LIVE: 'live',
  STATUS_ONLY: 'status_only',
  HYBRID: 'hybrid'
};

export const TRACKING_TYPE_BY_SLUG = {
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

export const normalizeTrackingType = (value) => {
  const raw = String(value || '').toLowerCase().replace(/-/g, '_');
  if (raw === 'statusonly') return TRACKING_TYPE.STATUS_ONLY;
  if (Object.values(TRACKING_TYPE).includes(raw)) return raw;
  return TRACKING_TYPE.LIVE;
};

export const defaultTrackingTypeForSlug = (slug) =>
  TRACKING_TYPE_BY_SLUG[String(slug || '').toLowerCase().trim()] || TRACKING_TYPE.LIVE;

export const resolveTrackingType = ({ category, listing, booking } = {}) => {
  if (booking?.trackingType) return normalizeTrackingType(booking.trackingType);
  if (booking?.tracking?.type) return normalizeTrackingType(booking.tracking.type);
  if (listing?.trackingType) return normalizeTrackingType(listing.trackingType);
  if (category?.trackingType) return normalizeTrackingType(category.trackingType);
  return defaultTrackingTypeForSlug(category?.slug || listing?.categorySlug || booking?.categorySlug);
};

export const usesLiveLocation = (trackingType) => {
  const type = normalizeTrackingType(trackingType);
  return type === TRACKING_TYPE.LIVE || type === TRACKING_TYPE.HYBRID;
};

export const usesPresence = (trackingType) => {
  const type = normalizeTrackingType(trackingType);
  return type === TRACKING_TYPE.STATUS_ONLY || type === TRACKING_TYPE.HYBRID;
};

export const skipsJourney = (trackingType) =>
  normalizeTrackingType(trackingType) === TRACKING_TYPE.STATUS_ONLY;

export const trackingTypeOf = (booking) =>
  resolveTrackingType({
    booking,
    category: booking?.categoryId,
    listing: booking?.serviceId || booking?.serviceListingId
  });

export const isCheckedIn = (booking) => {
  const presence = booking?.tracking?.presence;
  return Boolean(presence?.checkedInAt) && !presence?.checkedOutAt;
};

export const isCheckedOut = (booking) => Boolean(booking?.tracking?.presence?.checkedOutAt);

export const formatPresenceTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};
