/**
 * Central booking price breakdown from admin Settings.
 * Advance is applied ONLY when advanceConfig.requireAdvancePayment is true.
 */
const calculateBookingPricing = (basePrice = 0, settings = {}, advanceConfig = {}) => {
  const subtotal = Math.max(0, Number(basePrice) || 0);
  const gstPct = Number(settings.serviceGstPercentage ?? 18);
  const platformPct = Number(settings.platformFeePercentage ?? 1);
  const convenienceFee = Number(
    settings.convenienceFee ?? settings.visitedCharges ?? 0
  );

  const requireAdvance = advanceConfig.requireAdvancePayment === true;
  const advancePct = requireAdvance
    ? Math.min(100, Math.max(0, Number(
      advanceConfig.advancePaymentPercent
      ?? settings.advancePaymentPercent
      ?? 30
    )))
    : 0;

  const gst = Math.round((subtotal * gstPct) / 100);
  const platformFee = Math.round((subtotal * platformPct) / 100);
  const total = subtotal + gst + platformFee + convenienceFee;
  const advanceAmount = requireAdvance ? Math.round((total * advancePct) / 100) : 0;
  const balanceAmount = requireAdvance ? Math.max(0, total - advanceAmount) : total;

  return {
    basePrice: subtotal,
    gst,
    gstPercentage: gstPct,
    platformFee,
    platformFeePercentage: platformPct,
    convenienceFee,
    total,
    advanceAmount,
    balanceAmount,
    requireAdvancePayment: requireAdvance,
    advancePaymentPercent: advancePct
  };
};

module.exports = { calculateBookingPricing };
