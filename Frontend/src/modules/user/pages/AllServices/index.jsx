import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import { publicCatalogService } from '../../../../services/catalogService';
import { useCity } from '../../../../context/CityContext';
import { resolveCategoryBookingMode } from '../../../../utils/listingBookingMode';
import CategoryCard from '../../components/common/CategoryCard';
import { EmptyState } from '../../../../components/ui';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const getDefaultAestheticImage = (title = '') => {
  // Add some simple logic to load fallback images like Home does
  const normTitle = (title || '').toLowerCase();
  if (normTitle.includes('driver')) return 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('cook') || normTitle.includes('maharaj')) return 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('worker') || normTitle.includes('helper')) return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('tiffin')) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('dj') || normTitle.includes('sound')) return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('photo') || normTitle.includes('video')) return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('makeup')) return 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('nurse') || normTitle.includes('health')) return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('room') || normTitle.includes('rent')) return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('marriage') || normTitle.includes('wedding')) return 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('clean') || normTitle.includes('housekeeping')) return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80';
  if (normTitle.includes('electric')) return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80';
};

const AllServices = () => {
  const navigate = useNavigate();
  const { selectedCity } = useCity();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const cityId = selectedCity?.id || selectedCity?._id;
        const res = await publicCatalogService.getCategories(cityId);
        if (res?.success) {
          setCategories(res.categories || []);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [selectedCity]);

  const handleCategoryClick = (category) => {
    const id = category?.id || category?._id;
    if (!id) return;
    navigate(`/user/category/${id}`, { state: { category } });
  };

  const filteredCategories = categories.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Premium Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all text-gray-700"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-gray-900 absolute left-1/2 -translate-x-1/2">
            All Services
          </h1>
          <div className="w-10" />
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-gray-100 rounded-2xl text-[15px] font-medium text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1a3673]/20 focus:bg-white border-2 border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="p-4 pt-6">
        {loading ? (
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-gray-200 rounded-xl" />
                <div className="w-12 h-3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center">
            <EmptyState 
              title="No services found" 
              message={`We couldn't find any services matching "${searchQuery}"`}
              icon="search"
            />
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-6 gap-y-6 gap-x-2 sm:gap-4">
            {filteredCategories.map((category, index) => {
              const dbIcon = category.homeIconUrl || category.imageUrl || category.icon || category.image;
              const imageSrc = dbIcon ? toAssetUrl(dbIcon) : getDefaultAestheticImage(category.title);

              return (
                <div key={category.id || category._id || index} className="w-full">
                  <CategoryCard
                    title={category.title}
                    icon={
                      <div className="w-[72px] h-[72px] mx-auto rounded-[20px] overflow-hidden bg-gray-50 shadow-sm border border-gray-100 relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <img
                          src={imageSrc}
                          alt={category.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    }
                    onClick={() => handleCategoryClick(category)}
                    hasSaleBadge={category.hasSaleBadge}
                    bookingMode={resolveCategoryBookingMode(category)}
                    index={index}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllServices;
