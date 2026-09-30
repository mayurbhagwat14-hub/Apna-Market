import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiArrowLeft, FiShoppingBag, FiMapPin, FiCompass, FiTag } from 'react-icons/fi';
import { FaStar, FaHeart } from 'react-icons/fa';
import { useSaved } from '../../../../context/SavedContext';
import { publicCatalogService } from '../../../../services/catalogService';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'shops', label: 'Shops & Kirana' },
  { id: 'food', label: 'Dining & Cafes' },
  { id: 'fashion', label: 'Fashion & Boutiques' },
  { id: 'beauty', label: 'Salons & Spa' },
  { id: 'services', label: 'Home Services' },
];

const fallbackShowcase = [
  {
    _id: 'biz-1',
    id: 'biz-1',
    title: 'Urban Threads & Ethnic',
    businessName: 'Urban Threads & Ethnic',
    categoryName: 'Fashion Boutique',
    category: 'clothing',
    rating: 4.8,
    reviewsCount: 312,
    locality: 'Vijay Nagar, Indore',
    distance: '1.2 km away',
    offer: 'Flat 20% OFF on Festive Wear',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
  },
  {
    _id: 'biz-2',
    id: 'biz-2',
    title: 'The Spice Villa & Rooftop',
    businessName: 'The Spice Villa & Rooftop',
    categoryName: 'Fine Dining & Cafe',
    category: 'restaurants',
    rating: 4.7,
    reviewsCount: 428,
    locality: 'New Palasia, Indore',
    distance: '1.8 km away',
    offer: 'Free Dessert on Bill Above ₹599',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  },
  {
    _id: 'biz-3',
    id: 'biz-3',
    title: 'Glow Luxury Salon & Spa',
    businessName: 'Glow Luxury Salon & Spa',
    categoryName: 'Salon & Wellness',
    category: 'beauty-care',
    rating: 4.9,
    reviewsCount: 194,
    locality: 'Saket Nagar, Indore',
    distance: '2.4 km away',
    offer: 'Complimentary Hair Spa with Facial',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
  },
  {
    _id: 'biz-4',
    id: 'biz-4',
    title: 'Fresh Mart Organic Superstore',
    businessName: 'Fresh Mart Organic Superstore',
    categoryName: 'Grocery & Organic',
    category: 'shops',
    rating: 4.6,
    reviewsCount: 175,
    locality: 'Bhawarkua, Indore',
    distance: '0.8 km away',
    offer: '10% Cashback on Daily Staples',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
  },
];

const Saved = () => {
  const navigate = useNavigate();
  const { savedList, toggleSaved, isSaved } = useSaved();
  const [activeTab, setActiveTab] = useState('all');
  const [catalogListings, setCatalogListings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch recommended businesses in case user wants to discover more
  useEffect(() => {
    let cancelled = false;
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await publicCatalogService.getProviderListings({ limit: 12 });
        if (!cancelled && res?.success && res.listings?.length > 0) {
          setCatalogListings(res.listings);
        }
      } catch (err) {
        console.error('Error fetching catalog in Saved:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCatalog();
    return () => { cancelled = true; };
  }, []);

  // Filter saved items based on activeTab
  const filteredSavedItems = useMemo(() => {
    if (!savedList || savedList.length === 0) return [];

    if (activeTab === 'all') return savedList;

    return savedList.filter((item) => {
      const cat = (
        item.categoryName ||
        (typeof item.category === 'object' ? (item.category?.title || item.category?.name || item.category?.slug) : item.category) ||
        item.tags?.[0] ||
        item.categorySlug ||
        ''
      ).toLowerCase();

      if (activeTab === 'shops') {
        return cat.includes('shop') || cat.includes('store') || cat.includes('kirana') || cat.includes('elect') || cat.includes('grocer');
      }
      if (activeTab === 'food') {
        return cat.includes('food') || cat.includes('restaur') || cat.includes('cafe') || cat.includes('dining') || cat.includes('bakery');
      }
      if (activeTab === 'fashion') {
        return cat.includes('cloth') || cat.includes('fashion') || cat.includes('apparel') || cat.includes('boutique') || cat.includes('ethnic');
      }
      if (activeTab === 'beauty') {
        return cat.includes('beauty') || cat.includes('salon') || cat.includes('spa') || cat.includes('wellness') || cat.includes('hair');
      }
      if (activeTab === 'services') {
        return cat.includes('service') || cat.includes('repair') || cat.includes('clean') || cat.includes('plumb') || cat.includes('electr');
      }
      return true;
    });
  }, [savedList, activeTab]);

  const recommendedToDiscover = catalogListings.length > 0 ? catalogListings : fallbackShowcase;

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-32 text-neutral-900 font-sans">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-150 px-4 py-3 sm:py-4 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 -ml-1 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
              aria-label="Go Back"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-neutral-900 leading-tight">
                Saved Places
              </h1>
              <p className="text-[11px] text-neutral-400 font-medium">
                Your favorite local shops and spots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#016A54] bg-[#EDF8F5] border border-[#ADE2D7] px-3 py-1 rounded-full">
              {savedList?.length || 0} saved
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-5">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-[#016A54] text-white shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-[#016A54]/40 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 3. Saved Items Grid */}
        {filteredSavedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredSavedItems.map((item) => {
              const id = item._id || item.id || item.title;
              const name = item.title || item.businessName || item.name || 'Local Business';
              const category = item.categoryName ||
                (typeof item.category === 'object' ? (item.category?.title || item.category?.name) : item.category) ||
                'Retail Store';
              const img = item.coverImage || item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';
              const rating = item.rating || 4.7;
              const reviews = item.reviewsCount || item.reviewCount || 150;
              const distance = item.distance || 'Nearby';
              const offer = item.offer || item.specialOffer || null;

              return (
                <div
                  key={id}
                  onClick={() => navigate(`/user/listings/${id}`)}
                  className="group bg-white rounded-2xl p-3.5 border border-neutral-200/90 shadow-xs hover:shadow-md hover:border-[#016A54]/40 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                      <img
                        src={img}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {offer && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black">
                          OFFER
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-extrabold text-neutral-900 truncate group-hover:text-[#016A54] transition-colors">
                        {name}
                      </h3>
                      <p className="text-xs text-neutral-500 font-medium truncate">
                        {category}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <FaStar className="w-3 h-3 fill-current" />
                          <span>{rating}</span>
                        </div>
                        <span>({reviews})</span>
                        <span className="text-neutral-300">&bull;</span>
                        <span className="font-semibold text-neutral-600">{distance}</span>
                      </div>
                    </div>
                  </div>

                  {/* Heart Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaved(item);
                    }}
                    className="w-10 h-10 rounded-full bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-500 transition-all shrink-0 active:scale-90 cursor-pointer shadow-2xs"
                    title="Remove from favorites"
                    aria-label="Remove from Saved"
                  >
                    <FaHeart className="w-4 h-4 fill-current text-rose-500" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-neutral-150 shadow-xs my-4">
            <div className="w-16 h-16 bg-[#EDF8F5] text-[#016A54] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <FiHeart className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-neutral-900">
              {activeTab === 'all'
                ? 'No saved places yet'
                : `No saved ${tabs.find((t) => t.id === activeTab)?.label} yet`}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Tap the heart icon on any store or service to keep your favorite neighborhood spots handy here.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/user/explore')}
                className="px-6 py-2.5 bg-[#016A54] hover:bg-[#015443] text-white text-xs sm:text-sm font-bold rounded-xl active:scale-95 shadow-md shadow-[#016A54]/20 transition-all cursor-pointer"
              >
                Explore Nearby Places
              </button>
            </div>
          </div>
        )}

        {/* 4. "Discover & Save Popular Places" Carousel / Recommendations */}
        <section className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900">
                Popular Places to Add to Saved
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Top rated local spots in Indore
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/user/explore')}
              className="text-xs font-bold text-[#016A54] hover:underline cursor-pointer"
            >
              See All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {recommendedToDiscover.slice(0, 4).map((biz) => {
              const id = biz._id || biz.id;
              const name = biz.title || biz.businessName || 'Local Spot';
              const category = biz.categoryName || (typeof biz.category === 'object' ? biz.category?.name : biz.category) || 'Local Store';
              const img = biz.coverImage || biz.image || (biz.images && biz.images[0]) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';
              const rating = biz.rating || 4.7;
              const currentlySaved = isSaved(biz);

              return (
                <div
                  key={id}
                  onClick={() => navigate(`/user/listings/${id}`)}
                  className="bg-white rounded-2xl p-3 border border-neutral-200/80 shadow-2xs hover:shadow-md hover:border-[#016A54]/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={img}
                      alt={name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-100 group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate group-hover:text-[#016A54] transition-colors">
                        {name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {category}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                        <FaStar className="w-3 h-3 fill-current" />
                        <span>{rating}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaved(biz);
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-90 cursor-pointer ${
                      currentlySaved
                        ? 'bg-rose-50 text-rose-500'
                        : 'bg-neutral-100 text-neutral-400 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                    title={currentlySaved ? 'Remove from Saved' : 'Save to Favorites'}
                  >
                    {currentlySaved ? (
                      <FaHeart className="w-4 h-4 fill-current text-rose-500" />
                    ) : (
                      <FiHeart className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Saved;
