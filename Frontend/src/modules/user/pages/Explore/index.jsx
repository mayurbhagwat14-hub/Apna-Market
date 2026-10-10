import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiSearch, FiSliders, FiFrown, FiX, FiArrowLeft } from 'react-icons/fi';
import BusinessListCard from '../../components/common/BusinessListCard';
import CategoryPill from '../../components/common/CategoryPill';
import { publicCatalogService } from '../../../../services/catalogService';
import { useCity } from '../../../../context/CityContext';
import { sortShopsByProximity, deduplicateShopListings } from '../../../../utils/distance';

const Explore = () => {
  const navigate = useNavigate();
  const { currentCity, userLocation } = useCity();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialFilter = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialFilter);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([
    { id: 'all', label: 'All' },
    { id: 'shops', label: 'Shops' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'grocery-kirana', label: 'Grocery & Kirana' },
    { id: 'beauty-care', label: 'Beauty & Care' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'services', label: 'Services' },
  ]);

  // Load dynamic categories from backend
  useEffect(() => {
    publicCatalogService.getCategories().then((res) => {
      if (res?.success && res.categories?.length > 0) {
        setCategories([
          { id: 'all', label: 'All' },
          ...res.categories.map((c) => ({
            id: c.slug || c.id || c._id,
            label: c.title
          }))
        ]);
      }
    }).catch(() => {});
  }, []);

  // Sync internal state with URL query parameters
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== searchQuery) {
      setSearchQuery(q);
    }
    const cat = searchParams.get('category') || 'all';
    if (cat !== activeCategory) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  // Fetch listings from backend based on search & category
  useEffect(() => {
    let cancelled = false;
    const fetchListings = async () => {
      try {
        setLoading(true);
        const params = { limit: 50 };
        if (currentCity?.name) {
          params.city = currentCity.name;
        }
        if (userLocation?.lat && userLocation?.lng) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        if (activeCategory && activeCategory !== 'all') {
          params.categorySlug = activeCategory;
        }

        const res = await publicCatalogService.getProviderListings(params);
        if (!cancelled && res?.success) {
          const sorted = sortShopsByProximity(res.listings || [], userLocation);
          setBusinesses(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch explore listings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(fetchListings, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, activeCategory, currentCity?.name, userLocation?.lat, userLocation?.lng]);

  const handleCategorySelect = (catId) => {
    setActiveCategory(catId);
    const params = new URLSearchParams(searchParams);
    if (catId && catId !== 'all') {
      params.set('category', catId);
    } else {
      params.delete('category');
    }
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    const params = new URLSearchParams(searchParams);
    if (val.trim()) {
      params.set('q', val.trim());
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setSearchParams({}, { replace: true });
  };

  // Curated showcase listings if database is empty on fresh dev setups
  const showcaseDefaults = [
    {
      _id: 'exp-1',
      id: 'exp-1',
      title: 'Zudio Fashions',
      businessName: 'Zudio Fashions',
      categoryName: 'Clothing',
      rating: 4.5,
      reviewCount: 482,
      distance: '1.2 km',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
    },
    {
      _id: 'exp-2',
      id: 'exp-2',
      title: 'The Urban Table',
      businessName: 'The Urban Table',
      categoryName: 'Restaurants',
      rating: 4.6,
      reviewCount: 310,
      distance: '1.5 km',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    },
    {
      _id: 'exp-3',
      id: 'exp-3',
      title: 'TechZone',
      businessName: 'TechZone',
      categoryName: 'Electronics',
      rating: 4.3,
      reviewCount: 176,
      distance: '2.4 km',
      image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80',
    },
    {
      _id: 'exp-4',
      id: 'exp-4',
      title: 'Glow Studio',
      businessName: 'Glow Studio',
      categoryName: 'Beauty & Care',
      rating: 4.8,
      reviewCount: 423,
      distance: '2.8 km',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
    },
    {
      _id: 'exp-5',
      id: 'exp-5',
      title: 'SmartCare Services',
      businessName: 'SmartCare Services',
      categoryName: 'Services',
      rating: 4.7,
      reviewCount: 261,
      distance: '3.1 km',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const allItems = businesses.length > 0 ? businesses : (searchQuery || activeCategory !== 'all' ? [] : showcaseDefaults);

  // Client-side fuzzy refinement ensuring real DB names/vendors/shops match
  const filteredBusinesses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const catKey = activeCategory.toLowerCase();

    const matches = allItems.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const bizName = (item.businessName || item.provider?.businessName || item.provider?.name || '').toLowerCase();
      const catName = (
        item.categoryName ||
        item.category?.title ||
        item.category?.name ||
        item.category?.slug ||
        ''
      ).toLowerCase();
      const desc = (item.description || item.shortDescription || '').toLowerCase();
      const shopName = (item.dynamicFormAnswers?.shopName || '').toLowerCase();
      const vendorName = (item.dynamicFormAnswers?.vendorName || '').toLowerCase();
      const catalogMatch = item.catalogItems?.some((c) => c.name?.toLowerCase().includes(q));

      const matchesSearch = !q ||
        title.includes(q) ||
        bizName.includes(q) ||
        catName.includes(q) ||
        desc.includes(q) ||
        shopName.includes(q) ||
        vendorName.includes(q) ||
        catalogMatch;

      let matchesCat = true;
      if (catKey !== 'all') {
        const itemCatSlug = (item.category?.slug || '').toLowerCase();
        matchesCat = catName.includes(catKey) ||
                     itemCatSlug === catKey ||
                     (catKey === 'beauty-care' && (catName.includes('beauty') || catName.includes('care'))) ||
                     (catKey === 'grocery-kirana' && (catName.includes('grocery') || catName.includes('kirana')));
      }

      return matchesSearch && matchesCat;
    });

    return catKey === 'all' ? deduplicateShopListings(matches) : matches;
  }, [allItems, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-32 font-sans w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* 1. Header Section */}
      <div className="pt-5 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Explore
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
            Discover real shops, verified vendors & services near you
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/user')}
          className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
          aria-label="Back to home"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="mt-3">
        <div className="relative w-full">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5 sm:w-5 sm:h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search shops, vendor name, services..."
            className="w-full pl-11 pr-20 py-3.5 sm:py-4 bg-white rounded-full border border-black/[0.04] text-sm text-neutral-900 placeholder:text-neutral-400 shadow-[0_4px_20px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-[#016A54]/20 focus:border-[#016A54]/40 transition-all"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleClearFilters()}
              className="p-1.5 text-neutral-400 hover:text-[#016A54] transition-colors cursor-pointer"
              title="Reset Filters"
              aria-label="Reset Filters"
            >
              <FiSliders className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Pills */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((c) => (
          <CategoryPill
            key={c.id}
            label={c.label}
            active={activeCategory === c.id}
            onClick={() => handleCategorySelect(c.id)}
          />
        ))}
      </div>

      {/* 4. Results Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {loading ? (
          <div className="col-span-full space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-neutral-100 p-3 flex gap-3 animate-pulse">
                <div className="w-18 h-18 rounded-xl bg-neutral-200 shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-neutral-200 rounded-sm w-3/4"></div>
                  <div className="h-3 bg-neutral-100 rounded-sm w-1/2"></div>
                  <div className="h-3 bg-neutral-100 rounded-sm w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBusinesses.length > 0 ? (
          filteredBusinesses.map((item) => (
            <BusinessListCard key={item._id || item.id} business={item} />
          ))
        ) : (
          <div className="col-span-full text-center py-16 px-4 bg-white rounded-3xl border border-black/[0.03] mt-4 shadow-md shadow-black/5">
            <div className="w-14 h-14 rounded-full bg-[#EDF8F5] flex items-center justify-center text-[#016A54] mx-auto mb-3">
              <FiFrown className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-neutral-900">No businesses found</h3>
            <p className="text-xs text-neutral-500 font-medium mt-1 max-w-[280px] mx-auto">
              We couldn't find any results matching "{searchQuery || activeCategory}". Try searching with another name or category.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#016A54] hover:bg-[#015B48] active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
