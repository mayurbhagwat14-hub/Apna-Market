import React, { useState, useRef } from 'react';
import { FiX, FiTag, FiCalendar, FiPercent, FiUploadCloud, FiCheck, FiGift } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PRESET_BANNERS = [
  { label: 'Shopping & Retail', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80' },
  { label: 'Festive Mega Sale', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=700&auto=format&fit=crop&q=80' },
  { label: 'Restaurant & Food', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop&q=80' },
  { label: 'Clothing & Fashion', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80' },
  { label: 'Salon & Beauty', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&auto=format&fit=crop&q=80' }
];

const CreateOfferModal = ({ isOpen, onClose, onOfferCreated }) => {
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    discountType: 'PERCENTAGE',
    discountPercent: 20,
    discountAmount: '',
    code: 'APNA20',
    validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: 'Valid on store visits & Apna Market orders. Present offer at billing.',
    imageUrl: PRESET_BANNERS[0].url
  });

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Offer title is required');
      return;
    }

    const discountBadge = formData.discountType === 'PERCENTAGE'
      ? `${formData.discountPercent}% OFF`
      : (formData.discountType === 'FLAT' ? `FLAT ₹${formData.discountAmount} OFF` : 'SPECIAL OFFER');

    try {
      setSubmitting(true);
      await onOfferCreated({
        title: formData.title,
        tagline: formData.tagline,
        discountBadge,
        discountPercent: formData.discountType === 'PERCENTAGE' ? Number(formData.discountPercent) : 0,
        discountAmount: formData.discountType === 'FLAT' ? Number(formData.discountAmount) : 0,
        offerType: formData.discountType,
        code: formData.code,
        imageUrl: formData.imageUrl,
        validTill: formData.validTill,
        terms: formData.terms
      });
      toast.success('Offer submitted for admin approval!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to publish offer');
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
                <FiGift className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Create Store Offer / Deal</h3>
                <p className="text-xs text-emerald-100 font-medium">Showcase discount to nearby customers</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Offer Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Offer Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Flat 25% OFF on Festive Kurtis & Suits"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-hidden focus:border-[#016A54] focus:ring-2 focus:ring-[#016A54]/15"
            />
          </div>

          {/* Tagline / Subtitle */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Tagline / Short Detail
            </label>
            <input
              type="text"
              placeholder="e.g., Valid on all new arrivals this weekend"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-hidden focus:border-[#016A54] focus:ring-2 focus:ring-[#016A54]/15"
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 bg-white focus:outline-hidden focus:border-[#016A54]"
              >
                <option value="PERCENTAGE">Percentage (%) OFF</option>
                <option value="FLAT">Flat ₹ OFF</option>
                <option value="BOGO">Buy 1 Get 1 (BOGO)</option>
                <option value="FESTIVE">Festive Mega Deal</option>
                <option value="SPECIAL">Special Combo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {formData.discountType === 'PERCENTAGE' ? 'Discount %' : 'Discount Amount (₹)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={formData.discountType === 'PERCENTAGE' ? 99 : 50000}
                  placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '150'}
                  value={formData.discountType === 'PERCENTAGE' ? formData.discountPercent : formData.discountAmount}
                  onChange={(e) => setFormData({
                    ...formData,
                    [formData.discountType === 'PERCENTAGE' ? 'discountPercent' : 'discountAmount']: e.target.value
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-black text-gray-900 focus:outline-hidden focus:border-[#016A54]"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">
                  {formData.discountType === 'PERCENTAGE' ? '%' : '₹'}
                </span>
              </div>
            </div>
          </div>

          {/* Coupon Code & Validity Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Coupon / Promo Code
              </label>
              <input
                type="text"
                placeholder="APNA20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-extrabold uppercase text-[#016A54] tracking-wider bg-emerald-50/40 focus:outline-hidden focus:border-[#016A54]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Valid Till
              </label>
              <input
                type="date"
                value={formData.validTill}
                onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-hidden focus:border-[#016A54]"
              />
            </div>
          </div>

          {/* Banner Photo Section */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Offer Banner / Photo
            </label>
            
            {/* Current preview */}
            <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 mb-2.5 group">
              <img
                src={formData.imageUrl}
                alt="Offer Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                {formData.discountType === 'PERCENTAGE' ? `${formData.discountPercent}% OFF` : 'SPECIAL DEAL'}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white text-xs font-bold transition-opacity"
              >
                <FiUploadCloud className="w-5 h-5" /> Change Photo
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Quick Preset Selector */}
            <div>
              <span className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Or select from template photos:</span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {PRESET_BANNERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition-all ${
                      formData.imageUrl === preset.url
                        ? 'border-[#016A54] bg-[#016A54] text-white shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              {submitting ? 'Publishing...' : 'Publish Live on App'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateOfferModal;
