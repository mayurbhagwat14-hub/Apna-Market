import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiSliders, FiChevronRight, FiMapPin } from 'react-icons/fi';
import { FaStar, FaShoppingBag, FaUtensils, FaCut, FaLaptop, FaTshirt, FaTools } from 'react-icons/fa';
import { publicCatalogService } from '../../../../services/catalogService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const categoryPins = {
  clothing: { bg: '#3B82F6', icon: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M211.8 0c-7.8 0-14.3 5.7-15.4 13.5L168.2 144H23.8C10.7 144 0 154.7 0 167.8c0 3.4.7 6.9 2.2 10l80 160c5.3 10.7 16.2 17.5 28.2 17.5l45.7 0 0 124.7c0 17.7 14.3 32 32 32l264 0c17.7 0 32-14.3 32-32l0-124.7 45.7 0c12 0 22.9-6.8 28.2-17.5l80-160c1.4-3.1 2.2-6.5 2.2-10 0-13.1-10.7-23.8-23.8-23.8H471.8L443.6 13.5C442.5 5.7 436 0 428.2 0L211.8 0z"></path></svg>' },
  restaurants: { bg: '#F97316', icon: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 416 512" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M207.9 15.2c.8 4.7 16.1 94.5 16.1 128.8 0 52.3-27.8 89.6-68.9 99.7L152 480c0 17.7-14.3 32-32 32s-32-14.3-32-32l-3.1-236.3C43.8 233.6 16 196.3 16 144 16 109.7 31.3 19.9 32.1 15.2c2-11.5 12-19.2 23.2-19.2 11.2 0 21.2 7.7 23.2 19.2.2 1.4 7.6 50.8 13.5 83.2 3.6-32.4 11-81.8 11.2-83.2 2-11.5 12-19.2 23.2-19.2s21.2 7.7 23.2 19.2c.2 1.4 7.6 50.8 13.5 83.2 3.6-32.4 11-81.8 11.2-83.2 2-11.5 12-19.2 23.2-19.2s21.2 7.7 23.2 19.2zM368 0c26.5 0 48 21.5 48 48v288c0 17.7-14.3 32-32 32h-32v112c0 17.7-14.3 32-32 32s-32-14.3-32-32V368h-32c-17.7 0-32-14.3-32-32V48c0-26.5 21.5-48 48-48h64z"></path></svg>' },
  services: { bg: '#016A54', icon: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M507.73 109.1c-2.24-9.03-11.06-14.18-20.09-11.94l-75.12 18.66-38.35-38.35 18.66-75.12c2.24-9.03-2.91-17.85-11.94-20.09C371.86-2.26 360.84 0 350.22 0 256.4 0 179.6 74.02 176.22 166.72L50.41 292.53c-15.62 15.62-15.62 40.95 0 56.57l112.49 112.49c15.62 15.62 40.95 15.62 56.57 0l125.81-125.81C437.98 332.4 512 255.6 512 161.78c0-10.62-2.26-21.64-4.27-52.68z"></path></svg>' },
  beauty: { bg: '#EC4899', icon: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg>' },
  electronics: { bg: '#8B5CF6', icon: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M624 416H381.54c-.74 19.81-14.71 32-32.74 32H291.2c-18.03 0-32-12.19-32.74-32H16c-8.84 0-16-7.16-16-16V64c0-8.84 7.16-16 16-16h608c8.84 0 16 7.16 16 16v336c0 8.84-7.16 16-16 16zM576 96H64v256h512V96z"></path></svg>' },
  shops: { bg: '#016A54', icon: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M160 112c0-35.3 28.7-64 64-64s64 28.7 64 64v48H160v-48zm-48 48H48C21.5 160 0 181.5 0 208v240c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V208c0-26.5-21.5-48-48-48h-64v-48C336 44.8 285.2 0 224 0S112 44.8 112 96v64z"></path></svg>' },
};

const filterCategories = ['All', 'Clothing', 'Restaurants', 'Services', 'Beauty & Care', 'Electronics'];

const NearbyMap = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const [listings, setListings] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchArea, setSearchArea] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // User coordinate (Indore center)
  const userLocation = { lat: 22.7196, lng: 75.8577 };

  // Fetch businesses
  useEffect(() => {
    publicCatalogService.getProviderListings({ limit: 50 }).then((res) => {
      const items = res.listings || [];
      setListings(items);
      if (items.length > 0) {
        setSelectedBusiness(items[0]);
      }
    }).catch(console.error);
  }, []);

  // Filter businesses
  const filteredBusinesses = useMemo(() => {
    return listings.filter((item) => {
      const cat = (
        item.categoryName ||
        (typeof item.category === 'object' ? (item.category?.title || item.category?.name || item.category?.slug) : item.category) ||
        item.tags?.[0] ||
        ''
      ).toLowerCase();
      const name = (item.businessName || item.title || '').toLowerCase();
      
      const matchFilter = selectedFilter === 'All' || 
        cat.includes(selectedFilter.toLowerCase()) ||
        item.tags?.some((t) => t.toLowerCase().includes(selectedFilter.toLowerCase()));

      const matchSearch = !searchArea || name.includes(searchArea.toLowerCase()) || cat.includes(searchArea.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [listings, selectedFilter, searchArea]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 14,
      zoomControl: false,
    });

    // Clean carto/osm light tiles (modern minimal map style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
      maxZoom: 19,
    }).addTo(map);

    // User location pulsing beacon marker
    const userPulseIcon = L.divIcon({
      className: 'user-pulse-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(59, 130, 246, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #2563EB; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker([userLocation.lat, userLocation.lng], { icon: userPulseIcon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update business markers when filtered list changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add marker for each business
    filteredBusinesses.forEach((biz, index) => {
      // Determine lat/lng with fallbacks offset slightly around Indore
      const lat = biz.location?.coordinates?.[1] || biz.latitude || (userLocation.lat + (Math.sin(index + 1) * 0.015));
      const lng = biz.location?.coordinates?.[0] || biz.longitude || (userLocation.lng + (Math.cos(index + 1) * 0.018));

      const catSlug = (biz.categoryName || biz.category?.name || 'shops').toLowerCase();
      let pinStyle = categoryPins.shops;
      if (catSlug.includes('cloth') || catSlug.includes('fashion')) pinStyle = categoryPins.clothing;
      else if (catSlug.includes('food') || catSlug.includes('restaur')) pinStyle = categoryPins.restaurants;
      else if (catSlug.includes('service') || catSlug.includes('repair')) pinStyle = categoryPins.services;
      else if (catSlug.includes('beauty') || catSlug.includes('salon')) pinStyle = categoryPins.beauty;
      else if (catSlug.includes('elect')) pinStyle = categoryPins.electronics;

      const isSelected = selectedBusiness && (selectedBusiness.id === biz.id || selectedBusiness._id === biz._id);

      const markerIcon = L.divIcon({
        className: 'custom-biz-pin',
        html: `
          <div style="
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            border-radius: 50%;
            background-color: ${pinStyle.bg};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            border: 2px solid white;
            cursor: pointer;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: all 0.2s ease;
          ">
            ${pinStyle.icon}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedBusiness(biz);
        map.flyTo([lat, lng], 15, { duration: 0.8 });
      });

      markersRef.current.push(marker);
    });
  }, [filteredBusinesses, selectedBusiness]);

  return (
    <div className="relative w-full max-w-lg mx-auto h-screen bg-[#FBFBFA] overflow-hidden flex flex-col shadow-xs">
      {/* Top Header & Search Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 space-y-2 pointer-events-none max-w-lg mx-auto">
        {/* Top Back bar */}
        <div className="flex items-center gap-3 pointer-events-auto bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-sm border border-[#F0F2F1]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-[#F5F7F6] flex items-center justify-center text-[#1A202C] hover:bg-[#EAEFEA] active:scale-95 transition-all"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-[#1A202C]">
            Shops Near You
          </h1>
        </div>

        {/* Search input in area */}
        <div className="relative pointer-events-auto flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-[#F0F2F1] px-3.5 py-2.5">
          <FiSearch className="w-4 h-4 text-[#718096] mr-2 shrink-0" />
          <input
            type="text"
            value={searchArea}
            onChange={(e) => setSearchArea(e.target.value)}
            placeholder="Search this area..."
            className="w-full bg-transparent text-xs text-[#1A202C] placeholder-[#A0AEC0] focus:outline-none font-medium"
          />
          <button
            type="button"
            className="text-[#718096] hover:text-[#016A54] pl-2"
          >
            <FiSliders className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pointer-events-auto">
          {filterCategories.map((cat) => {
            const isActive = selectedFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-[#016A54] text-white'
                    : 'bg-white/95 backdrop-blur-md text-[#4A5568] border border-[#E2E8F0]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Bottom Business Preview Card (matches Screen 6) */}
      {selectedBusiness && (
        <div className="absolute bottom-22 sm:bottom-24 left-0 right-0 z-[1000] px-4 pointer-events-none w-full max-w-lg mx-auto">
          <div
            onClick={() => navigate(`/user/listings/${selectedBusiness.id || selectedBusiness._id}`, { state: { listing: selectedBusiness } })}
            className="pointer-events-auto bg-white rounded-2xl p-3 shadow-xl border border-[#F0F2F1] flex items-center justify-between cursor-pointer hover:shadow-2xl transition-all duration-200 active:scale-[0.99] group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={selectedBusiness.images?.[0] || selectedBusiness.coverImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'}
                alt={selectedBusiness.businessName || selectedBusiness.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-neutral-100"
              />
              <div className="min-w-0 space-y-1">
                <h3 className="text-sm font-bold text-[#1A202C] truncate group-hover:text-[#016A54] transition-colors">
                  {selectedBusiness.businessName || selectedBusiness.title || 'Local Shop'}
                </h3>
                <p className="text-xs text-[#718096] truncate">
                  {(selectedBusiness.categoryName ||
                    (typeof selectedBusiness.category === 'object' ? (selectedBusiness.category?.title || selectedBusiness.category?.name) : selectedBusiness.category) ||
                    'Local Marketplace')} • {selectedBusiness.distance || '1.2 km'}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <FaStar className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                  <span className="font-bold text-[#1A202C]">
                    {selectedBusiness.rating || 4.5}
                  </span>
                  <span className="text-[#718096]">
                    ({selectedBusiness.reviewsCount || 482})
                  </span>
                </div>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#F5F7F6] flex items-center justify-center text-neutral-400 group-hover:text-[#016A54] group-hover:bg-[#EDF8F5] transition-all ml-2 shrink-0">
              <FiChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyMap;
