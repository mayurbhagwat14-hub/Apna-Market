import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiShare2,
  FiHeart,
  FiStar,
  FiClock,
  FiTruck,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
  FiChevronRight
} from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useSaved } from '../../../../context/SavedContext';
import { publicCatalogService } from '../../../../services/catalogService';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSaved();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        // Try getById from service
        const res = await publicCatalogService.getProviderListingById(id);
        if (res?.success && res.listing) {
          setBusiness(res.listing);
        } else {
          // Fallback: search across listings
          const all = await publicCatalogService.getProviderListings();
          if (all?.success && all.listings) {
            const found = all.listings.find(
              (b) => b._id === id || b.id === id || b.title?.toLowerCase() === id?.toLowerCase()
            );
            if (found) setBusiness(found);
          }
        }
      } catch (err) {
        console.error('Failed to load business details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-4 w-full max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-neutral-500">Loading business details...</p>
      </div>
    );
  }

  // Fallback defaults matching reference
  const title = business?.title || business?.businessName || 'The Urban Table';
  const category = business?.categoryName ||
    (typeof business?.category === 'object' ? (business?.category?.title || business?.category?.name) : business?.category) ||
    business?.tags?.[0] ||
    'Restaurant';
  const distance = business?.dynamicFormAnswers?.distance || '1.5 km';
  const rating = business?.dynamicFormAnswers?.rating || business?.rating || 4.6;
  const reviewCount = business?.dynamicFormAnswers?.reviewCount || 310;
  const openStatus = business?.dynamicFormAnswers?.openStatus || 'Open Now • 10:00 AM - 11:00 PM';
  const deliveryInfo = business?.dynamicFormAnswers?.deliveryInfo || 'Delivery Available • Within 3 km';
  const phone = business?.dynamicFormAnswers?.phone || '+91 98765 43210';
  const address = business?.dynamicFormAnswers?.address || '54, Scheme No 54, Vijay Nagar, Indore, MP';
  const tags = business?.dynamicFormAnswers?.tags || ['Dine-in', 'Takeaway', 'Outdoor Seating'];
  const offer = business?.offer || null;

  const photos = business?.portfolioPhotos?.length > 0
    ? business.portfolioPhotos
    : [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
      ];

  const catalog = business?.catalogItems?.length > 0
    ? business.catalogItems
    : [
        { name: 'Paneer Tikka Platter', price: 280, category: 'Starters', desc: 'Smoky grilled cottage cheese cubes with mint dip' },
        { name: 'Artisan Woodfire Pizza', price: 420, category: 'Mains', desc: 'Fresh mozzarella, basil and hand-crushed tomatoes' },
        { name: 'Cold Brew Hazelnut', price: 180, category: 'Beverages', desc: 'Slow steeped cold coffee with roasted hazelnut' },
        { name: 'Chocolate Lava Truffle', price: 210, category: 'Desserts', desc: 'Molten Belgian chocolate center with vanilla bean gelato' }
      ];

  const reviews = [
    { name: 'Rohit Sharma', date: '2 days ago', rating: 5, comment: 'Incredible ambience and warm hospitality. Paneer Tikka was out of this world!' },
    { name: 'Pooja Verma', date: '1 week ago', rating: 5, comment: 'Best local hangout spot in Indore! Clean, fast service and super friendly staff.' },
    { name: 'Aman Patel', date: '2 weeks ago', rating: 4, comment: 'Great food quality and clean environment. Outdoor seating is very peaceful in the evening.' }
  ];

  const saved = isSaved(business || { title });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${title} - Apna Market`,
        text: `Check out ${title} on Apna Market!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleDirections = () => {
    const query = encodeURIComponent(`${title}, ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-32 font-sans w-full max-w-lg mx-auto relative shadow-xs">
      
      {/* 1. Hero Image Gallery */}
      <div className="relative w-full h-72 sm:h-80 bg-neutral-900 overflow-hidden">
        <img
          src={photos[activePhotoIdx] || photos[0]}
          alt={title}
          className="w-full h-full object-cover transition-all duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>

        {/* Top Floating Buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9.5 h-9.5 rounded-full bg-white/90 backdrop-blur-md text-neutral-800 flex items-center justify-center shadow-md hover:bg-white active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="w-9.5 h-9.5 rounded-full bg-white/90 backdrop-blur-md text-neutral-800 flex items-center justify-center shadow-md hover:bg-white active:scale-95 transition-all cursor-pointer"
            aria-label="Share"
          >
            <FiShare2 className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Gallery Counter Badge */}
        <div className="absolute bottom-6 right-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold tracking-wider z-20">
          {activePhotoIdx + 1}/{photos.length}
        </div>
      </div>

      {/* 2. Floating Header Card Over Hero */}
      <div className="px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-black/5 border border-neutral-150/80">
          
          <div className="flex items-start justify-between gap-2">
            {/* Title & Category */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black text-neutral-900 tracking-tight truncate">
                  {title}
                </h1>
                <FiCheckCircle className="w-4.5 h-4.5 text-primary-600 fill-primary-100 shrink-0" />
              </div>
              <p className="text-xs font-semibold text-neutral-500 mt-0.5">
                {category} &bull; {distance}
              </p>
            </div>

            {/* Favorite Button */}
            <button
              type="button"
              onClick={() => toggleSave(business || { title })}
              className="w-10 h-10 rounded-full bg-neutral-50 border border-neutral-200/80 flex items-center justify-center text-neutral-500 hover:text-emerald-600 active:scale-90 transition-all shrink-0 cursor-pointer"
              aria-label={saved ? 'Unsave' : 'Save'}
            >
              {saved ? (
                <FaHeart className="w-5 h-5 text-emerald-600" />
              ) : (
                <FiHeart className="w-5 h-5 text-neutral-500" />
              )}
            </button>
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-2 mt-2.5 text-xs text-neutral-700">
            <div className="flex items-center gap-1 text-amber-500 font-extrabold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              <FiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
            </div>
            <span className="text-neutral-500 font-medium">({reviewCount} reviews)</span>
          </div>

          {/* Tag Pills (Dine-in, Takeaway, etc.) */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-neutral-100">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-semibold tracking-tight"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Mini Photo Thumbnails Preview */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {photos.slice(0, 4).map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActivePhotoIdx(idx)}
            className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
              activePhotoIdx === idx ? 'border-primary-600 ring-2 ring-primary-100 scale-102' : 'border-transparent opacity-85 hover:opacity-100'
            }`}
          >
            <img src={p} alt="" className="w-full h-full object-cover" />
            {idx === 3 && photos.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                +{photos.length - 3}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 4. Tabs Navigation */}
      <div className="px-4 mt-4 border-b border-neutral-200">
        <div className="flex gap-6">
          {['About', 'Menu', 'Photos', 'Reviews'].map((tab) => {
            const tabKey = tab.toLowerCase().replace(/\s+/g, '');
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`pb-2.5 text-xs font-extrabold uppercase tracking-wider relative transition-all cursor-pointer ${
                  isActive ? 'text-primary-700' : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {tab}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-700 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Tab Contents */}
      <div className="px-4 mt-4 space-y-4">
        
        {/* Tab 1: ABOUT */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            {/* Description */}
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
              {business?.description ||
                'A cozy and modern establishment serving delicious local favorites with exceptional quality and ambience. Perfect for friends, families, and everyday special moments.'}
            </p>

            {/* Operating Badges */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white rounded-2xl border border-neutral-150/80 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <FiClock className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Status</span>
                  <span className="text-xs font-bold text-neutral-900 truncate">{openStatus}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-neutral-150/80 shadow-2xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                  <FiTruck className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Delivery</span>
                  <span className="text-xs font-bold text-neutral-900 truncate">{deliveryInfo}</span>
                </div>
              </div>
            </div>

            {/* Location & Address Box */}
            <div className="p-3.5 bg-white rounded-2xl border border-neutral-150/80 shadow-2xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0 mt-0.5">
                <FiMapPin className="w-4 h-4 text-primary-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-neutral-900">Address</h4>
                <p className="text-xs text-neutral-600 mt-0.5 leading-snug">{address}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/user/map')}
                className="text-[11px] font-bold text-primary-700 hover:underline shrink-0"
              >
                View on Map
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: MENU / PRODUCTS */}
        {activeTab === 'menu' && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
              Popular Catalog & Items
            </h3>
            {catalog.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-2xl border border-neutral-150/80 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900">{item.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-600 font-semibold">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-medium mt-0.5 line-clamp-1">{item.desc}</p>
                  <p className="text-xs font-extrabold text-primary-800 mt-1">₹{item.price}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success(`Inquiry sent for ${item.name}!`, { icon: '🛒' })}
                  className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold hover:bg-primary-100 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  Inquire
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: PHOTOS */}
        {activeTab === 'photos' && (
          <div className="grid grid-cols-2 gap-2.5">
            {photos.map((p, idx) => (
              <div
                key={idx}
                onClick={() => setActivePhotoIdx(idx)}
                className="rounded-2xl overflow-hidden h-36 bg-neutral-100 shadow-2xs cursor-pointer border border-neutral-100"
              >
                <img src={p} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
                Customer Ratings ({rating} / 5)
              </h3>
              <button
                type="button"
                onClick={() => toast.success('Review form opened!')}
                className="text-xs font-bold text-primary-700 hover:underline"
              >
                Write a Review
              </button>
            </div>
            {reviews.map((rev, idx) => (
              <div key={idx} className="p-3 bg-white rounded-2xl border border-neutral-150/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">{rev.name}</span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <FiStar className="w-3 h-3 fill-amber-400" />
                    <span>{rev.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-600 font-normal leading-relaxed">{rev.comment}</p>
                <span className="text-[10px] text-neutral-400 block pt-0.5">{rev.date}</span>
              </div>
            ))}
          </div>
        )}

        {/* 6. Promotional Offer Banner */}
        {offer && (
          <div className="mt-5 rounded-2xl bg-[#003B2E] text-white p-3.5 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">
                Exclusive Deal
              </span>
              <h4 className="text-sm font-extrabold tracking-tight mt-0.5">{offer.title}</h4>
              <p className="text-[10px] text-emerald-100/70 font-medium">Use code {offer.code || 'APNA20'} on billing</p>
            </div>
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-xs border border-white/20">
              <img src={offer.image || offer.imageUrl || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=350&auto=format&fit=crop&q=80"} alt="Offer" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

      </div>

      {/* 7. Sticky Bottom Marketing & Contact Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-lg mx-auto p-4 bg-white/95 backdrop-blur-md border-t border-[#F0F2F1] flex items-center gap-3 shadow-lg">
        <button
          type="button"
          onClick={handleCall}
          className="flex-1 py-3.5 rounded-full bg-[#016A54] hover:bg-[#015B48] active:scale-95 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-md shadow-[#016A54]/25 transition-all cursor-pointer"
        >
          <FiPhone className="w-4.5 h-4.5" />
          <span>Call Shop</span>
        </button>

        <button
          type="button"
          onClick={handleDirections}
          className="px-6 py-3.5 rounded-full bg-[#EDF8F5] hover:bg-[#E2F4EE] border border-[#ADE2D7]/60 active:scale-95 text-[#016A54] font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <FiMapPin className="w-4 h-4 text-[#016A54]" />
          <span>Directions</span>
        </button>
      </div>

    </div>
  );
};

export default ListingDetail;
