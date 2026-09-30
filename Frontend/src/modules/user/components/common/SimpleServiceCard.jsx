import React, { memo } from 'react';
import { themeColors } from '../../../../theme';
import { optimizeCloudinaryUrl } from '../../../../utils/cloudinaryOptimize';

const SimpleServiceCard = memo(({ image, title, onClick }) => {
  return (
    <div
      className="w-[150px] sm:w-[170px] shrink-0 snap-start flex flex-col bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-100/90 group transition-all duration-300 active:scale-95"
      style={{
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      }}
      onClick={onClick}
    >
      <div className="relative w-full h-28 sm:h-32 overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={optimizeCloudinaryUrl(image, { width: 320, quality: 'auto' })}
            alt={title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-108"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-50 to-indigo-50 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-3 flex flex-col justify-between flex-1 bg-white">
        <h3 className="text-xs sm:text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 capitalize group-hover:text-primary-500 transition-colors">
          {title}
        </h3>
      </div>
    </div>
  );
});

SimpleServiceCard.displayName = 'SimpleServiceCard';

export default SimpleServiceCard;

