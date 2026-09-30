/**
 * Clamp listing bookingMode to what Admin allows on the category.
 * Category.bookingMode: INSTANT | SCHEDULED | BOTH | REQUEST_QUOTE
 */
const constrainListingBookingMode = (requestedMode, categoryMode = 'BOTH') => {
  const allowed = String(categoryMode || 'BOTH').toUpperCase();
  const requested = String(requestedMode || allowed).toUpperCase();
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

/** Modes a vendor may pick for a listing given category allow-list */
const listingModeOptionsForCategory = (categoryMode = 'BOTH') => {
  const allowed = String(categoryMode || 'BOTH').toUpperCase();
  if (allowed === 'INSTANT') return [['INSTANT', '⚡ Instant']];
  if (allowed === 'SCHEDULED') return [['SCHEDULED', '📅 Scheduled']];
  if (allowed === 'REQUEST_QUOTE') return [['REQUEST_QUOTE', '💬 Quote Only']];
  return [
    ['INSTANT', '⚡ Instant'],
    ['SCHEDULED', '📅 Scheduled'],
    ['BOTH', '✅ Both']
  ];
};

/** Whether a customer bookingType is allowed for this listing/category mode */
const isBookingTypeAllowed = (bookingType, listingMode, categoryMode) => {
  const effective = constrainListingBookingMode(listingMode, categoryMode);
  const type = String(bookingType || 'scheduled').toLowerCase();
  const instant = type === 'instant';

  if (effective === 'INSTANT') return instant;
  if (effective === 'SCHEDULED') return !instant;
  if (effective === 'REQUEST_QUOTE') return !instant;
  return true; // BOTH
};

module.exports = {
  constrainListingBookingMode,
  listingModeOptionsForCategory,
  isBookingTypeAllowed
};
