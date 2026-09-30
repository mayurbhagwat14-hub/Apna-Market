import React from 'react';
import { normalizeTrackingType, TRACKING_TYPE } from '../../../utils/trackingType';

const META = {
  [TRACKING_TYPE.LIVE]: {
    label: 'Live GPS',
    className: 'bg-primary-50 text-primary-700 border-primary-100'
  },
  [TRACKING_TYPE.STATUS_ONLY]: {
    label: 'Status only',
    className: 'bg-neutral-100 text-neutral-700 border-neutral-200'
  },
  [TRACKING_TYPE.HYBRID]: {
    label: 'Hybrid',
    className: 'bg-primary-50 text-primary-700 border-primary-100'
  }
};

/**
 * Compact badge for booking / category tracking type.
 */
const TrackingTypeBadge = ({ trackingType, className = '' }) => {
  const type = normalizeTrackingType(trackingType);
  const meta = META[type] || META[TRACKING_TYPE.LIVE];

  return (
    <span
      className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${meta.className} ${className}`}
    >
      {meta.label}
    </span>
  );
};

export default TrackingTypeBadge;
