/**
 * Payment enforcement helpers for booking lifecycle.
 * Advance (when category requires it) must be paid before service starts.
 * Final balance must be settled before booking is marked completed (except cash-at-door collection).
 */
const { BOOKING_STATUS } = require('./constants');

const ADVANCE_SETTLED_PHASES = new Set(['advance_paid', 'fully_paid']);

const isAdvanceRequired = (booking) =>
  booking?.requireAdvancePayment === true && Number(booking?.advanceAmount) > 0;

const isAdvancePaid = (booking) => {
  if (!isAdvanceRequired(booking)) return true;
  return ADVANCE_SETTLED_PHASES.has(booking?.paymentPhase);
};

const getDueChargeAmount = (booking) => {
  if (!booking) return { amount: 0, type: null };

  if (
    booking.status === BOOKING_STATUS.AWAITING_PAYMENT
    && booking.paymentPhase === 'advance_pending'
  ) {
    return { amount: Number(booking.advanceAmount) || 0, type: 'advance' };
  }

  if (
    (booking.status === BOOKING_STATUS.WORK_DONE || booking.paymentPhase === 'final_pending')
    && booking.paymentPhase !== 'fully_paid'
  ) {
    return {
      amount: Number(booking.balanceAmount || booking.userPayableAmount || booking.finalAmount) || 0,
      type: 'final'
    };
  }

  return { amount: Number(booking.finalAmount) || 0, type: 'full' };
};

const isFinalPaymentDue = (booking) => {
  const { type, amount } = getDueChargeAmount(booking);
  return type === 'final' && amount > 0;
};

const assertCanStartService = (booking) => {
  if (booking?.status === BOOKING_STATUS.AWAITING_PAYMENT) {
    return {
      ok: false,
      code: 'ADVANCE_PENDING',
      message: 'Customer must pay advance before service can start.'
    };
  }
  if (isAdvanceRequired(booking) && !isAdvancePaid(booking)) {
    return {
      ok: false,
      code: 'ADVANCE_PENDING',
      message: 'Advance payment is pending. Service cannot start yet.'
    };
  }
  return { ok: true };
};

const assertCanCompleteBooking = (booking) => {
  if (isFinalPaymentDue(booking)) {
    return {
      ok: false,
      code: 'FINAL_PENDING',
      message: 'Final payment is pending. Complete payment before closing this booking.'
    };
  }
  return { ok: true };
};

/** Status transitions that imply service has started */
const SERVICE_ACTIVE_STATUSES = new Set([
  BOOKING_STATUS.ASSIGNED,
  BOOKING_STATUS.JOURNEY_STARTED,
  BOOKING_STATUS.VISITED,
  BOOKING_STATUS.IN_PROGRESS,
  BOOKING_STATUS.WORK_DONE
]);

const assertCanTransitionTo = (booking, nextStatus) => {
  if (SERVICE_ACTIVE_STATUSES.has(nextStatus)) {
    return assertCanStartService(booking);
  }
  if (nextStatus === BOOKING_STATUS.COMPLETED) {
    return assertCanCompleteBooking(booking);
  }
  return { ok: true };
};

module.exports = {
  isAdvanceRequired,
  isAdvancePaid,
  isFinalPaymentDue,
  getDueChargeAmount,
  assertCanStartService,
  assertCanCompleteBooking,
  assertCanTransitionTo
};
