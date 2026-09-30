import React from 'react';
import { FiMapPin, FiStar } from 'react-icons/fi';
import BookingModeBadge from '../../user/components/common/BookingModeBadge';

const displayPrice = (pricing = {}) =>
  pricing.basePrice ||
  pricing.hourlyRate ||
  pricing.dailyRate ||
  pricing.packagePrice ||
  pricing.monthlyRent ||
  pricing.perGuardRate ||
  0;

const labelForKey = (key, schema = []) => {
  const field = schema.find((f) => f.key === key);
  if (field?.label) return field.label;
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
};

const formatValue = (v) => {
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (v && typeof v === 'string' && v.startsWith('data:')) return 'File uploaded';
  return String(v ?? '');
};

/**
 * Customer-facing listing preview used in the admin review queue.
 */
const ListingBlockPreview = ({ listing, vendorFormSchema = [] }) => {
  if (!listing) return null;

  const vendor = listing.vendorId || {};
  const photos = listing.portfolioPhotos || [];
  const cover = photos[0];
  const price = displayPrice(listing.pricing);
  const menuPrices = (listing.catalogItems || [])
    .filter((i) => i.isActive !== false)
    .map((i) => Number(i.price) || 0)
    .filter((p) => p > 0);
  const fromPrice = menuPrices.length ? Math.min(...menuPrices) : price;
  const answers = listing.dynamicFormAnswers || {};

  return (
    <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
      <div className="relative h-40 bg-neutral-100">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">
            No cover photo
          </div>
        )}
        <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider bg-white/95 text-primary-700 px-2 py-0.5 rounded-md">
          {listing.categoryName || listing.categoryId?.title || 'Service'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {vendor.profilePhoto ? (
            <img src={vendor.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-black shrink-0">
              {(vendor.name || 'V').charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-black text-neutral-900 leading-tight">{vendor.name || listing.title}</h3>
            <p className="text-xs text-neutral-500 font-medium truncate">{listing.title}</p>
          </div>
        </div>

        {listing.description && (
          <p className="text-xs text-neutral-600 leading-relaxed">{listing.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-[11px] font-bold text-neutral-600">
          <span className="text-primary-700">
            {menuPrices.length ? `From ₹${fromPrice}` : `₹${fromPrice}`}
            {' / '}{(listing.pricingModel || 'FIXED').toLowerCase().replace('_', ' ')}
          </span>
          {listing.serviceArea?.city && (
            <span className="inline-flex items-center gap-1"><FiMapPin className="w-3 h-3" />{listing.serviceArea.city}</span>
          )}
          {listing.experience > 0 && (
            <span className="inline-flex items-center gap-1"><FiStar className="w-3 h-3" />{listing.experience} yrs</span>
          )}
          {listing.bookingMode && (
            <BookingModeBadge mode={listing.bookingMode} size="xs" />
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {photos.slice(1).map((url, i) => (
              <img key={i} src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-neutral-200 shrink-0" />
            ))}
          </div>
        )}

        {Object.keys(answers).length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
            {Object.entries(answers).map(([k, v]) => (
              <div key={k}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">{labelForKey(k, vendorFormSchema)}</p>
                <p className="text-[11px] font-bold text-neutral-800 break-words">{formatValue(v)}</p>
              </div>
            ))}
          </div>
        )}

        {listing.catalogItems && listing.catalogItems.length > 0 && (
          <div className="pt-2 border-t border-neutral-100 space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Catalog / Menu Items ({listing.catalogItems.length})</h4>
            <div className="grid grid-cols-1 gap-2">
              {listing.catalogItems.map((item, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${item.isActive ? 'border-neutral-100 bg-neutral-50' : 'border-red-100 bg-red-50'}`}>
                  {item.photoUrl && <img src={item.photoUrl} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-[11px] font-bold text-neutral-800 truncate">{item.title}</p>
                      <p className="text-[11px] font-black text-neutral-900 shrink-0 ml-2">₹{item.price}</p>
                    </div>
                    {item.description && <p className="text-[9px] text-neutral-500 line-clamp-1">{item.description}</p>}
                    {!item.isActive && <p className="text-[9px] font-bold text-red-600 mt-0.5">Inactive</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingBlockPreview;
