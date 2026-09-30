/**

 * Resolve whether advance payment applies for a booking.

 * Admin-only: Category.paymentConfig.requireAdvancePayment.

 * Vendors/customers cannot override. Global Settings only supply default %.

 */

const resolveAdvancePaymentConfig = ({

  settings = {},

  category = {}

} = {}) => {

  const globalDefaultPct = Math.min(

    100,

    Math.max(0, Number(settings.advancePaymentPercent ?? 30))

  );



  const catCfg = category?.paymentConfig || {};

  if (catCfg.requireAdvancePayment === true) {

    const pct = Number(catCfg.advancePaymentPercent);

    return {

      requireAdvancePayment: true,

      advancePaymentPercent: Number.isFinite(pct) && pct > 0

        ? Math.min(100, pct)

        : globalDefaultPct,

      source: 'category'

    };

  }



  return {

    requireAdvancePayment: false,

    advancePaymentPercent: 0,

    source: 'none'

  };

};



module.exports = { resolveAdvancePaymentConfig };


