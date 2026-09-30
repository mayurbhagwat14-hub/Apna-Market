import React, { memo } from 'react';
import { FiPlus, FiTag, FiClock, FiTrash2, FiEye, FiCheckCircle, FiCopy, FiGift } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ActiveOffersSection = memo(({ offers = [], onOpenCreateModal, onToggleOffer, onDeleteOffer }) => {
  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied!`);
  };

  return (
    <div className="bg-white rounded-3xl p-4.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200/60">
            <FiGift className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-gray-900 tracking-tight">Active Offers & Deals</h3>
            <p className="text-[11px] text-gray-500 font-medium">Displayed to customers on your shop page</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#016A54] hover:bg-[#015846] text-white text-[12px] font-bold shadow-md shadow-[#016A54]/20 transition-all active:scale-95 cursor-pointer"
        >
          <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Post Offer</span>
        </button>
      </div>

      {/* Offers List */}
      {offers.length > 0 ? (
        <div className="space-y-3.5">
          {offers.map((offer) => {
            const isOfferActive = offer.isActive !== false;
            const validDate = offer.validTill ? new Date(offer.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Ongoing';

            return (
              <div
                key={offer._id || offer.id}
                className={`relative rounded-2xl border transition-all overflow-hidden bg-neutral-50/50 ${
                  isOfferActive ? 'border-emerald-200/80 shadow-xs' : 'border-gray-200 opacity-60'
                }`}
              >
                {/* Accent top ribbon */}
                <div className={`h-1 w-full ${isOfferActive ? 'bg-gradient-to-r from-emerald-500 to-[#016A54]' : 'bg-gray-300'}`} />

                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    
                    {/* Offer Image */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-200 bg-gray-100">
                      <img
                        src={offer.imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&auto=format&fit=crop&q=80'}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 right-1 text-center py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-xs text-white text-[9px] font-black tracking-wider uppercase">
                        {offer.discountBadge || 'OFFER'}
                      </span>
                    </div>

                    {/* Offer Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className="text-[14px] font-extrabold text-gray-900 leading-tight truncate">
                          {offer.title}
                        </h4>
                        
                        {/* Active Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-1">
                          <input
                            type="checkbox"
                            checked={isOfferActive}
                            onChange={() => onToggleOffer(offer._id || offer.id, !isOfferActive)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#016A54]"></div>
                        </label>
                      </div>

                      {offer.tagline && (
                        <p className="text-[11px] text-gray-500 font-medium truncate mb-2">
                          {offer.tagline}
                        </p>
                      )}

                      {/* Promo Code & Validity */}
                      <div className="flex items-center gap-2 flex-wrap mb-2.5">
                        {offer.code && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(offer.code, e)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[#016A54] text-[10px] font-black tracking-wider uppercase hover:bg-emerald-100/70 transition-colors"
                          >
                            <FiTag className="w-3 h-3" />
                            <span>{offer.code}</span>
                            <FiCopy className="w-2.5 h-2.5 text-gray-400" />
                          </button>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
                          <FiClock className="w-3 h-3 text-gray-400" /> Valid till {validDate}
                        </span>
                      </div>

                      {/* Views & Delete */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                          <span className="flex items-center gap-1 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {isOfferActive ? 'Active on App' : 'Paused'}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiEye className="w-3 h-3" /> {offer.viewsCount || 0} views
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteOffer(offer._id || offer.id)}
                          className="text-gray-400 hover:text-rose-500 p-1 transition-colors"
                          title="Delete offer"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-7 px-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/60 flex items-center justify-center mx-auto mb-2.5">
            <FiTag className="w-6 h-6 text-amber-600" />
          </div>
          <h4 className="text-[14px] font-extrabold text-gray-900 mb-1">No Active Deals Yet</h4>
          <p className="text-[12px] text-gray-500 font-medium max-w-xs mx-auto mb-4 leading-relaxed">
            Create an exclusive discount or festive deal for your shop. It will be featured directly on the user app!
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#016A54] hover:bg-[#015846] text-white text-[13px] font-bold shadow-md shadow-[#016A54]/20 transition-all active:scale-95"
          >
            <FiPlus className="w-4 h-4 stroke-[3]" />
            <span>Create New Offer</span>
          </button>
        </div>
      )}

    </div>
  );
});

ActiveOffersSection.displayName = 'ActiveOffersSection';
export default ActiveOffersSection;
