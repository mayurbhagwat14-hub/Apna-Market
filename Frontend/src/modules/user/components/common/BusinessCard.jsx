import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
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
  const openStatus = business.dynamicFormAnswers?.openStatus || business.openStatus || 'Open Now';
  const offer = business.dynamicFormAnswers?.offer || business.offer || null;

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
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.dispatchEvent(new CustomEvent('showLoginPrompt', {
        detail: {
          title: 'Save to Favorites',
          message: 'Login to save shops, follow businesses and personalize your experience.'
        }
      }));
      return;
    }
    toggleSave(business);
  };

  const isSquare = imageAspect.includes('square');

  return (
    <div
      onClick={handleClick}
      className={`group bg-white rounded-2xl border border-neutral-150/80 p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(1,106,84,0.08)] hover:border-primary-200 transition-all cursor-pointer flex flex-col justify-between ${className}`}
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

        {/* Offer Tag */}
        {offer && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-600/95 backdrop-blur-xs text-white text-[10px] font-extrabold tracking-wide shadow-xs">
            {offer.badge || 'OFFER'}
          </span>
        )}

        {/* Heart Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-neutral-600 hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all shadow-xs"
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
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#016A54] transition-colors truncate">
            {title}
          </h3>
        </div>

        <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
          {category}
        </p>

        {/* Rating & Distance */}
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-600">
          <div className="flex items-center gap-0.5 text-amber-500 font-bold">
            <FiStar className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            <span>{rating}</span>
          </div>
          <span className="text-neutral-400 font-normal">({reviewCount})</span>
          <span className="text-neutral-300">•</span>
          <span className="text-neutral-500 font-medium text-[11px]">{distance}</span>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
