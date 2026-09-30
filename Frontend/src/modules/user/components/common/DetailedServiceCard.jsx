import React, { memo, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { AiFillStar } from 'react-icons/ai';
import { themeColors } from '../../../../theme';
import { optimizeCloudinaryUrl } from '../../../../utils/cloudinaryOptimize';

const DetailedServiceCard = memo(({ image, title, rating, reviews, price, originalPrice, discount, onClick, onAddClick }) => {
  const cardRef = useRef(null);

  // Format price (remove non-digits, then format)
  const formatPrice = (p) => {
    if (!p) return null;
    const clean = p.toString().replace(/[^0-9]/g, '');
    return new Intl.NumberFormat('en-IN').format(clean);
  };

  const displayPrice = formatPrice(price);
  const displayOriginalPrice = formatPrice(originalPrice);

  useEffect(() => {
    if (cardRef.current) {
      const card = cardRef.current;

      const handleMouseEnter = () => {
        gsap.to(card, {
          y: -6,
          scale: 1.01,
          boxShadow: '0 14px 28px rgba(1, 106, 84, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05)',
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          y: 0,
          scale: 1,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const handleClick = () => {
        gsap.to(card, {
          scale: 0.97,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
        });
      };

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
      card.addEventListener('click', handleClick);

      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
        card.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className="w-[155px] sm:w-[185px] shrink-0 snap-start flex flex-col bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-100/90 group transition-all duration-300"
      style={{
        boxShadow: '0 3px 14px rgba(0, 0, 0, 0.04)'
      }}
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
            src={optimizeCloudinaryUrl(image, { width: 350, quality: 'auto' })}
            alt={title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-108"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-50/50">
            <span className="text-[11px] font-semibold text-primary-500">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Container */}
      <div className="p-2.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Title */}
          <h3 className="text-[11.5px] sm:text-xs font-semibold text-gray-900 leading-snug mb-1 line-clamp-2 min-h-[30px] capitalize group-hover:text-primary-500 transition-colors">
            {title}
          </h3>

          {/* Rating */}
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

        {/* Price & Action Row */}
        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-gray-100/80 mt-auto">
          <div className="flex flex-col">
            {displayOriginalPrice && (
              <span className="text-[9px] text-gray-400 line-through leading-tight">
                ₹{displayOriginalPrice}
              </span>
            )}
            <span className="text-xs sm:text-sm font-bold text-gray-900 leading-none">
              ₹{displayPrice}
            </span>
          </div>

          <button
            type="button"
            className="shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-md bg-[#016A54] hover:bg-primary-600 text-white shadow-xs active:scale-95 transition-all whitespace-nowrap touch-manipulation"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onAddClick) {
                onAddClick();
              } else if (onClick) {
                onClick();
              }
            }}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
});

DetailedServiceCard.displayName = 'DetailedServiceCard';

export default DetailedServiceCard;

