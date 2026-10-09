import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiSliders,
  FiArrowRight,
  FiShoppingBag,
  FiScissors,
  FiCoffee,
  FiTool,
  FiTag,
  FiGrid,
  FiMapPin,
  FiCompass,
  FiStar,
  FiX,
  FiChevronRight
} from 'react-icons/fi';
import TopHeader from '../../components/common/TopHeader';
import BusinessCard from '../../components/common/BusinessCard';
import HeroBannerCarousel from './components/HeroBannerCarousel';
import { publicCatalogService } from '../../../../services/catalogService';
import { useCity } from '../../../../context/CityContext';
import { sortShopsByProximity } from '../../../../utils/distance';

const Home = () => {
  const navigate = useNavigate();
  const { currentCity, userLocation } = useCity();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = React.useRef(null);
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categories
        const catRes = await publicCatalogService.getCategories();
        if (!cancelled && catRes?.success && catRes.categories?.length > 0) {
          setCategories(catRes.categories);
        }

        // Fetch home banners
        try {
          const contentRes = await publicCatalogService.getHomeContent();
          if (!cancelled && contentRes?.success && contentRes.homeContent?.banners?.length > 0) {
            const activeList = contentRes.homeContent.banners.filter(b => b.isActive !== false);
            if (activeList.length > 0) {
              setBanners(activeList);
            }
          }
        } catch (bannerErr) {
          console.warn('Could not load dynamic home banners, using defaults:', bannerErr);
        }

        // Fetch business listings with user address / city & coordinates
        const queryParams = { limit: 50 };
        if (currentCity?.name) {
          queryParams.city = currentCity.name;
        }
        if (userLocation?.lat && userLocation?.lng) {
          queryParams.lat = userLocation.lat;
          queryParams.lng = userLocation.lng;
        }

        const listRes = await publicCatalogService.getProviderListings(queryParams);
        if (!cancelled && listRes?.success && listRes.listings?.length > 0) {
          const sorted = sortShopsByProximity(listRes.listings, userLocation);
          setBusinesses(sorted);
        }
      } catch (err) {
        console.error('Error fetching home discovery data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [currentCity?.name, userLocation?.lat, userLocation?.lng]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/user/explore');
    }
  };

  // High quality default photos and metadata matching Apna Market categories
  const defaultCategoryMetadata = {
    shops: {
      subtitle: 'All Stores',
      photo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
      bgColor: '#EFF6FF',
      color: '#2563EB',
      icon: FiShoppingBag
    },
    clothing: {
      subtitle: 'Fashion & Style',
      photo: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
      bgColor: '#F5F3FF',
      color: '#7C3AED',
      icon: FiTag
    },
    restaurants: {
      subtitle: 'Food & Drinks',
      photo: '/tasty-food-banner.jpg',
      bgColor: '#FFF7ED',
      color: '#EA580C',
      icon: FiCoffee
    },
    services: {
      subtitle: 'Home & Personal',
      photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
      bgColor: '#EDF8F5',
      color: '#016A54',
      icon: FiTool
    },
    'beauty-care': {
      subtitle: 'Salon & Wellness',
      photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&auto=format&fit=crop&q=80',
      bgColor: '#FDF2F8',
      color: '#DB2777',
      icon: FiScissors
    },
    electronics: {
      subtitle: 'Gadgets & Stores',
      photo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
      bgColor: '#F8FAFC',
      color: '#475569',
      icon: FiGrid
    }
  };

  // Compute display categories dynamically from admin panel / backend with photos
  const displayCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      const activeCats = categories.filter((c) => c.showOnHome !== false);
      const topFive = activeCats.slice(0, 5).map((cat) => {
        const meta = defaultCategoryMetadata[cat.slug] || {};
        return {
          id: cat.id || cat._id,
          slug: cat.slug,
          title: cat.title,
          subtitle: cat.subtitle || meta.subtitle || 'All Stores',
          photo: cat.homeIconUrl || cat.imageUrl || cat.icon || meta.photo || '',
          bgColor: meta.bgColor || '#F8FAFC',
          color: meta.color || '#016A54',
          icon: meta.icon || FiShoppingBag
        };
      });

      // Always provide "More" card as the 6th option for full explore
      topFive.push({
        id: 'more',
        slug: 'more',
        title: 'More',
        subtitle: 'Explore',
        photo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
        bgColor: '#F8FAFC',
        color: '#475569',
        icon: FiGrid,
        isMore: true
      });

      return topFive;
    }

    // Default 6 categories with real photos if DB is still loading
    return [
      { id: 'shops', slug: 'shops', title: 'Shops', subtitle: 'All Stores', photo: defaultCategoryMetadata.shops.photo, bgColor: '#EFF6FF', color: '#2563EB', icon: FiShoppingBag },
      { id: 'clothing', slug: 'clothing', title: 'Clothing', subtitle: 'Fashion & Style', photo: defaultCategoryMetadata.clothing.photo, bgColor: '#F5F3FF', color: '#7C3AED', icon: FiTag },
      { id: 'restaurants', slug: 'restaurants', title: 'Restaurants', subtitle: 'Food & Drinks', photo: defaultCategoryMetadata.restaurants.photo, bgColor: '#FFF7ED', color: '#EA580C', icon: FiCoffee },
      { id: 'services', slug: 'services', title: 'Services', subtitle: 'Home & Personal', photo: defaultCategoryMetadata.services.photo, bgColor: '#EDF8F5', color: '#016A54', icon: FiTool },
      { id: 'beauty-care', slug: 'beauty-care', title: 'Beauty & Care', subtitle: 'Salon & Wellness', photo: defaultCategoryMetadata['beauty-care'].photo, bgColor: '#FDF2F8', color: '#DB2777', icon: FiScissors },
      { id: 'more', slug: 'more', title: 'More', subtitle: 'Explore', photo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80', bgColor: '#F8FAFC', color: '#475569', icon: FiGrid, isMore: true }
    ];
  }, [categories]);

  // Curated fallback listings if database has not yet been seeded
  const showcaseDefaults = [
    {
      _id: 'biz-1',
      id: 'biz-1',
      title: 'Urban Threads',
      businessName: 'Urban Threads',
      categoryName: 'Clothing Store',
      category: 'clothing',
      rating: 4.8,
      reviewsCount: 256,
      distance: '1.2 km',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    },
    {
      _id: 'biz-2',
      id: 'biz-2',
      title: 'Spice Villa',
      businessName: 'Spice Villa',
      categoryName: 'Restaurant',
      category: 'restaurants',
      rating: 4.7,
      reviewsCount: 189,
      distance: '1.5 km',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    },
    {
      _id: 'biz-3',
      id: 'biz-3',
      title: 'Glow Studio',
      businessName: 'Glow Studio',
      categoryName: 'Beauty & Care',
      category: 'beauty-care',
      rating: 4.9,
      reviewsCount: 98,
      distance: '2.8 km',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
    },
    {
      _id: 'biz-4',
      id: 'biz-4',
      title: 'The Urban Table',
      businessName: 'The Urban Table',
      categoryName: 'Restaurant',
      category: 'restaurants',
      rating: 4.6,
      reviewsCount: 310,
      distance: '1.5 km',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    },
    {
      _id: 'biz-5',
      id: 'biz-5',
      title: 'Zudio Fashions',
      businessName: 'Zudio Fashions',
      categoryName: 'Clothing Store',
      category: 'clothing',
      rating: 4.5,
      reviewsCount: 482,
      distance: '1.2 km',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
    },
    {
      _id: 'biz-6',
      id: 'biz-6',
      title: 'Fresh Mart Superstore',
      businessName: 'Fresh Mart Superstore',
      categoryName: 'Shops & Kirana',
      category: 'shops',
      rating: 4.7,
      reviewsCount: 164,
      distance: '0.9 km',
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
    }
  ];

  const allListings = businesses.length > 0 ? businesses : showcaseDefaults;
  const popularBusinesses = allListings.slice(0, 6);
  const recommendedBusinesses = allListings.slice(0, 12);

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { matchingShops: [], matchingCats: [] };

    const matchingShops = allListings.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const bizName = (item.businessName || item.provider?.businessName || item.provider?.name || '').toLowerCase();
      const cat = (item.categoryName || item.category?.title || '').toLowerCase();
      const shopName = (item.dynamicFormAnswers?.shopName || '').toLowerCase();
      const vendorName = (item.dynamicFormAnswers?.vendorName || '').toLowerCase();
      return title.includes(q) || bizName.includes(q) || cat.includes(q) || shopName.includes(q) || vendorName.includes(q);
    }).slice(0, 4);

    const matchingCats = displayCategories.filter((c) => {
      if (c.isMore) return false;
      return c.title.toLowerCase().includes(q) || c.subtitle?.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    }).slice(0, 3);

    return { matchingShops, matchingCats };
  }, [searchQuery, allListings, displayCategories]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-28 font-sans w-full relative select-none overflow-x-hidden">
      {/* Subtle organic mint background shapes */}
      <div 
        className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-[#EAF5EF] rounded-full blur-3xl opacity-70 pointer-events-none -mr-20 -mt-16"
        style={{ borderRadius: '40% 60% 35% 65% / 55% 45% 65% 35%' }}
      />
      <div 
        className="absolute top-96 -left-20 w-72 sm:w-96 h-72 sm:h-96 bg-[#E5F2EC] rounded-full blur-3xl opacity-60 pointer-events-none"
        style={{ borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%' }}
      />

      {/* 1. Location Bar & Profile Header */}
      <TopHeader />

      {/* 2. Main Discovery Area */}
      <main className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-5 sm:space-y-7 relative z-10">
        
        {/* Search Bar with Instant Suggestions */}
        <div ref={searchContainerRef} className="relative z-30">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <div className="relative w-full">
              <button
                type="submit"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#016A54] transition-colors p-1 cursor-pointer"
                aria-label="Search"
              >
                <FiSearch className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search shops, restaurants, services..."
                className="w-full pl-11 pr-20 py-3 sm:py-3.5 bg-white rounded-full border border-neutral-200/90 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#016A54]/20 focus:border-[#016A54] transition-all"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    aria-label="Clear"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/user/explore')}
                  className="p-1.5 text-neutral-400 hover:text-[#016A54] transition-colors cursor-pointer"
                  aria-label="Filter"
                  title="Explore all"
                >
                  <FiSliders className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Instant Dropdown Suggestions */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-neutral-150 shadow-xl z-50 overflow-hidden divide-y divide-neutral-100 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Category Suggestions */}
              {searchSuggestions.matchingCats.length > 0 && (
                <div className="p-2.5 bg-neutral-50/70">
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1.5">
                    Categories
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {searchSuggestions.matchingCats.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/user/category/${cat.slug}`);
                        }}
                        className="px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-semibold text-neutral-800 hover:border-[#016A54] hover:text-[#016A54] transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{cat.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Shop Results */}
              {searchSuggestions.matchingShops.length > 0 ? (
                <div className="p-1">
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-3 pt-2 pb-1">
                    Stores & Businesses
                  </div>
                  {searchSuggestions.matchingShops.map((shop) => {
                    const shopId = shop._id || shop.id;
                    const shopName = shop.title || shop.businessName || shop.provider?.businessName || shop.provider?.name || 'Local Shop';
                    const shopCat = shop.categoryName || shop.category?.title || 'Shop';
                    const shopImg = shop.coverImage || shop.image || shop.portfolioPhotos?.[0] || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80';
                    return (
                      <button
                        key={shopId}
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/user/listings/${shopId}`);
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-50 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={shopImg}
                            alt={shopName}
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0 border border-neutral-100"
                          />
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-[#016A54] transition-colors line-clamp-1">
                              {shopName}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-medium">
                              {shopCat}
                            </div>
                          </div>
                        </div>
                        <FiChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#016A54] transition-transform group-hover:translate-x-0.5" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-neutral-500 font-medium">
                  No instant matches found in current list
                </div>
              )}

              {/* View all in explore footer */}
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  navigate(`/user/explore?q=${encodeURIComponent(searchQuery.trim())}`);
                }}
                className="w-full p-3 text-center text-xs font-bold text-[#016A54] hover:bg-[#EDF8F5] transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-white"
              >
                <span>Search all results for "{searchQuery}"</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 3. "Discover Near You" Dynamic Hero Feature Banner Carousel */}
        <HeroBannerCarousel banners={banners} />

        {/* 4. Core Categories with dynamic photos from admin/backend (3 cols on mobile, 6 cols on tablet/desktop) */}
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-4">
            {displayCategories.map((cat) => {
              const Icon = cat.icon || FiShoppingBag;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (cat.id === 'more' || cat.slug === 'more') {
                      navigate('/user/explore');
                    } else {
                      navigate(`/user/category/${cat.slug}`);
                    }
                  }}
                  className="bg-white rounded-2xl border border-neutral-150/80 p-2.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#016A54]/40 hover:shadow-md active:scale-95 transition-all group cursor-pointer"
                >
                  <div
                    className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl overflow-hidden mb-1.5 transition-transform group-hover:scale-105 shadow-2xs border border-neutral-100/90 relative flex items-center justify-center bg-neutral-50"
                    style={{ backgroundColor: cat.bgColor }}
                  >
                    {cat.photo ? (
                      <img
                        src={cat.photo}
                        alt={cat.title}
                        className="w-full h-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      style={{ display: cat.photo ? 'none' : 'flex' }}
                      className="w-full h-full items-center justify-center"
                    >
                      <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6" style={{ color: cat.color }} />
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#102030] leading-tight">
                    {cat.title}
                  </span>
                  <span className="text-[10px] sm:text-xs text-neutral-400 font-medium leading-none mt-0.5">
                    {cat.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Popular Shops Near You Section */}
        <section className="pt-1">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3.5">
            <h2 className="text-[15px] sm:text-lg font-black text-[#102030] tracking-tight">
              Popular Shops Near You
            </h2>
            <button
              type="button"
              onClick={() => navigate('/user/explore')}
              className="text-xs sm:text-sm font-bold text-[#016A54] hover:text-[#014A3B] flex items-center gap-0.5 cursor-pointer"
            >
              <span>See All</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Horizontal snap scroll on mobile, responsive grid on tablet/desktop */}
          <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {popularBusinesses.map((item) => (
              <div 
                key={item._id || item.id} 
                className="w-[165px] min-w-[165px] max-w-[165px] sm:w-auto sm:min-w-0 sm:max-w-none snap-start shrink-0 sm:shrink"
              >
                <BusinessCard business={item} imageAspect="aspect-square" />
              </div>
            ))}
          </div>
        </section>

        {/* 6. Neighborhood Discovery Banner */}
        <section 
          onClick={() => navigate('/user/map')}
          className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#EDF8F5] to-[#E6F3EE] border border-[#ADE2D7]/70 p-3.5 sm:p-5 flex items-center justify-between shadow-2xs cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#016A54] text-white font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs">
              <FiMapPin className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm md:text-base font-black text-[#01352A]">
                Explore Businesses on Map
              </h3>
              <p className="text-[11px] sm:text-xs md:text-sm text-[#015B48] font-medium">
                Find shops within walking or driving distance
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#016A54] text-white text-[11px] sm:text-xs font-bold shrink-0 shadow-xs">
            Open Map
          </span>
        </section>

        {/* 7. Recommended Businesses Responsive Grid */}
        <section className="pt-1">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3.5">
            <h2 className="text-[15px] sm:text-lg font-black text-[#102030] tracking-tight">
              Recommended Businesses
            </h2>
            <button
              type="button"
              onClick={() => navigate('/user/map')}
              className="text-xs sm:text-sm font-bold text-[#016A54] hover:text-[#014A3B] flex items-center gap-0.5 cursor-pointer"
            >
              <span>On Map</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
            {recommendedBusinesses.map((item) => (
              <BusinessCard key={item._id || item.id} business={item} imageAspect="aspect-[4/3]" />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Home;
