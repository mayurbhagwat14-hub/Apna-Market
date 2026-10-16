import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiHeart, FiPhone, FiCheckCircle } from 'react-icons/fi';
import { FaHeart, FaWhatsapp } from 'react-icons/fa';
import { useSaved } from '../../../../context/SavedContext';

const BusinessCard = ({ business, className = '', imageAspect = 'aspect-[4/3]' }) => {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSaved();

  if (!business) return null;

  const id = business._id || business.id || business.title;
  const title = business.title || business.businessName || 'Local Business';
  const category = business.categoryName ||
    (typeof business.category === 'object' ? (business.category?.title || business.category?.name) : business.category) ||
    business.tags?.[0] ||
    'Retail';
  const rating = business.dynamicFormAnswers?.rating || business.rating || 4.5;
  const reviewCount = business.dynamicFormAnswers?.reviewCount || business.reviewCount || 120;
  const distance = business.distance || 
    (business.distanceKm !== undefined && business.distanceKm !== null && business.distanceKm !== 9999
      ? (business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)} m` : `${business.distanceKm.toFixed(1)} km`)
      : (business.dynamicFormAnswers?.distance || 'Nearby'));
  const offer = business.dynamicFormAnswers?.offer || business.offer || null;

  // Subscription marketing perks
  const isSubscribed = Boolean(business.isSubscribed || business.promoted || business.provider?.isSubscribed);
  const isFeatured = Boolean(business.isFeatured || isSubscribed);
  const badgeLabel = business.subscriptionBadge || business.provider?.subscriptionBadge || (isFeatured ? 'FEATURED' : null);
  const perks = business.marketingPerks || business.perks || {};
  const showVerified = isSubscribed && (perks.verifiedBadge !== false);
  const phone = business.phone || business.provider?.phone || business.address?.phone || '';
  const showDirectContact = isSubscribed && Boolean(perks.directContact) && Boolean(phone);

  const image = business.coverImage ||
    business.image ||
    business.portfolioPhotos?.[0] ||
    business.dynamicFormAnswers?.coverImage ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80';

  const saved = isSaved(business);

  const handleClick = () => {
    navigate(`/user/listings/${id}`);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleSave(business);
  };

  const handleCallClick = (e) => {
    e.stopPropagation();
    if (phone) window.open(`tel:${phone}`);
  };

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const intlPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(`Hi, I found your shop "${title}" on Apna Market!`)}`, '_blank');
    }
  };

  const isSquare = imageAspect.includes('square');

  return (
    <div
      onClick={handleClick}
      className={`group bg-white rounded-2xl border ${
        isFeatured ? 'border-amber-400/50 ring-1 ring-amber-400/20' : 'border-black/[0.04]'
      } p-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(1,106,84,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${className}`}
    >
      {/* Image Container with enforced aspect ratio */}
      <div 
        className="relative w-full rounded-xl overflow-hidden bg-neutral-100 shrink-0"
        style={{ aspectRatio: isSquare ? '1 / 1' : '4 / 3' }}
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Featured / Subscription Badge */}
        {isFeatured && badgeLabel && (
          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black tracking-wider uppercase shadow-md z-10">
            {badgeLabel}
          </span>
        )}

        {/* Offer Tag (displayed below badge if both present) */}
        {offer && (
          <span className={`absolute ${isFeatured ? 'top-7' : 'top-2'} left-2 px-2 py-0.5 rounded-full bg-emerald-600/95 backdrop-blur-xs text-white text-[10px] font-extrabold tracking-wide shadow-xs z-10`}>
            {offer.badge || 'OFFER'}
          </span>
        )}

        {/* Heart Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-neutral-600 hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all shadow-xs z-10 cursor-pointer"
          aria-label={saved ? 'Remove from saved' : 'Save business'}
        >
          {saved ? (
            <FaHeart className="w-4 h-4 text-emerald-600 animate-pulse" />
          ) : (
            <FiHeart className="w-4 h-4 text-neutral-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="pt-2 px-1 flex flex-col">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#016A54] transition-colors truncate">
            {title}
          </h3>
          {showVerified && (
            <FiCheckCircle className="text-emerald-600 shrink-0" size={14} title="Verified Apna Market Partner" />
          )}
        </div>

        <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
          {category}
        </p>

        {/* Rating, Distance & Direct Contact Actions */}
        <div className="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-neutral-100/80">
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <div className="flex items-center gap-0.5 text-amber-500 font-bold">
              <FiStar className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
              <span>{rating}</span>
            </div>
            <span className="text-neutral-400 font-normal text-[11px]">({reviewCount})</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-500 font-medium text-[11px]">{distance}</span>
          </div>

          {/* Quick Contact Buttons if Subscribed */}
          {showDirectContact && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="w-6 h-6 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Chat on WhatsApp"
              >
                <FaWhatsapp size={12} />
              </button>
              <button
                type="button"
                onClick={handleCallClick}
                className="w-6 h-6 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Call Shop"
              >
                <FiPhone size={11} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
