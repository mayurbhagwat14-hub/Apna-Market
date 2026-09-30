import React from 'react';
import { Link } from 'react-router-dom';
import { FiLayers } from 'react-icons/fi';

const listingTitle = (booking) => {
  const listing = booking?.serviceListingId;
  if (!listing) return null;
  if (typeof listing === 'string') return 'Listing block';
  return listing.title || listing.categoryName || 'Listing block';
};

/**
 * Shows which vendor listing block a booking originated from.
 */
const BookingListingOrigin = ({ booking, compact = false }) => {
  const listing = booking?.serviceListingId;
  if (!listing) {
    if (compact) return null;
    return (
      <p className="text-[11px] text-neutral-400 font-medium">Catalog / wave booking (no listing block)</p>
    );
  }

  const title = listingTitle(booking);
  const category = listing.categoryName;
  const menuItem = booking?.catalogItemTitle;
  const id = listing._id || listing;

  return (
    <div className={`flex items-start gap-2 ${compact ? '' : 'p-3 rounded-xl bg-primary-50 border border-primary-100'}`}>
      <div className="w-8 h-8 rounded-lg bg-white text-primary-600 flex items-center justify-center shrink-0 border border-primary-100">
        <FiLayers className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600">Listing block</p>
        <p className="text-xs font-black text-neutral-900 truncate">{title}</p>
        {menuItem && <p className="text-[10px] font-bold text-neutral-700">Menu: {menuItem}</p>}
        {category && <p className="text-[10px] text-neutral-500 font-medium">{category}</p>}
        {id && (
          <Link
            to="/admin/service-listings"
            className="text-[10px] font-bold text-primary-600 hover:underline"
          >
            Open listings queue
          </Link>
        )}
      </div>
    </div>
  );
};

export default BookingListingOrigin;
