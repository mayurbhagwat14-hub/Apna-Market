import React from 'react';
import { getBookingModeMeta } from '../../../utils/listingBookingMode';
import { normalizeTrackingType } from '../../../utils/trackingType';

const CategoryConfigBadges = ({ category }) => {
  if (!category) return null;
  const modeMeta = getBookingModeMeta(category.bookingMode || 'BOTH');
  const fulfillment = String(category.serviceFulfillmentType || 'ON_SITE').toUpperCase();
  const tracking = normalizeTrackingType(category.trackingType);
  const trackingLabel = tracking === 'status_only' ? 'Status' : tracking === 'hybrid' ? 'Hybrid' : 'Live';
  const advance = category.paymentConfig?.requireAdvancePayment;
  const billPrepare = category.allowVendorBilling !== false;

  return (
    <div className="flex flex-wrap gap-1 max-w-[220px]">
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${modeMeta.chipClass}`}>
        {modeMeta.label}
      </span>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
        fulfillment === 'DELIVERY'
          ? 'bg-orange-100 text-orange-800 border-orange-200'
          : 'bg-primary-50 text-primary-600 border-primary-100'
      }`}>
        {fulfillment === 'DELIVERY' ? 'Delivery' : 'On-site'}
      </span>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
        tracking === 'status_only'
          ? 'bg-neutral-100 text-neutral-700 border-neutral-200'
          : 'bg-primary-50 text-primary-600 border-primary-100'
      }`}>
        {trackingLabel}
      </span>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
        billPrepare
          ? 'bg-primary-50 text-primary-700 border-primary-100'
          : 'bg-neutral-100 text-neutral-500 border-neutral-200'
      }`}>
        {billPrepare ? 'Bill prepare' : 'No bill UI'}
      </span>
      {advance && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-green-100 text-green-800 border-green-200">
          Advance {category.paymentConfig?.advancePaymentPercent || 0}%
        </span>
      )}
    </div>
  );
};

export default CategoryConfigBadges;
