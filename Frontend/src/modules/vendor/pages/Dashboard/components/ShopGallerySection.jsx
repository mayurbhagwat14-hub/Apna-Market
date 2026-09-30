import React, { memo } from 'react';
import { FiPlus, FiCamera, FiTrash2, FiImage, FiCheck } from 'react-icons/fi';

const ShopGallerySection = memo(({ photos = [], onOpenUploadModal, onDeletePhoto }) => {
  return (
    <div className="bg-white rounded-3xl p-4.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200/60">
            <FiCamera className="w-4 h-4 text-[#016A54]" />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-gray-900 tracking-tight">Shop Photos & Showcase</h3>
            <p className="text-[11px] text-gray-500 font-medium">Visible to customers searching nearby</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#016A54] hover:bg-[#015846] text-white text-[12px] font-bold shadow-md shadow-[#016A54]/20 transition-all active:scale-95 cursor-pointer"
        >
          <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Photo</span>
        </button>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {photos.map((item, index) => {
          const photoUrl = typeof item === 'string' ? item : item.url;
          const photoId = item._id || item.id || `photo_${index}`;
          const category = item.category || (index === 0 ? 'Storefront' : 'Interior');
          const caption = item.caption || '';

          return (
            <div
              key={photoId}
              className="group relative rounded-2xl overflow-hidden aspect-4/3 border border-gray-200 bg-gray-100 shadow-2xs hover:shadow-md transition-all"
            >
              <img
                src={photoUrl}
                alt={caption || 'Shop Photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />

              {/* Category pill */}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold tracking-wide shadow-xs">
                {category}
              </span>

              {/* Caption overlay */}
              {caption && (
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <p className="text-[10px] text-white font-medium truncate">{caption}</p>
                </div>
              )}

              {/* Delete Button on hover */}
              <button
                type="button"
                onClick={() => onDeletePhoto(photoId)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                title="Remove photo"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* Add Photo Card in Grid */}
        <button
          type="button"
          onClick={onOpenUploadModal}
          className="rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#016A54] bg-gray-50/50 hover:bg-emerald-50/30 flex flex-col items-center justify-center aspect-4/3 transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <FiPlus className="w-5 h-5 text-[#016A54]" />
          </div>
          <span className="text-[11px] font-bold text-gray-700 group-hover:text-[#016A54]">Upload Photo</span>
          <span className="text-[9px] text-gray-400">Storefront / Interior / Shelf</span>
        </button>
      </div>

      {/* Marketing Trust Badge */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100/80 text-[11px] text-[#016A54] font-semibold">
        <FiCheck className="w-4 h-4 shrink-0 text-emerald-600 stroke-[3]" />
        <span>Customers on user app see these photos directly on your shop profile.</span>
      </div>

    </div>
  );
});

ShopGallerySection.displayName = 'ShopGallerySection';
export default ShopGallerySection;
