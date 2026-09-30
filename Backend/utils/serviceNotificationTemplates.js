/**
 * Service-aware push notification copy — keyed by ZEVYGO category slug.
 * Used when a user pays for a booking so notifications match the booked service.
 */

const TITLE_KEYWORD_TO_SLUG = [
  { keys: ['driver', 'chauffeur'], slug: 'driver-booking' },
  { keys: ['cook', 'maharaj', 'chef'], slug: 'cook-maharaj-booking' },
  { keys: ['worker', 'helper', 'labour', 'loading'], slug: 'worker-helper-booking' },
  { keys: ['tiffin', 'meal subscription'], slug: 'tiffin-service-booking' },
  { keys: ['dj', 'sound system', 'sound booking'], slug: 'dj-sound-booking' },
  { keys: ['photo', 'videograph', 'reels', 'camera'], slug: 'photographer-videographer-booking' },
  { keys: ['makeup', 'bridal', 'salon'], slug: 'makeup-artist-booking' },
  { keys: ['health', 'nurse', 'attendant', 'caregiver'], slug: 'healthcare-service-booking' },
  { keys: ['marriage hall', 'banquet', 'wedding hall'], slug: 'marriage-hall-booking' },
  { keys: ['room rent', 'pg ', 'hostel'], slug: 'room-booking-rental' },
  { keys: ['security', 'guard', 'bouncer'], slug: 'security-guard-booking' },
  { keys: ['clean', 'housekeeping', 'deep clean'], slug: 'housekeeping-cleaning-booking' },
  { keys: ['electric', 'wiring', 'fan repair', 'switch'], slug: 'electrician-booking' },
  { keys: ['plumb', 'tap', 'leak', 'pipe'], slug: 'plumber-booking' },
  { keys: ['ac ', 'air condition', 'fridge', 'refrigerator', 'washing machine', 'ro ', 'water purifier'], slug: 'ac-refrigerator-wm-ro-service-booking' },
  { keys: ['pest', 'cockroach', 'termite'], slug: 'pest-control-booking' },
];

const SERVICE_TEMPLATES = {
  'driver-booking': {
    label: 'Driver Booking',
    emoji: '🚗',
    userTitle: 'Driver Booking — Payment Successful',
    userMessage: 'Your driver booking payment of ₹{amount} is confirmed ({bookingNumber}). We are assigning your driver.',
    vendorTitle: 'Driver Booking — Payment Received',
    vendorMessage: 'Customer paid ₹{amount} for driver booking {bookingNumber}. Accept and start the trip.',
  },
  'cook-maharaj-booking': {
    label: 'Cook / Maharaj',
    emoji: '👨‍🍳',
    userTitle: 'Cook Booking — Payment Successful',
    userMessage: '₹{amount} paid for {serviceName} ({bookingNumber}). Your cook will arrive as scheduled.',
    vendorTitle: 'Cook Booking — Payment Received',
    vendorMessage: 'Payment of ₹{amount} received for cook service {bookingNumber}.',
  },
  'worker-helper-booking': {
    label: 'Worker / Helper',
    emoji: '💪',
    userTitle: 'Helper Booking — Payment Successful',
    userMessage: '₹{amount} paid for helper service ({bookingNumber}). Your worker team will be assigned soon.',
    vendorTitle: 'Helper Booking — Payment Received',
    vendorMessage: 'Customer paid ₹{amount} for helper booking {bookingNumber}.',
  },
  'tiffin-service-booking': {
    label: 'Tiffin Service',
    emoji: '🍱',
    userTitle: 'Tiffin Order — Payment Successful',
    userMessage: '₹{amount} paid for your tiffin order ({bookingNumber}). Fresh meals will be delivered on schedule.',
    vendorTitle: 'Tiffin Order — Payment Received',
    vendorMessage: 'Tiffin payment of ₹{amount} received for order {bookingNumber}. Prepare and dispatch.',
  },
  'dj-sound-booking': {
    label: 'DJ & Sound',
    emoji: '🎵',
    userTitle: 'DJ & Sound — Payment Successful',
    userMessage: '₹{amount} paid for DJ & sound setup ({bookingNumber}). Your event audio is confirmed.',
    vendorTitle: 'DJ Booking — Payment Received',
    vendorMessage: 'DJ/sound payment of ₹{amount} received for booking {bookingNumber}.',
  },
  'photographer-videographer-booking': {
    label: 'Photography',
    emoji: '📸',
    userTitle: 'Photography — Payment Successful',
    userMessage: '₹{amount} paid for photography/videography ({bookingNumber}). Your shoot is confirmed.',
    vendorTitle: 'Photography — Payment Received',
    vendorMessage: 'Photo/video payment of ₹{amount} received for booking {bookingNumber}.',
  },
  'makeup-artist-booking': {
    label: 'Makeup Artist',
    emoji: '💄',
    userTitle: 'Makeup Booking — Payment Successful',
    userMessage: '₹{amount} paid for makeup service ({bookingNumber}). Your artist will reach on time.',
    vendorTitle: 'Makeup Booking — Payment Received',
    vendorMessage: 'Makeup service payment of ₹{amount} received for {bookingNumber}.',
  },
  'healthcare-service-booking': {
    label: 'Healthcare',
    emoji: '🏥',
    userTitle: 'Healthcare Service — Payment Successful',
    userMessage: '₹{amount} paid for healthcare service ({bookingNumber}). Nurse/attendant will be assigned.',
    vendorTitle: 'Healthcare — Payment Received',
    vendorMessage: 'Healthcare payment of ₹{amount} received for booking {bookingNumber}.',
  },
  'marriage-hall-booking': {
    label: 'Marriage Hall',
    emoji: '🎊',
    userTitle: 'Hall Booking — Payment Successful',
    userMessage: '₹{amount} paid for marriage/banquet hall ({bookingNumber}). Your venue slot is reserved.',
    vendorTitle: 'Hall Booking — Payment Received',
    vendorMessage: 'Hall booking payment of ₹{amount} received for {bookingNumber}.',
  },
  'room-booking-rental': {
    label: 'Room Rental',
    emoji: '🏠',
    userTitle: 'Room Booking — Payment Successful',
    userMessage: '₹{amount} paid for room rental ({bookingNumber}). Your stay is confirmed.',
    vendorTitle: 'Room Booking — Payment Received',
    vendorMessage: 'Room rental payment of ₹{amount} received for {bookingNumber}.',
  },
  'security-guard-booking': {
    label: 'Security Guard',
    emoji: '🛡️',
    userTitle: 'Security Booking — Payment Successful',
    userMessage: '₹{amount} paid for security service ({bookingNumber}). Guards will be deployed as scheduled.',
    vendorTitle: 'Security — Payment Received',
    vendorMessage: 'Security service payment of ₹{amount} received for {bookingNumber}.',
  },
  'housekeeping-cleaning-booking': {
    label: 'Home Cleaning',
    emoji: '✨',
    userTitle: 'Cleaning Service — Payment Successful',
    userMessage: '₹{amount} paid for home cleaning ({bookingNumber}). Our team will arrive at your slot.',
    vendorTitle: 'Cleaning — Payment Received',
    vendorMessage: 'Cleaning payment of ₹{amount} received for booking {bookingNumber}.',
  },
  'electrician-booking': {
    label: 'Electrician',
    emoji: '⚡',
    userTitle: 'Electrician — Payment Successful',
    userMessage: '₹{amount} paid for electrician service ({bookingNumber}). A verified electrician will visit you.',
    vendorTitle: 'Electrician — Payment Received',
    vendorMessage: 'Electrician payment of ₹{amount} received for {bookingNumber}.',
  },
  'plumber-booking': {
    label: 'Plumber',
    emoji: '🔧',
    userTitle: 'Plumber — Payment Successful',
    userMessage: '₹{amount} paid for plumbing service ({bookingNumber}). Your plumber is on the way.',
    vendorTitle: 'Plumber — Payment Received',
    vendorMessage: 'Plumbing payment of ₹{amount} received for {bookingNumber}.',
  },
  'ac-refrigerator-wm-ro-service-booking': {
    label: 'Appliance Service',
    emoji: '❄️',
    userTitle: 'Appliance Service — Payment Successful',
    userMessage: '₹{amount} paid for {serviceName} ({bookingNumber}). Technician visit is confirmed.',
    vendorTitle: 'Appliance Service — Payment Received',
    vendorMessage: 'Appliance repair payment of ₹{amount} received for {bookingNumber}.',
  },
  'pest-control-booking': {
    label: 'Pest Control',
    emoji: '🐜',
    userTitle: 'Pest Control — Payment Successful',
    userMessage: '₹{amount} paid for pest control ({bookingNumber}). Treatment will be scheduled shortly.',
    vendorTitle: 'Pest Control — Payment Received',
    vendorMessage: 'Pest control payment of ₹{amount} received for {bookingNumber}.',
  },
};

const DEFAULT_TEMPLATE = {
  label: 'Service',
  emoji: '✅',
  userTitle: 'Payment Successful',
  userMessage: 'Payment of ₹{amount} for {serviceName} ({bookingNumber}) was successful. Thank you!',
  vendorTitle: 'Payment Received',
  vendorMessage: 'Customer paid ₹{amount} for booking {bookingNumber}. Service is confirmed.',
};

const fmt = (template, vars) =>
  String(template || '').replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');

const resolveServiceSlug = ({ category, booking } = {}) => {
  if (category?.slug) return category.slug;

  const haystack = [
    booking?.serviceName,
    booking?.serviceCategory,
    booking?.catalogItemTitle,
    ...(booking?.bookedItems || []).map((i) => i?.serviceName || i?.card?.title),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!haystack) return null;

  for (const rule of TITLE_KEYWORD_TO_SLUG) {
    if (rule.keys.some((k) => haystack.includes(k))) return rule.slug;
  }
  return null;
};

const getTemplate = (serviceSlug) =>
  (serviceSlug && SERVICE_TEMPLATES[serviceSlug]) || DEFAULT_TEMPLATE;

/**
 * Build user + vendor notification payloads for payment events.
 */
const buildPaymentNotifications = ({
  booking,
  category = null,
  amount = 0,
  paymentMethod = 'online',
  isFinalPayment = false,
} = {}) => {
  const serviceSlug = resolveServiceSlug({ category, booking });
  const template = getTemplate(serviceSlug);
  const serviceName = booking?.serviceName || booking?.catalogItemTitle || template.label;
  const bookingNumber = booking?.bookingNumber || '';
  const vars = {
    amount: Number(amount) || 0,
    bookingNumber,
    serviceName,
    paymentMethod,
  };

  let userTitle = `${template.emoji} ${template.userTitle}`;
  let userMessage = fmt(template.userMessage, vars);
  let vendorTitle = template.vendorTitle;
  let vendorMessage = fmt(template.vendorMessage, vars);

  if (isFinalPayment) {
    userTitle = `${template.emoji} ${template.label} — Fully Paid`;
    userMessage = `Final payment of ₹${vars.amount} received for ${serviceName} (${bookingNumber}). Service completed!`;
    vendorTitle = `${template.label} — Job Completed & Paid`;
    vendorMessage = `Final payment ₹${vars.amount} received for ${bookingNumber}. Job marked complete.`;
  } else if (paymentMethod === 'wallet') {
    userMessage = userMessage.replace('paid', 'paid via wallet');
  } else if (paymentMethod === 'cash') {
    userTitle = `${template.emoji} ${template.label} — Cash Received`;
    userMessage = `Cash payment of ₹${vars.amount} recorded for ${serviceName} (${bookingNumber}).`;
    vendorTitle = `${template.label} — Cash Collected`;
    vendorMessage = `Cash ₹${vars.amount} collected for ${bookingNumber}.`;
  }

  return {
    serviceSlug: serviceSlug || 'general',
    serviceKey: serviceSlug || 'general',
    categoryTitle: category?.title || booking?.serviceCategory || template.label,
    user: { title: userTitle, message: userMessage },
    vendor: { title: vendorTitle, message: vendorMessage },
  };
};

module.exports = {
  SERVICE_TEMPLATES,
  resolveServiceSlug,
  getTemplate,
  buildPaymentNotifications,
};
