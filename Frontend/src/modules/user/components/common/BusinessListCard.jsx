import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useSaved } from '../../../../context/SavedContext';

const BusinessListCard = ({ business, className = '' }) => {
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSaved();

  if (!business) return null;

  const id = business._id || business.id || business.title;
  const title = business.title || business.businessName || 'Local Business';
  const category = business.categoryName ||
    (typeof business.category === 'object' ? (business.category?.title || business.category?.name) : business.category) ||
    business.tags?.[0] ||
    'Local Shop';
  const rating = business.dynamicFormAnswers?.rating || business.rating || 4.6;
  const reviewCount = business.dynamicFormAnswers?.reviewCount || business.reviewCount || 150;
  const distance = business.distance || 
    (business.distanceKm !== undefined && business.distanceKm !== null && business.distanceKm !== 9999
      ? (business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)} m` : `${business.distanceKm.toFixed(1)} km`)
      : (business.dynamicFormAnswers?.distance || 'Nearby'));
  const offer = business.dynamicFormAnswers?.offer || business.offer || null;

  const image = business.coverImage ||
    business.image ||
    business.portfolioPhotos?.[0] ||
    business.dynamicFormAnswers?.coverImage ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80';

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

  return (
    <div
      onClick={handleClick}
      className={`group bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(1,106,84,0.1)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${className}`}
    >
      {/* Square Image */}
      <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {offer && (
          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-sm bg-emerald-600/90 text-white text-[9px] font-extrabold">
            {offer.badge || '%'}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-sm font-bold text-neutral-900 group-hover:text-primary-700 transition-colors truncate">
            {title}
          </h3>
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="p-1 text-neutral-400 hover:text-emerald-600 transition-colors shrink-0"
            aria-label={saved ? 'Remove from saved' : 'Save business'}
          >
            {saved ? (
              <FaHeart className="w-4 h-4 text-emerald-600 animate-pulse" />
            ) : (
              <FiHeart className="w-4 h-4 text-neutral-400 hover:text-emerald-600" />
            )}
          </button>
        </div>

        <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">
          {category}
        </p>

        {/* Rating & Distance */}
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-600">
          <div className="flex items-center gap-1 text-amber-500 font-bold">
            <FiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
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

export default BusinessListCard;
