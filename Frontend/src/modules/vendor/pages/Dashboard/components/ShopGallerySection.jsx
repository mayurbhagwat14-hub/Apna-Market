import React, { memo, useState } from 'react';
import {
  FiPlus,
  FiCamera,
  FiTrash2,
  FiEye,
  FiCheck,
  FiStar,
  FiLayers,
  FiHelpCircle
} from 'react-icons/fi';
import CustomerPhotoPreviewModal from './CustomerPhotoPreviewModal';

const CATEGORY_TAGS = {
  Storefront: {
    label: '👑 Main Cover',
    color: 'bg-emerald-600 text-white',
    whereShows: 'User Search & Store Header'
  },
  Interior: {
    label: '🛋️ Interior',
    color: 'bg-blue-600 text-white',
    whereShows: 'Shop Gallery & Ambience'
  },
  Products: {
    label: '🛍️ Shelves',
    color: 'bg-purple-600 text-white',
    whereShows: 'Product Showcase Racks'
  },
  Menu: {
    label: '📋 Rate Card',
    color: 'bg-amber-600 text-white',
    whereShows: 'Customer Price & Menu Tab'
  },
  Counter: {
    label: '💼 Counter',
    color: 'bg-indigo-600 text-white',
    whereShows: 'Trust & Verification'
  }
};

const ShopGallerySection = memo(({
  photos = [],
  onOpenUploadModal,
  onDeletePhoto,
  onSetPrimaryPhoto,
  storeName = 'My Local Store',
  category = 'Local Store',
  address = 'Indore, MP'
}) => {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const filteredPhotos = selectedFilter === 'ALL'
    ? photos
    : photos.filter((p) => {
        const cat = p.category || 'Storefront';
        return cat.toLowerCase() === selectedFilter.toLowerCase();
      });

  return (
    <div className="bg-white rounded-3xl p-4.5 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200/60 shrink-0">
            <FiCamera className="w-4.5 h-4.5 text-[#016A54]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-black text-gray-900 tracking-tight">Shop Photos & Showcase</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#016A54] border border-emerald-200 text-[10px] font-extrabold">
                {photos.length} Active
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Manage photo placements & see where customers view them
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Customer View Live Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/80 text-[#016A54] border border-emerald-200/80 text-[11px] font-black transition-all active:scale-95 cursor-pointer"
            title="Preview how customers see your photos on the app"
          >
            <FiEye className="w-3.5 h-3.5" />
            <span>Customer View</span>
          </button>

          {/* Add Photo Button */}
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#016A54] hover:bg-[#015846] text-white text-[12px] font-extrabold shadow-md shadow-[#016A54]/20 transition-all active:scale-95 cursor-pointer"
          >
            <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Photo</span>
          </button>
        </div>
      </div>

      {/* Placement Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setSelectedFilter('ALL')}
          className={`px-3 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedFilter === 'ALL'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
          }`}
        >
          All Photos ({photos.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter('Storefront')}
          className={`px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedFilter === 'Storefront'
              ? 'bg-[#016A54] text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
          }`}
        >
          🏪 Main Cover ({photos.filter(p => (p.category || 'Storefront') === 'Storefront').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter('Interior')}
          className={`px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedFilter === 'Interior'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
          }`}
        >
          🛋️ Interior ({photos.filter(p => p.category === 'Interior').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter('Products')}
          className={`px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedFilter === 'Products'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
          }`}
        >
          🛍️ Shelves ({photos.filter(p => p.category === 'Products').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter('Menu')}
          className={`px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedFilter === 'Menu'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
          }`}
        >
          📋 Rate Card ({photos.filter(p => p.category === 'Menu').length})
        </button>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3.5">
        {filteredPhotos.map((item, index) => {
          const photoUrl = typeof item === 'string' ? item : item.url;
          const photoId = item._id || item.id || `photo_${index}`;
          const category = item.category || (index === 0 ? 'Storefront' : 'Interior');
          const isPrimary = Boolean(item.isPrimary || (index === 0 && selectedFilter === 'ALL'));
          const caption = item.caption || '';
          const tagInfo = CATEGORY_TAGS[category] || CATEGORY_TAGS.Storefront;

          return (
            <div
              key={photoId}
              className={`group relative rounded-2xl overflow-hidden aspect-4/3 border bg-gray-100 shadow-2xs hover:shadow-md transition-all ${
                isPrimary ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200'
              }`}
            >
              <img
                src={photoUrl}
                alt={caption || 'Shop Photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />

              {/* Top Category Badge */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide shadow-xs ${
                  isPrimary ? 'bg-emerald-600 text-white' : tagInfo.color
                }`}>
                  {isPrimary ? '👑 Main Cover' : tagInfo.label}
                </span>
              </div>

              {/* Top Right Actions (Set Primary & Delete) */}
              <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Make Primary Cover button */}
                {!isPrimary && onSetPrimaryPhoto && (
                  <button
                    type="button"
                    onClick={() => onSetPrimaryPhoto(photoId)}
                    className="h-7 px-2 rounded-full bg-black/75 hover:bg-emerald-600 text-white text-[9px] font-extrabold flex items-center gap-1 shadow-md transition-colors cursor-pointer"
                    title="Make this the primary cover photo for search cards and header banner"
                  >
                    <span>Make Cover</span>
                  </button>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeletePhoto(photoId)}
                  className="w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
                  title="Remove photo"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Info Overlay: Explains where it shows */}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent text-white">
                {caption && (
                  <p className="text-[10px] font-bold truncate leading-tight mb-0.5">
                    {caption}
                  </p>
                )}
                <p className="text-[9px] text-emerald-200 font-semibold truncate flex items-center gap-1">
                  <span>📍 Shows on:</span>
                  <span>{tagInfo.whereShows}</span>
                </p>
              </div>
            </div>
          );
        })}

        {/* Add Photo Card in Grid */}
        <button
          type="button"
          onClick={onOpenUploadModal}
          className="rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#016A54] bg-gray-50/50 hover:bg-emerald-50/30 flex flex-col items-center justify-center aspect-4/3 transition-all cursor-pointer group p-2 text-center"
        >
          <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <FiPlus className="w-5 h-5 text-[#016A54]" />
          </div>
          <span className="text-[11px] font-black text-gray-800 group-hover:text-[#016A54]">
            Upload Photo
          </span>
          <span className="text-[9px] text-gray-400 font-medium">
            Choose Placement & Section
          </span>
        </button>
      </div>

      {/* Where Photos Show Quick Guide */}
      <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <FiHelpCircle className="w-3.5 h-3.5 text-[#016A54]" />
          <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
            Where Customers See These Photos (फोटो कहाँ दिखती हैं?)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-gray-600">
          <div className="flex items-start gap-1.5">
            <span className="font-black text-[#016A54]">1. Main Cover:</span>
            <span>Shows on customer search cards, nearby stores feed and shop header.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="font-black text-blue-700">2. Interior & Ambience:</span>
            <span>Shows in the shop profile gallery to inspect sitting and cleanliness.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="font-black text-purple-700">3. Product Shelves:</span>
            <span>Shows in store showcase section to display available variety.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="font-black text-amber-700">4. Rate Card / Menu:</span>
            <span>Shows on customer price list and menu tab for quick booking.</span>
          </div>
        </div>
      </div>

      {/* Trust Notice & Live Preview Trigger */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-[#016A54]">
        <div className="flex items-center gap-2 font-semibold">
          <FiCheck className="w-4 h-4 shrink-0 text-emerald-600 stroke-[3]" />
          <span>Photos go live directly on customer search cards & store profile.</span>
        </div>
        <button
          type="button"
          onClick={() => setIsPreviewModalOpen(true)}
          className="text-[11px] font-black underline shrink-0 hover:text-emerald-800 cursor-pointer"
        >
          See Preview &rarr;
        </button>
      </div>

      {/* Customer View Preview Modal */}
      <CustomerPhotoPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        storeName={storeName}
        category={category}
        address={address}
        photos={photos}
      />

    </div>
  );
});

ShopGallerySection.displayName = 'ShopGallerySection';
export default ShopGallerySection;
