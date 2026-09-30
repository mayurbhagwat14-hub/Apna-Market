import React, { memo } from 'react';
import { AiFillStar } from 'react-icons/ai';
import { themeColors } from '../../../../theme';
import { useBranding } from '../../../../context/BrandingContext';

const ServiceWithRatingCard = memo(({ image, title, rating, reviews, price, originalPrice, discount, onClick, onAddClick }) => {
  const { branding } = useBranding();
  return (
    <div
      className="w-[155px] sm:w-[185px] shrink-0 snap-start flex flex-col bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-100/90 group transition-all duration-300 shadow-[0_3px_14px_rgba(0,0,0,0.04)] hover:shadow-lg"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative w-full h-26 sm:h-30 overflow-hidden bg-gray-100">
        {discount && (
          <div
            className="absolute top-2 left-2 bg-[#016A54] text-white text-[9.5px] font-black px-2 py-0.5 rounded shadow-xs z-10 uppercase tracking-wider"
          >
            {discount.toString().toUpperCase().includes('OFF') ? discount : `${discount}% OFF`}
          </div>
        )}
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-108"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-50/50">
            <img
              src={branding?.appLogo}
              alt="Placeholder"
              className="w-10 h-10 object-contain opacity-40 grayscale"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Container */}
      <div className="p-2.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-[11.5px] sm:text-xs font-semibold text-gray-900 leading-snug mb-1 line-clamp-2 min-h-[30px] capitalize group-hover:text-primary-500 transition-colors">
            {title}
          </h3>

          <div className="flex items-center gap-1 mb-2">
            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
              <AiFillStar className="w-2.5 h-2.5 text-amber-500" />
              {rating || '4.8'}
            </span>
            {reviews && (
              <span className="text-[9.5px] text-gray-400 font-medium truncate">
                ({reviews})
              </span>
            )}
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-gray-100/80 mt-auto">
          <div className="flex flex-col">
            {originalPrice && (
              <span className="text-[9px] text-gray-400 line-through leading-tight">
                ₹{originalPrice}
              </span>
            )}
            <span className="text-xs sm:text-sm font-bold text-gray-900 leading-none">
              {price && !isNaN(price.toString().replace(/[,]/g, '')) ? `₹${price}` : (price || 'Custom')}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick?.();
            }}
            className="shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-[#016A54] hover:bg-primary-600 text-white shadow-xs active:scale-95 transition-all whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

ServiceWithRatingCard.displayName = 'ServiceWithRatingCard';

export default ServiceWithRatingCard;

