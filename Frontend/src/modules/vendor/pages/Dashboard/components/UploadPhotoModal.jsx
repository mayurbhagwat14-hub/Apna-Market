import React, { useState, useRef } from 'react';
import {
  FiX,
  FiCamera,
  FiUploadCloud,
  FiCheck,
  FiEye,
  FiStar,
  FiMapPin,
  FiInfo,
  FiChevronRight,
  FiShield
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const PLACEMENT_OPTIONS = [
  {
    id: 'Storefront',
    icon: '🏪',
    title: 'Main Storefront & Cover',
    hindiTitle: 'दुकान का मुख्य फ्रंट व सर्च कार्ड',
    badge: '👑 Primary Cover',
    badgeColor: 'bg-emerald-50 text-[#016A54] border-emerald-200',
    targetScreen: 'User App Home Feed, Search Results Card & Shop Header Banner',
    targetHindi: 'ग्राहकों को सर्च रिजल्ट कार्ड, आस-पास की दुकानों में और दुकान के मुख्य पेज पर सबसे ऊपर दिखेगी।',
    previewType: 'search'
  },
  {
    id: 'Interior',
    icon: '🛋️',
    title: 'Store Interior & Ambience',
    hindiTitle: 'दुकान का अंदरूनी दृश्य व माहौल',
    badge: '🖼️ Gallery Slider',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    targetScreen: 'Shop Profile "Photos & Ambience" Gallery Slider',
    targetHindi: 'दुकान के प्रोफाइल पेज पर गैलरी में दिखेगी ताकि ग्राहक बैठने की जगह और साफ-सफाई देख सकें।',
    previewType: 'gallery'
  },
  {
    id: 'Products',
    icon: '🛍️',
    title: 'Product Shelves & Showcase',
    hindiTitle: 'सामान, शेल्फ व प्रोडक्ट रैक',
    badge: '🛍️ Product Showcase',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    targetScreen: 'Store Profile "Showcase & Variety Shelves" Section',
    targetHindi: 'ग्राहकों को दुकान में उपलब्ध सामान की वैरायटी और डिस्प्ले रैक दिखाने के लिए दिखेगी।',
    previewType: 'gallery'
  },
  {
    id: 'Menu',
    icon: '📋',
    title: 'Rate Card & Menu Board',
    hindiTitle: 'रेट लिस्ट व मेनू बोर्ड',
    badge: '📋 Rate Card Tab',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    targetScreen: 'Shop Profile "Price List & Services" Tab',
    targetHindi: 'ग्राहक सीधे रेट कार्ड और मेनू देखकर ऑनलाइन ऑर्डर या इन्क्वायरी कर सकेंगे।',
    previewType: 'menu'
  },
  {
    id: 'Counter',
    icon: '💼',
    title: 'Billing Counter & Reception',
    hindiTitle: 'बिलिंग काउंटर व रिसेप्शन',
    badge: '🛡️ Trust & Verified',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    targetScreen: 'Store Profile Verification & Trust Badges',
    targetHindi: 'दुकान का वास्तविक काउंटर और ओनर उपस्थिति दिखाकर ग्राहकों का भरोसा बढ़ाने के लिए।',
    previewType: 'gallery'
  }
];

const PRESET_SAMPLE_PHOTOS = [
  { label: 'Store Front (Exterior)', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop&q=80', cat: 'Storefront' },
  { label: 'Store Interior', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&auto=format&fit=crop&q=80', cat: 'Interior' },
  { label: 'Display Shelves', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80', cat: 'Products' },
  { label: 'Showcase Rack', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80', cat: 'Products' },
];

const UploadPhotoModal = ({ isOpen, onClose, onPhotoUploaded, currentStoreName = 'My Local Store' }) => {
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [category, setCategory] = useState('Storefront');
  const [caption, setCaption] = useState('');
  const [previewTab, setPreviewTab] = useState('card'); // 'card' | 'header' | 'gallery'

  if (!isOpen) return null;

  const selectedPlacement = PLACEMENT_OPTIONS.find((p) => p.id === category) || PLACEMENT_OPTIONS[0];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!previewUrl) {
      toast.error('Please choose or upload a shop photo');
      return;
    }

    try {
      setSubmitting(true);
      await onPhotoUploaded({
        url: previewUrl,
        category,
        placement: category,
        isPrimary: category === 'Storefront',
        caption: caption.trim() || `${selectedPlacement.title} view`
      });
      toast.success(`Photo published to ${selectedPlacement.title}!`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-4 border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#016A54] to-[#014D3D] text-white p-4.5 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <FiCamera className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Upload Store Photo</h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Choose photo placement & see where customers will view it
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
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* STEP 1: Upload / Choose Photo */}
          <div>
            <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Step 1: Choose Photo <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-gray-400 font-normal">PNG, JPG up to 8MB</span>
            </label>
            
            {previewUrl ? (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-emerald-500 bg-neutral-900 group shadow-inner">
                <img
                  src={previewUrl}
                  alt="Shop Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white text-gray-900 text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiUploadCloud className="w-4 h-4" /> Change Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewUrl('')}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-lg cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                  ✓ Photo Selected
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#016A54] bg-emerald-50/20 hover:bg-emerald-50/40 flex flex-col items-center justify-center p-4 cursor-pointer transition-all group"
              >
                <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <FiCamera className="w-5 h-5 text-[#016A54]" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-800 mb-0.5 text-center">
                  Click to select photo or take picture from camera
                </p>
                <p className="text-[11px] text-gray-500 font-medium">Storefront, interior or products</p>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Quick Sample Selector */}
            {!previewUrl && (
              <div className="mt-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                  Or pick a sample photo to test:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {PRESET_SAMPLE_PHOTOS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPreviewUrl(p.url);
                        setCategory(p.cat);
                        setCaption(p.label);
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-gray-200 bg-gray-50 hover:bg-emerald-50/50 hover:border-[#016A54] text-gray-700 shrink-0 cursor-pointer transition-all"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Placement Selector ("photo kidar karni hai uska option") */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-gray-800 uppercase tracking-wider">
                Step 2: Choose Photo Placement (यह फोटो कहाँ लगानी है?) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-[#016A54] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Placement Selector
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {PLACEMENT_OPTIONS.map((opt) => {
                const isSelected = category === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setCategory(opt.id)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#016A54] bg-emerald-50/40 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-2xl shrink-0 mt-0.5 select-none">{opt.icon}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-[13px] font-black text-gray-900 tracking-tight">
                            {opt.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${opt.badgeColor}`}>
                            {opt.badge}
                          </span>
                        </div>

                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#016A54] bg-[#016A54]' : 'border-gray-300'
                        }`}>
                          {isSelected && <FiCheck className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                      </div>

                      <p className="text-[11px] font-bold text-gray-600 mt-0.5">
                        {opt.hindiTitle}
                      </p>

                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1 flex items-start gap-1">
                        <span className="text-[#016A54] font-bold shrink-0">📍 दिखेगी:</span>
                        <span>{opt.targetHindi}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: WHERE IT SHOWS - CUSTOMER APP PREVIEW ("kidar show hongi uska preview") */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 text-white shadow-md">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black tracking-wide text-emerald-300">
                  Customer App Live Preview (ग्राहकों को ऐसे दिखेगी)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-bold">
                {selectedPlacement.badge}
              </span>
            </div>

            {/* Target Explanation */}
            <p className="text-[11px] text-gray-300 font-medium leading-relaxed mb-3">
              <strong className="text-white">Where this photo appears:</strong> {selectedPlacement.targetScreen}
            </p>

            {/* Visual Simulated Mockup */}
            <div className="bg-neutral-800 rounded-2xl p-2.5 border border-white/10">
              
              {/* Option A: Search Card preview for Storefront */}
              {selectedPlacement.id === 'Storefront' && (
                <div className="bg-white rounded-xl overflow-hidden shadow-xs text-gray-900">
                  <div className="relative h-28 bg-neutral-950 overflow-hidden">
                    <img
                      src={previewUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase">
                      🟢 Open Now
                    </span>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white text-[8px] font-extrabold uppercase">
                      👑 Main Store Banner
                    </span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black truncate">{currentStoreName}</p>
                      <p className="text-[10px] text-gray-500 font-semibold">4.8 ★ &bull; 1.2 km away</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#016A54] text-white text-[10px] font-extrabold">
                      View Store
                    </span>
                  </div>
                </div>
              )}

              {/* Option B: Gallery & Ambience preview for Interior/Products/Counter */}
              {['Interior', 'Products', 'Counter'].includes(selectedPlacement.id) && (
                <div className="bg-white rounded-xl p-2.5 text-gray-900 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-gray-500">
                    <span>Shop Photos & Ambience Tab</span>
                    <span className="text-[#016A54] font-black">{selectedPlacement.title}</span>
                  </div>
                  <div className="relative h-28 rounded-lg overflow-hidden bg-neutral-950">
                    <img
                      src={previewUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80'}
                      alt="Ambience Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold">
                      {selectedPlacement.badge}
                    </span>
                  </div>
                </div>
              )}

              {/* Option C: Rate Card tab preview */}
              {selectedPlacement.id === 'Menu' && (
                <div className="bg-white rounded-xl p-2.5 text-gray-900 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-gray-500">
                    <span>📋 Customer Price List & Menu Tab</span>
                    <span className="text-amber-600 font-black">Menu Board</span>
                  </div>
                  <div className="relative h-28 rounded-lg overflow-hidden bg-neutral-950">
                    <img
                      src={previewUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                      alt="Menu Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-black uppercase">
                      📋 Rate Card View
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Caption (Optional) */}
          <div>
            <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
              Caption / Description (Optional)
            </label>
            <input
              type="text"
              placeholder={`e.g. ${selectedPlacement.title} - Ground floor entrance`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium text-gray-800 focus:outline-hidden focus:border-[#016A54]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-xs sm:text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-[#016A54] to-[#015140] hover:from-[#015B48] hover:to-[#014537] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#016A54]/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <FiCheck className="w-4 h-4 stroke-[3]" />
              {submitting ? 'Publishing...' : `Publish to ${selectedPlacement.title}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UploadPhotoModal;
