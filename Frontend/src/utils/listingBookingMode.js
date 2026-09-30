/**
 * Booking mode labels & checkout validation (mirrors Backend/utils/listingBookingMode.js).
 */

export const BOOKING_MODE_META = {
  INSTANT: { emoji: '⚡', label: 'Instant', chipClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  SCHEDULED: { emoji: '📅', label: 'Scheduled', chipClass: 'bg-violet-100 text-violet-800 border-violet-200' },
  BOTH: { emoji: '✅', label: 'Instant & Scheduled', chipClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REQUEST_QUOTE: { emoji: '💬', label: 'Quote only', chipClass: 'bg-slate-100 text-slate-700 border-slate-200' }
};

export const normalizeMode = (mode) => String(mode || 'BOTH').toUpperCase();

export const constrainListingBookingMode = (requestedMode, categoryMode = 'BOTH') => {
  const allowed = normalizeMode(categoryMode);
  const requested = normalizeMode(requestedMode || allowed);
  const valid = new Set(['INSTANT', 'SCHEDULED', 'BOTH', 'REQUEST_QUOTE']);
  const mode = valid.has(requested) ? requested : allowed;
  if (allowed === 'BOTH') {
    return mode === 'REQUEST_QUOTE' ? 'REQUEST_QUOTE' : (['INSTANT', 'SCHEDULED', 'BOTH'].includes(mode) ? mode : 'BOTH');
  }
  if (allowed === 'INSTANT') return 'INSTANT';
  if (allowed === 'SCHEDULED') return 'SCHEDULED';
  if (allowed === 'REQUEST_QUOTE') return 'REQUEST_QUOTE';
  return allowed;
};

export const getBookingModeMeta = (mode) =>
  BOOKING_MODE_META[normalizeMode(mode)] || BOOKING_MODE_META.BOTH;

/** Resolve category badge mode from bookingMode or legacy supportedBookingTypes */
export const resolveCategoryBookingMode = (category = {}) => {
  if (category.bookingMode) return normalizeMode(category.bookingMode);
  const types = category.supportedBookingTypes || [];
  if (types.includes('instant') && (types.includes('scheduled') || types.includes('both'))) return 'BOTH';
  if (types.includes('instant')) return 'INSTANT';
  if (types.includes('scheduled')) return 'SCHEDULED';
  if (types.includes('request_quote')) return 'REQUEST_QUOTE';
  return 'BOTH';
};

export const customerBookingTypeOptions = (listingMode, categoryMode) => {
  const effective = constrainListingBookingMode(listingMode, categoryMode);
  if (effective === 'INSTANT') return [{ value: 'instant', label: '⚡ Instant (ASAP)' }];
  if (effective === 'SCHEDULED') return [{ value: 'scheduled', label: '📅 Scheduled slot' }];
  if (effective === 'REQUEST_QUOTE') return [{ value: 'scheduled', label: '💬 Request quote' }];
  return [
    { value: 'instant', label: '⚡ Instant' },
    { value: 'scheduled', label: '📅 Scheduled' }
  ];
};

export const isBookingTypeAllowed = (bookingType, listingMode, categoryMode) => {
  const effective = constrainListingBookingMode(listingMode, categoryMode);
  const instant = String(bookingType || 'scheduled').toLowerCase() === 'instant';
  if (effective === 'INSTANT') return instant;
  if (effective === 'SCHEDULED') return !instant;
  if (effective === 'REQUEST_QUOTE') return !instant;
  return true;
};

export const defaultBookingTypeForListing = (listingMode, categoryMode) => {
  const effective = constrainListingBookingMode(listingMode, categoryMode);
  if (effective === 'INSTANT') return 'instant';
  return 'scheduled';
};
