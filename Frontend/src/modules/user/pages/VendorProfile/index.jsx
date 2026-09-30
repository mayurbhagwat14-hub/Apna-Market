import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiMapPin, FiStar, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { publicCatalogService } from '../../../../services/catalogService';
import BookingModeBadge from '../../components/common/BookingModeBadge';

/**
 * Customer view of a vendor shop — all live listing blocks + packages/types.
 * Used for Marriage Hall, Tiffin, and other multi-package categories.
 */
const VendorProfile = () => {
  const { vendorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const focusCategoryId = location.state?.categoryId || null;
  const [provider, setProvider] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await publicCatalogService.getProviderProfile(vendorId);
        if (cancelled) return;
        if (res.success) {
          setProvider(res.provider);
          let blocks = res.listings || [];
          // Prefer focused category first (e.g. opened from Marriage Hall browse)
          if (focusCategoryId) {
            blocks = [...blocks].sort((a, b) => {
              const aMatch = String(a.category?.id) === String(focusCategoryId) ? 0 : 1;
              const bMatch = String(b.category?.id) === String(focusCategoryId) ? 0 : 1;
              return aMatch - bMatch;
            });
          }
          setListings(blocks);
        } else {
          toast.error(res.message || 'Provider not found');
        }
      } catch {
        if (!cancelled) toast.error('Could not load provider profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [vendorId, focusCategoryId]);

  const handleBook = (listing, item = null) => {
    navigate('/user/checkout', { state: { listing, catalogItem: item || null } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen p-6 bg-neutral-50">
        <p className="text-sm font-bold text-neutral-700">Provider not found</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-3 text-sm font-bold text-primary-600">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-10">
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-black text-neutral-900 truncate">{provider.businessName || provider.name}</h1>
          <p className="text-[10px] text-neutral-400 font-medium">
            {listings.length} service block{listings.length !== 1 ? 's' : ''}
            {provider.city ? ` · ${provider.city}` : ''}
          </p>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-5 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center gap-3 shadow-sm">
          {provider.photo ? (
            <img src={provider.photo} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-lg font-black">
              {(provider.name || 'P').charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-base font-black text-neutral-900 truncate">{provider.businessName || provider.name}</p>
            {provider.businessName && provider.name && (
              <p className="text-xs text-neutral-500 font-medium truncate">{provider.name}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-neutral-600 font-medium">
              <span className="inline-flex items-center gap-1">
                <FiStar className="w-3.5 h-3.5 text-primary-500" />
                {provider.rating || '—'} ({provider.reviews || 0})
              </span>
              <span>{provider.completedJobs || 0} jobs</span>
              {provider.city && (
                <span className="inline-flex items-center gap-1">
                  <FiMapPin className="w-3.5 h-3.5" /> {provider.city}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-500 font-medium px-0.5">
          Browse packages & types below. Pick one to book.
        </p>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-neutral-100">
            <p className="text-sm font-black text-neutral-900">No live services yet</p>
            <p className="text-xs text-neutral-500 mt-1">This provider has no approved listings right now.</p>
          </div>
        ) : (
          listings.map((listing) => {
            const packages = listing.catalogItems || [];
            return (
              <section
                key={listing.id}
                className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/user/listings/${listing.id}`, { state: { listing } })}
                  className="w-full text-left px-4 py-3 border-b border-neutral-50 flex items-center gap-3 active:bg-neutral-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-primary-600">
                      {listing.category?.title || 'Service'}
                    </p>
                    <p className="text-sm font-black text-neutral-900 mt-0.5 truncate">{listing.title}</p>
                    {listing.bookingMode && (
                      <div className="mt-1.5">
                        <BookingModeBadge mode={listing.bookingMode} size="xs" />
                      </div>
                    )}
                  </div>
                  <FiChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
                </button>

                <div className="p-3 space-y-3">
                  {packages.length > 0 ? (
                    packages.map((item, index) => (
                      <article
                        key={item.id || `${item.title}-${index}`}
                        className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50/40"
                      >
                        <div className="relative h-28 bg-neutral-100">
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-50 to-white flex items-center justify-center text-2xl font-black text-primary-200">
                              {(item.title || 'P').charAt(0)}
                            </div>
                          )}
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/95 text-[10px] font-black text-neutral-800">
                            Option {index + 1}
                          </span>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-neutral-900/90 text-white text-[11px] font-black">
                            ₹{Number(item.price || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-3 space-y-2">
                          <div>
                            <p className="text-sm font-black text-neutral-900">{item.title}</p>
                            {item.description && (
                              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          {(item.highlights || []).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {(item.highlights || []).slice(0, 3).map((h) => (
                                <span
                                  key={`${h.label}-${h.value}`}
                                  className="px-1.5 py-0.5 rounded-md bg-white border border-neutral-100 text-[9px] font-bold text-neutral-600"
                                >
                                  {h.label}: {h.value}
                                </span>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleBook(listing, item)}
                            className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-xs font-black"
                          >
                            Book this package
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-100">
                      <div>
                        <p className="text-sm font-black text-neutral-900">Book this service</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          From ₹{(listing.displayPrice || listing.pricing?.basePrice || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBook(listing)}
                        className="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-[11px] font-black"
                      >
                        Book
                      </button>
                    </div>
                  )}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VendorProfile;
