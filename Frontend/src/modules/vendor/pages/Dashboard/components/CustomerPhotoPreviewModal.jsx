import React, { useState } from 'react';
import {
  FiX,
  FiEye,
  FiMapPin,
  FiStar,
  FiPhone,
  FiNavigation,
  FiShare2,
  FiHeart,
  FiCheckCircle,
  FiCamera,
  FiLayers,
  FiChevronRight
} from 'react-icons/fi';

const CustomerPhotoPreviewModal = ({
  isOpen,
  onClose,
  storeName = 'Apna Market Store',
  category = 'Local Store',
  address = 'Indore, MP',
  photos = []
}) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'header' | 'gallery' | 'menu'

  if (!isOpen) return null;

  // Find primary storefront photo or fallback to first
  const primaryPhoto =
    photos.find((p) => p.isPrimary || p.category === 'Storefront')?.url ||
    photos[0]?.url ||
    (typeof photos[0] === 'string' ? photos[0] : null) ||
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';

  const interiorPhotos = photos.filter((p) => p.category === 'Interior');
  const productPhotos = photos.filter((p) => p.category === 'Products');
  const menuPhotos = photos.filter((p) => p.category === 'Menu');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#016A54] to-[#014D3D] text-white p-4.5 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <FiEye className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-[17px] font-black tracking-tight flex items-center gap-2">
                  <span>Customer App Live Preview</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-extrabold uppercase tracking-wide">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100 font-medium">
                  See exactly how customers view your shop photos
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiX className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Preview View Tabs */}
          <div className="mt-4 flex gap-1.5 p-1 bg-black/20 rounded-2xl overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-white text-[#016A54] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              📱 Search Card
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('header')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'header'
                  ? 'bg-white text-[#016A54] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              🏪 Shop Header
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-white text-[#016A54] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              📸 Photos Gallery
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-white text-[#016A54] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              📋 Rate Card
            </button>
          </div>
        </div>

        {/* Modal Body / Mobile Phone Frame */}
        <div className="p-4 sm:p-5 bg-neutral-50 max-h-[70vh] overflow-y-auto">
          
          {/* Target Location Banner */}
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2.5">
            <span className="text-emerald-700 text-sm mt-0.5">💡</span>
            <div className="text-xs text-[#016A54] font-medium leading-relaxed">
              {activeTab === 'search' && (
                <>
                  <strong className="font-bold text-gray-900">1. Customer Search & Nearby List:</strong> Customers searching for {category} in your local area see this card first. The <strong>Storefront / Primary Cover</strong> photo is used here.
                </>
              )}
              {activeTab === 'header' && (
                <>
                  <strong className="font-bold text-gray-900">2. Shop Profile Top Banner:</strong> When customers tap your store, your <strong>Main Cover Photo</strong> is showcased right at the top hero header.
                </>
              )}
              {activeTab === 'gallery' && (
                <>
                  <strong className="font-bold text-gray-900">3. Store Showcase & Ambience:</strong> Customers swipe through your <strong>Interior, Showcase & Shelves</strong> photos to inspect ambience before visiting or ordering.
                </>
              )}
              {activeTab === 'menu' && (
                <>
                  <strong className="font-bold text-gray-900">4. Rate Card & Price Menu Tab:</strong> Customers view your price list, service cards and menu directly here.
                </>
              )}
            </div>
          </div>

          {/* TAB 1: Search Result Card Mockup */}
          {activeTab === 'search' && (
            <div className="max-w-sm mx-auto bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-200">
              <div className="relative aspect-16/9 bg-neutral-900 overflow-hidden">
                <img
                  src={primaryPhoto}
                  alt={storeName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                  🟢 Open Now
                </div>

                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                  📍 1.2 km away
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <span className="px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-[9px] font-extrabold uppercase">
                    👑 Main Cover Photo
                  </span>
                  <h4 className="text-[15px] font-black truncate mt-0.5">{storeName}</h4>
                  <p className="text-[11px] text-gray-200 font-medium truncate">{category} &bull; {address}</p>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between bg-white border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 font-extrabold border border-amber-200">
                    <FiStar className="w-3 h-3 fill-amber-400" /> 4.8
                  </span>
                  <span className="text-gray-400 text-[11px] font-semibold">(120+ reviews)</span>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-[#016A54] text-white text-[11px] font-extrabold shadow-sm"
                >
                  Explore Store &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Shop Detail Page Header Mockup */}
          {activeTab === 'header' && (
            <div className="max-w-sm mx-auto bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-200">
              <div className="relative h-44 bg-neutral-900 overflow-hidden">
                <img
                  src={primaryPhoto}
                  alt={storeName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

                <div className="absolute top-3 left-3 right-3 flex justify-between items-center text-white">
                  <span className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-xs font-bold">
                    &larr;
                  </span>
                  <div className="flex gap-2">
                    <span className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center">
                      <FiShare2 className="w-3.5 h-3.5" />
                    </span>
                    <span className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center">
                      <FiHeart className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                  1/{photos.length || 1}
                </div>
              </div>

              {/* Header Info Sheet */}
              <div className="p-3.5 bg-white -mt-4 relative rounded-t-2xl shadow-sm border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[15px] font-black text-gray-900 truncate">{storeName}</h4>
                  <FiCheckCircle className="w-4 h-4 text-[#016A54] fill-emerald-100" />
                </div>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  {category} &bull; <FiMapPin className="inline w-3 h-3 text-gray-400" /> {address}
                </p>

                <div className="mt-3 flex gap-2">
                  <div className="flex-1 py-1.5 rounded-xl bg-emerald-50 text-[#016A54] text-[11px] font-bold text-center flex items-center justify-center gap-1">
                    <FiPhone className="w-3 h-3" /> Call Shop
                  </div>
                  <div className="flex-1 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-[11px] font-bold text-center flex items-center justify-center gap-1">
                    <FiNavigation className="w-3 h-3" /> Directions
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Photos & Ambience Gallery Mockup */}
          {activeTab === 'gallery' && (
            <div className="max-w-sm mx-auto bg-white rounded-3xl p-3.5 shadow-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-900">
                  <FiCamera className="w-4 h-4 text-[#016A54]" />
                  <span>Customer Shop Photos & Ambience</span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold">{photos.length} Photos</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(photos.length > 0 ? photos : [
                  { url: primaryPhoto, category: 'Storefront', caption: 'Store Front' },
                  { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500', category: 'Interior', caption: 'Seating Ambience' }
                ]).slice(0, 4).map((p, idx) => {
                  const url = typeof p === 'string' ? p : p.url;
                  const cat = p.category || (idx === 0 ? 'Storefront' : 'Interior');
                  const caption = p.caption || '';
                  return (
                    <div key={idx} className="relative rounded-xl overflow-hidden aspect-4/3 bg-gray-100 border border-gray-200">
                      <img src={url} alt={caption} className="w-full h-full object-cover" />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[8px] font-extrabold uppercase">
                        {cat}
                      </span>
                      {caption && (
                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-[9px] text-white font-medium truncate">{caption}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-gray-500 font-medium text-center">
                Customers swipe horizontally to view all interior and showcase angles!
              </p>
            </div>
          )}

          {/* TAB 4: Rate Card & Menu Mockup */}
          {activeTab === 'menu' && (
            <div className="max-w-sm mx-auto bg-white rounded-3xl p-3.5 shadow-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-900">
                  <FiLayers className="w-4 h-4 text-indigo-600" />
                  <span>Price List & Rate Card Tab</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                  Menu Section
                </span>
              </div>

              {menuPhotos.length > 0 ? (
                <div className="space-y-2">
                  {menuPhotos.map((m, idx) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-gray-200">
                      <img src={m.url} alt="Rate Card" className="w-full h-44 object-cover" />
                      <div className="p-2 bg-gray-50 text-[11px] font-bold text-gray-700">
                        {m.caption || 'Store Rate Card / Menu Board'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 text-center">
                  <p className="text-xs font-bold text-gray-700 mb-1">No Rate Card Photo Uploaded Yet</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Upload a photo with category <strong>"Rate Card & Menu Board"</strong> so customers can view your printed menu or service rates right here!
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            Total {photos.length} photo(s) active on Apna Market
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomerPhotoPreviewModal;
