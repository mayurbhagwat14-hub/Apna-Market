/**
 * Admin category flag snapshotted on booking.
 * Undefined/null treated as true (legacy bookings keep bill prepare).
 */
export const canPrepareVendorBill = (booking) => booking?.allowVendorBilling !== false;

/** True when customer payment is settled (online / cash / vendor collected). Case-insensitive. */
export const isPaymentSettled = (booking) => {
  if (!booking) return false;
  if (booking.cashCollected) return true;
  const status = String(booking.paymentStatus || '').toLowerCase().trim();
  return [
    'success',
    'paid',
    'collected_by_vendor',
    'collected',
    'completed'
  ].includes(status);
};
