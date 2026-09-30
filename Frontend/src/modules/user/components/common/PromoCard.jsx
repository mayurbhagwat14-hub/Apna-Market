import React, { memo } from 'react';
import { themeColors } from '../../../../theme';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import OptimizedVideo from '../../../../components/common/OptimizedVideo';

const PromoCard = memo(({ title, subtitle, buttonText, image, onClick, className = '' }) => {
  const isVideo = image && (
    image.includes('video/upload') ||
    image.match(/\.(mp4|webm|ogg|mov)$|^https:\/\/res\.cloudinary\.com.*\/video\//i)
  );

  return (
    <div
      className={`relative rounded-2xl overflow-hidden w-[92vw] sm:w-[360px] md:w-[410px] h-[140px] sm:h-[175px] md:h-[195px] cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-98 bg-slate-900 border border-slate-200/50 shadow-md ${className}`}
      onClick={onClick}
    >
      {image ? (
        isVideo ? (
          <OptimizedVideo
            src={image}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <OptimizedImage
            src={image}
            alt={title || 'Promo Banner'}
            className="w-full h-full object-cover"
          />
        )
      ) : (
        /* Fallback text banner if no image is uploaded */
        <div className="relative z-20 flex flex-col justify-between h-full p-5 sm:p-6 w-[80%] text-left bg-gradient-to-r from-primary-700 via-primary-800 to-primary-600">
          <div>
            {title && (
              <h3 className="text-lg sm:text-2xl font-black text-white leading-tight mb-1.5 tracking-tight line-clamp-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-white/90 font-semibold line-clamp-2 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button className="bg-white text-primary-600 text-xs font-black py-2.5 px-5 rounded-full w-max flex items-center gap-2 shadow-lg">
            <span>{buttonText || 'Book Service Now'}</span>
            <span className="w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px]">
              ➔
            </span>
          </button>
        </div>
      )}
    </div>
  );
});

PromoCard.displayName = 'PromoCard';

export default PromoCard;
