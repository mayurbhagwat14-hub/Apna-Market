import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSliders, FiHeart, FiShoppingBag, FiChevronRight, FiSearch } from 'react-icons/fi';
import { FaStar, FaHeart } from 'react-icons/fa';
import { publicCatalogService } from '../../../../services/catalogService';
import { useCity } from '../../../../context/CityContext';
import { useSaved } from '../../../../context/SavedContext';
import { sortShopsByProximity } from '../../../../utils/distance';

const subcategoryMap = {
  clothing: ['All', 'Men', 'Women', 'Kids', 'Ethnic', 'Casual'],
  shops: ['All', 'General', 'Supermarket', 'Organic', 'Bakery', 'Gifts'],
  restaurants: ['All', 'Fine Dining', 'Cafes', 'Fast Food', 'Sweets', 'Family'],
  services: ['All', 'Cleaning', 'Plumbing', 'Electrician', 'Carpentry', 'Repairs'],
  'beauty-care': ['All', 'Salon', 'Spa', 'Hair Styling', 'Skin Care', 'Nails'],
  beauty: ['All', 'Salon', 'Spa', 'Hair Styling', 'Skin Care', 'Nails'],
  electronics: ['All', 'Mobiles', 'Laptops', 'Accessories', 'Audio', 'Appliances'],
};

const CategoryListings = () => {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCity, userLocation } = useCity();
  const { isSaved, toggleSaved } = useSaved();

  const [category, setCategory] = useState(location.state?.category || null);
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // Load all categories if not present
  useEffect(() => {
    publicCatalogService.getCategories().then((res) => {
      const list = res.categories || res || [];
      setCategories(list);
      if (!category) {
        const found = list.find((c) => c._id === categoryId || c.id === categoryId || c.slug === categoryId);
        if (found) setCategory(found);
      }
    }).catch(console.error);
  }, [categoryId, category]);

  // Load listings for this category
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const params = {
          categoryId,
          page: 1,
          limit: 50,
        };
        if (currentCity?.name) params.city = currentCity.name;
        if (userLocation?.lat && userLocation?.lng) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
        }

        const res = await publicCatalogService.getProviderListings(params);
        if (cancelled) return;
        const sorted = sortShopsByProximity(res.listings || [], userLocation);
        setListings(sorted);
      } catch (err) {
        console.error(err);
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [categoryId, currentCity?.name, userLocation?.lat, userLocation?.lng]);

  const catName = category?.name || category?.title || 'Category';
  const catSlug = (category?.slug || catName).toLowerCase().replace(/\s+/g, '-');
  const subcategories = subcategoryMap[catSlug] || subcategoryMap.clothing;

  const showcaseCategoryDefaults = [
    {
      id: 'cat-1',
      _id: 'cat-1',
      businessName: 'Urban Threads',
      title: 'Urban Threads',
      rating: 4.7,
      reviewsCount: 256,
      distance: '1.2 km',
      images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'],
    },
    {
      id: 'cat-2',
      _id: 'cat-2',
      businessName: 'StyleNest',
      title: 'StyleNest',
      rating: 4.4,
      reviewsCount: 189,
      distance: '1.8 km',
      images: ['https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80'],
    },
    {
      id: 'cat-3',
      _id: 'cat-3',
      businessName: 'Trendy Wear',
      title: 'Trendy Wear',
      rating: 4.6,
      reviewsCount: 230,
      distance: '2.1 km',
      images: ['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80'],
    },
    {
      id: 'cat-4',
      _id: 'cat-4',
      businessName: 'Fashion Hub',
      title: 'Fashion Hub',
      rating: 4.3,
      reviewsCount: 142,
      distance: '2.8 km',
      images: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'],
    },
  ];

  const activeListings = listings.length > 0 ? listings : showcaseCategoryDefaults;

  // Filter listings
  const filteredListings = useMemo(() => {
    return activeListings.filter((item) => {
      const nameMatch = !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
      const subMatch = selectedSubcategory === 'All' || 
        item.tags?.some((t) => t.toLowerCase() === selectedSubcategory.toLowerCase()) ||
        item.serviceName?.toLowerCase().includes(selectedSubcategory.toLowerCase()) ||
        item.subcategories?.includes(selectedSubcategory);
      return nameMatch && subMatch;
    });
  }, [activeListings, searchQuery, selectedSubcategory]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-32 text-[#1A202C] w-full relative">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F0F2F1] transition-all">
        <div className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-[#F5F7F6] flex items-center justify-center text-[#1A202C] hover:bg-[#EAEFEA] active:scale-95 transition-all cursor-pointer"
              aria-label="Back"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-[#1A202C]">
              {catName}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setSortBy((prev) => (prev === 'popular' ? 'rating' : 'popular'));
            }}
            className="w-9 h-9 rounded-full bg-[#F5F7F6] flex items-center justify-center text-[#1A202C] hover:bg-[#EAEFEA] active:scale-95 transition-all cursor-pointer"
            title={`Sort: ${sortBy}`}
          >
            <FiSliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Subcategory Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {subcategories.map((sub) => {
            const isActive = selectedSubcategory === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubcategory(sub)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-[#016A54] text-white shadow-sm shadow-[#016A54]/20'
                    : 'bg-white text-[#4A5568] border border-[#E2E8F0] hover:border-[#016A54]/40'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>

        {/* 2-Column Grid of Business Cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-2.5 border border-[#F0F2F1] shadow-sm animate-pulse space-y-2">
                <div className="w-full aspect-[4/3] bg-neutral-200 rounded-xl" />
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#F0F2F1] shadow-sm my-6">
            <div className="w-12 h-12 bg-[#EDF8F5] text-[#016A54] rounded-full flex items-center justify-center mx-auto mb-3">
              <FiShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-[#1A202C]">No businesses found</p>
            <p className="text-xs text-[#718096] mt-1">
              Try choosing another subcategory or exploring all items.
            </p>
            <button
              onClick={() => setSelectedSubcategory('All')}
              className="mt-4 px-4 py-2 bg-[#016A54] text-white text-xs font-bold rounded-xl active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4.5 pt-1 pb-6">
            {filteredListings.map((item) => {
              const id = item.id || item._id;
              const name = item.businessName || item.title || item.name || 'Apna Shop';
              const img = item.images?.[0] || item.coverImage || item.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';
              const rating = item.rating || item.ratingAverage || 4.5;
              const reviews = item.reviewsCount || item.reviewCount || item.ratingsCount || 120;
              const distance = item.distance || (item.distanceKm ? `${item.distanceKm.toFixed(1)} km` : 'Nearby');
              const saved = isSaved(id);

              return (
                <div
                  key={id}
                  onClick={() => navigate(`/user/listings/${id}`, { state: { listing: item } })}
                  className="bg-white rounded-2xl p-2.5 border border-[#F0F2F1] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                >
                  {/* Image & Favorite button */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 mb-2">
                    <img
                      src={img}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaved(item);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm text-neutral-400 hover:text-[#016A54] active:scale-90 transition-all"
                      aria-label="Save"
                    >
                      {saved ? (
                        <FaHeart className="w-3.5 h-3.5 text-[#016A54]" />
                      ) : (
                        <FiHeart className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-[#1A202C] truncate group-hover:text-[#016A54] transition-colors">
                      {name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-[#718096]">
                      <FaStar className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="font-bold text-[#1A202C]">{rating}</span>
                      <span>({reviews})</span>
                      <span className="text-neutral-300">•</span>
                      <span>{distance}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Promo Banner (Matches reference screen 5) */}
        <div 
          onClick={() => navigate('/user/explore')}
          className="bg-[#EDF8F5] border border-[#ADE2D7]/40 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#E2F4EE] transition-colors active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#016A54]">
              <FiShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#014A3B]">
                Latest {catName}
              </p>
              <p className="text-[11px] text-[#016A54] font-medium">
                Trends Near You
              </p>
            </div>
          </div>
          <FiChevronRight className="w-5 h-5 text-[#016A54]" />
        </div>
      </main>
    </div>
  );
};

export default CategoryListings;
