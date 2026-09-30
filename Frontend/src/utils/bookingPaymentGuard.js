/** Client-side mirrors of Backend/utils/bookingPaymentGuard.js */

export const isAdvanceRequired = (booking) =>
  booking?.requireAdvancePayment === true && Number(booking?.advanceAmount) > 0;

export const isAdvancePaid = (booking) => {
  if (!isAdvanceRequired(booking)) return true;
  return ['advance_paid', 'fully_paid'].includes(booking?.paymentPhase);
};

export const isAdvancePaymentDue = (booking) =>
  String(booking?.status || '').toLowerCase() === 'awaiting_payment'
  && booking?.paymentPhase === 'advance_pending'
  && isAdvanceRequired(booking);

export const isFinalPaymentDue = (booking) =>
  booking?.paymentPhase === 'final_pending'
  && (Number(booking?.balanceAmount) > 0 || Number(booking?.userPayableAmount) > 0);

export const getDueChargeAmount = (booking) => {
  if (isAdvancePaymentDue(booking)) {
    return { amount: Number(booking.advanceAmount) || 0, type: 'advance' };
  }
  if (isFinalPaymentDue(booking) || String(booking?.status || '').toLowerCase() === 'work_done') {
    const amt = Number(booking.balanceAmount || booking.userPayableAmount || booking.finalAmount) || 0;
    if (booking.paymentPhase === 'final_pending' && amt > 0) {
      return { amount: amt, type: 'final' };
    }
  }
  return { amount: Number(booking.finalAmount) || 0, type: 'full' };
};

export const canVendorStartService = (booking) =>
  !isAdvancePaymentDue(booking) && isAdvancePaid(booking);
