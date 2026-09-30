/**
 * Client-side mirror — advance is Admin category-only.
 */
export function resolveAdvancePaymentConfig({
  settings = {},
  category = {}
} = {}) {
  const globalDefaultPct = Math.min(100, Math.max(0, Number(settings.advancePaymentPercent ?? 30)));
  const catCfg = category?.paymentConfig || {};
  if (catCfg.requireAdvancePayment === true) {
    const pct = Number(catCfg.advancePaymentPercent);
    return {
      requireAdvancePayment: true,
      advancePaymentPercent: Number.isFinite(pct) && pct > 0 ? Math.min(100, pct) : globalDefaultPct
    };
  }
  return { requireAdvancePayment: false, advancePaymentPercent: 0 };
}

export default resolveAdvancePaymentConfig;
