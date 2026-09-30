import React from 'react';
import { getBookingModeMeta, normalizeMode } from '../../../../utils/listingBookingMode';

const BookingModeBadge = ({ mode, size = 'sm', className = '' }) => {
  if (!mode) return null;
  const meta = getBookingModeMeta(normalizeMode(mode));
  const sizeClass = size === 'xs'
    ? 'text-[9px] px-1.5 py-0.5'
    : 'text-[10px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-black uppercase tracking-wide rounded-full border ${sizeClass} ${meta.chipClass} ${className}`}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
};

export default BookingModeBadge;
