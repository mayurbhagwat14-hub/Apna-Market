import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiSliders, FiFrown } from 'react-icons/fi';
import BusinessListCard from '../../components/common/BusinessListCard';
import CategoryPill from '../../components/common/CategoryPill';
import { publicCatalogService } from '../../../../services/catalogService';

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialFilter = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialFilter);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const res = await publicCatalogService.getProviderListings();
        if (res?.success && res.listings?.length > 0) {
          setBusinesses(res.listings);
        }
      } catch (err) {
        console.error('Failed to fetch explore listings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'shops', label: 'Shops' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'services', label: 'Services' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'beauty-care', label: 'Beauty & Care' },
    { id: 'electronics', label: 'Electronics' },
  ];

  const showcaseDefaults = [
    {
      _id: 'exp-1',
      id: 'exp-1',
      title: 'Zudio Fashions',
      categoryName: 'Clothing Store',
      rating: 4.5,
      reviewCount: 482,
      distance: '1.2 km',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
    },
    {
      _id: 'exp-2',
      id: 'exp-2',
      title: 'The Urban Table',
      categoryName: 'Restaurant',
      rating: 4.6,
      reviewCount: 310,
      distance: '1.5 km',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    },
    {
      _id: 'exp-3',
      id: 'exp-3',
      title: 'TechZone',
      categoryName: 'Electronics Store',
      rating: 4.3,
      reviewCount: 176,
      distance: '2.4 km',
      image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80',
    },
    {
      _id: 'exp-4',
      id: 'exp-4',
      title: 'Glow Studio',
      categoryName: 'Beauty & Personal Care',
      rating: 4.8,
      reviewCount: 423,
      distance: '2.8 km',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
    },
    {
      _id: 'exp-5',
      id: 'exp-5',
      title: 'SmartCare Services',
      categoryName: 'Home Services',
      rating: 4.7,
      reviewCount: 261,
      distance: '3.1 km',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const allItems = businesses.length > 0 ? businesses : showcaseDefaults;

  const filteredBusinesses = useMemo(() => {
    return allItems.filter((item) => {
      const title = (item.title || item.businessName || '').toLowerCase();
      const cat = (
        item.categoryName ||
        (typeof item.category === 'object' ? (item.category?.title || item.category?.name || item.category?.slug) : item.category) ||
        item.tags?.[0] ||
        ''
      ).toLowerCase();
      const desc = (item.description || item.tagline || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || title.includes(q) || cat.includes(q) || desc.includes(q);

      let matchesCat = true;
      if (activeCategory !== 'all') {
        const catKey = activeCategory.toLowerCase();
        matchesCat = cat.includes(catKey) || (catKey === 'beauty-care' && (cat.includes('beauty') || cat.includes('care')));
      }

      return matchesSearch && matchesCat;
    });
  }, [allItems, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-32 font-sans w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* 1. Header Section */}
      <div className="pt-6 pb-2">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Explore
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
          Find the best shops, services & more
        </p>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="mt-3">
        <div className="relative w-full">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5 sm:w-5 sm:h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shops or categories..."
            className="w-full pl-11 pr-11 py-3 sm:py-3.5 bg-white rounded-full border border-neutral-200/90 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#016A54]/20 focus:border-[#016A54] transition-all"
          />
          <button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-[#016A54] transition-colors cursor-pointer"
            aria-label="Filter"
          >
            <FiSliders className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 3. Category Filter Pills */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((c) => (
          <CategoryPill
            key={c.id}
            label={c.label}
            active={activeCategory === c.id}
            onClick={() => setActiveCategory(c.id)}
          />
        ))}
      </div>

      {/* 4. Results Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {loading ? (
          <div className="space-y-3 py-4">
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
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-neutral-150/70 mt-4 shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-[#EDF8F5] flex items-center justify-center text-[#016A54] mx-auto mb-3">
              <FiFrown className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-neutral-900">No businesses found</h3>
            <p className="text-xs text-neutral-500 font-medium mt-1 max-w-[240px] mx-auto">
              We couldn't find any results matching "{searchQuery || activeCategory}". Try searching for something else.
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
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
