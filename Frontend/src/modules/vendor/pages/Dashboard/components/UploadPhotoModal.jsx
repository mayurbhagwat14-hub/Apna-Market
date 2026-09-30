import React, { useState, useRef } from 'react';
import { FiX, FiCamera, FiUploadCloud, FiCheck, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PHOTO_CATEGORIES = [
  { id: 'Storefront', label: '🏪 Storefront (Main Exterior Entrance)' },
  { id: 'Interior', label: '🛋️ Store Interior & Ambience' },
  { id: 'Products', label: '🛍️ Product Showcase & Display Shelves' },
  { id: 'Counter', label: '💼 Billing Counter & Reception' },
  { id: 'Menu', label: '📋 Rate Card & Menu Board' },
];

const PRESET_SAMPLE_PHOTOS = [
  { label: 'Store Front', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop&q=80', cat: 'Storefront' },
  { label: 'Store Interior', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&auto=format&fit=crop&q=80', cat: 'Interior' },
  { label: 'Display Shelves', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80', cat: 'Products' },
  { label: 'Showcase Rack', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80', cat: 'Products' },
];

const UploadPhotoModal = ({ isOpen, onClose, onPhotoUploaded }) => {
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [category, setCategory] = useState('Storefront');
  const [caption, setCaption] = useState('');

  if (!isOpen) return null;

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
        caption: caption.trim() || `${category} view`
      });
      toast.success('Shop photo uploaded successfully!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#016A54] to-[#014D3D] text-white p-5 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <FiCamera className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Upload Store Photo</h3>
                <p className="text-xs text-emerald-100 font-medium">Showcase your shop ambience to customers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <FiX className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Photo Dropzone / Preview */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Shop Photo <span className="text-rose-500">*</span>
            </label>
            
            {previewUrl ? (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-emerald-500 bg-neutral-900 group">
                <img
                  src={previewUrl}
                  alt="Shop Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white text-gray-900 text-xs font-bold shadow-lg flex items-center gap-1.5"
                  >
                    <FiUploadCloud className="w-4 h-4" /> Change Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewUrl('')}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-lg"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#016A54] bg-emerald-50/20 hover:bg-emerald-50/40 flex flex-col items-center justify-center p-4 cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FiCamera className="w-6 h-6 text-[#016A54]" />
                </div>
                <p className="text-sm font-bold text-gray-800 mb-0.5">Click to choose photo or take picture</p>
                <p className="text-xs text-gray-500 font-medium">PNG, JPG, WEBP up to 8MB</p>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Template samples */}
            {!previewUrl && (
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Or select sample placeholder:</span>
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
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-gray-200 bg-gray-50 text-gray-700 hover:border-[#016A54] shrink-0"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Photo Category */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Photo Category / Section
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 bg-white focus:outline-hidden focus:border-[#016A54]"
            >
              {PHOTO_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Caption / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Main storefront entrance on ground floor"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 focus:outline-hidden focus:border-[#016A54]"
            />
          </div>

          {/* Notice info */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2.5">
            <span className="text-amber-700 text-base leading-none">💡</span>
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              Clear photos of your storefront and product display increase customer visits by up to <strong>300%</strong> on Apna Market!
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-[#016A54] to-[#015140] hover:from-[#015B48] hover:to-[#014537] text-white font-extrabold text-sm shadow-lg shadow-[#016A54]/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <FiCheck className="w-4 h-4 stroke-[3]" />
              {submitting ? 'Uploading...' : 'Save & Publish Photo'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UploadPhotoModal;
