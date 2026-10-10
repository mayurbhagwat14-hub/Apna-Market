import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiSliders, FiChevronRight, FiCrosshair, FiMapPin } from 'react-icons/fi';
import { FaStar, FaShoppingBag, FaUtensils, FaCut, FaLaptop, FaTshirt, FaTools } from 'react-icons/fa';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { publicCatalogService } from '../../../../services/catalogService';
import { useCity } from '../../../../context/CityContext';
import { sortShopsByProximity, deduplicateShopListings } from '../../../../utils/distance';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const libraries = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Clean minimalist Google Map style
const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#f8f9fa' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#f1f3f4' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5f5e0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#eceff1' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] }
];

const categoryPins = {
  clothing: { bg: '#3B82F6', Icon: FaTshirt },
  restaurants: { bg: '#F97316', Icon: FaUtensils },
  services: { bg: '#016A54', Icon: FaTools },
  beauty: { bg: '#EC4899', Icon: FaCut },
  electronics: { bg: '#8B5CF6', Icon: FaLaptop },
  shops: { bg: '#016A54', Icon: FaShoppingBag }
};

const filterCategories = ['All', 'Clothing', 'Restaurants', 'Services', 'Beauty & Care', 'Electronics'];

const getPinStyle = (biz) => {
  const catSlug = (
    biz.categoryName ||
    (typeof biz.category === 'object' ? (biz.category?.title || biz.category?.name || biz.category?.slug) : biz.category) ||
    biz.tags?.[0] ||
    'shops'
  ).toLowerCase();

  if (catSlug.includes('cloth') || catSlug.includes('fashion')) return categoryPins.clothing;
  if (catSlug.includes('food') || catSlug.includes('restaur')) return categoryPins.restaurants;
  if (catSlug.includes('service') || catSlug.includes('repair')) return categoryPins.services;
  if (catSlug.includes('beauty') || catSlug.includes('salon')) return categoryPins.beauty;
  if (catSlug.includes('elect')) return categoryPins.electronics;
  return categoryPins.shops;
};

const getBusinessCoords = (biz, index, uLat, uLng) => {
  const lat = Number(biz.lat || biz.latitude || biz.address?.lat || biz.location?.coordinates?.[1]);
  const lng = Number(biz.lng || biz.longitude || biz.address?.lng || biz.location?.coordinates?.[0]);

  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }

  // Deterministic radial spread around user location so markers do not overlap
  const angle = (index * 53.7) % 360;
  const radius = 0.005 + ((index % 6) * 0.0025);
  const spreadLat = uLat + Math.sin(angle) * radius;
  const spreadLng = uLng + Math.cos(angle) * radius * 1.15;

  return { lat: spreadLat, lng: spreadLng };
};

const NearbyMap = () => {
  const navigate = useNavigate();
  const { currentCity, userLocation } = useCity();

  const [listings, setListings] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchArea, setSearchArea] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);

  const googleMapRef = useRef(null);
  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkersRef = useRef([]);

  // Load Google Maps API with verified key
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  // Effective coordinates for user center
  const centerLat = Number(liveLocation?.lat || userLocation?.lat) || 22.7196;
  const centerLng = Number(liveLocation?.lng || userLocation?.lng) || 75.8577;

  const mapCenter = useMemo(() => ({
    lat: centerLat,
    lng: centerLng
  }), [centerLat, centerLng]);

  // Request high-accuracy live GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLiveLocation(coords);
          if (googleMapRef.current) {
            googleMapRef.current.panTo(coords);
          }
        },
        (err) => {
          console.warn('Geolocation fallback to city center:', err?.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Fetch businesses
  useEffect(() => {
    const params = { limit: 60 };
    if (currentCity?.name) params.city = currentCity.name;
    if (centerLat && centerLng) {
      params.lat = centerLat;
      params.lng = centerLng;
    }

    publicCatalogService.getProviderListings(params)
      .then((res) => {
        const items = res.listings || [];
        const deduped = deduplicateShopListings(items);
        const sorted = sortShopsByProximity(deduped, { lat: centerLat, lng: centerLng });
        setListings(sorted);
        if (sorted.length > 0) {
          setSelectedBusiness(sorted[0]);
        }
      })
      .catch(console.error);
  }, [currentCity?.name, centerLat, centerLng]);

  // Filter businesses by search & category
  const filteredBusinesses = useMemo(() => {
    return listings.filter((item) => {
      const cat = (
        item.categoryName ||
        (typeof item.category === 'object' ? (item.category?.title || item.category?.name || item.category?.slug) : item.category) ||
        item.tags?.[0] ||
        ''
      ).toLowerCase();
      const name = (item.businessName || item.title || '').toLowerCase();

      const matchFilter =
        selectedFilter === 'All' ||
        cat.includes(selectedFilter.toLowerCase()) ||
        item.tags?.some((t) => t.toLowerCase().includes(selectedFilter.toLowerCase()));

      const matchSearch =
        !searchArea ||
        name.includes(searchArea.toLowerCase()) ||
        cat.includes(searchArea.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [listings, selectedFilter, searchArea]);

  // Prepare business items with calculated coordinates
  const businessesWithCoords = useMemo(() => {
    return filteredBusinesses.map((biz, index) => ({
      biz,
      coords: getBusinessCoords(biz, index, centerLat, centerLng),
      pinStyle: getPinStyle(biz)
    }));
  }, [filteredBusinesses, centerLat, centerLng]);

  // Google Map load callback
  const onGoogleMapLoad = useCallback((map) => {
    googleMapRef.current = map;
    map.panTo(mapCenter);
  }, [mapCenter]);

  // Re-center handler
  const handleRecenter = () => {
    if (googleMapRef.current) {
      googleMapRef.current.panTo(mapCenter);
      googleMapRef.current.setZoom(15);
    } else if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([mapCenter.lat, mapCenter.lng], 15);
    }
  };

  // Leaflet Fallback (Only if Google Maps API fails to load)
  useEffect(() => {
    if (isLoaded || !loadError || !leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: 14,
        zoomControl: false,
      });

      // Free OpenStreetMap tiles without any API keys or watermarks
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
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
      L.marker([mapCenter.lat, mapCenter.lng], { icon: userPulseIcon }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    leafletMarkersRef.current.forEach((m) => m.remove());
    leafletMarkersRef.current = [];

    businessesWithCoords.forEach(({ biz, coords, pinStyle }) => {
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
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M507.73 109.1c-2.24-9.03-11.06-14.18-20.09-11.94l-75.12 18.66-38.35-38.35 18.66-75.12c2.24-9.03-2.91-17.85-11.94-20.09C371.86-2.26 360.84 0 350.22 0 256.4 0 179.6 74.02 176.22 166.72L50.41 292.53c-15.62 15.62-15.62 40.95 0 56.57l112.49 112.49c15.62 15.62 40.95 15.62 56.57 0l125.81-125.81C437.98 332.4 512 255.6 512 161.78c0-10.62-2.26-21.64-4.27-52.68z"></path></svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: markerIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedBusiness(biz);
        map.flyTo([coords.lat, coords.lng], 15, { duration: 0.8 });
      });
      leafletMarkersRef.current.push(marker);
    });
  }, [isLoaded, loadError, businessesWithCoords, selectedBusiness, mapCenter]);

  return (
    <div className="relative w-full max-w-lg mx-auto h-screen bg-[#FBFBFA] overflow-hidden flex flex-col shadow-xs">
      {/* Top Header & Search Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 space-y-2 pointer-events-none max-w-lg mx-auto">
        {/* Top Back bar */}
        <div className="flex items-center gap-3 pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F0F2F1]">
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
        <div className="relative pointer-events-auto flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F0F2F1] px-3.5 py-2.5">
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
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-xs transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-[#016A54] text-white shadow-sm'
                    : 'bg-white/95 backdrop-blur-md text-[#4A5568] border border-[#E2E8F0]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="w-full h-full z-0 relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={14}
            onLoad={onGoogleMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              gestureHandling: 'greedy',
              styles: mapStyles
            }}
          >
            {/* User Location Pulsing Beacon Marker */}
            <OverlayView
              position={mapCenter}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div
                style={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              >
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute w-8 h-8 rounded-full bg-blue-500/25 animate-ping" />
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-[2.5px] border-white shadow-md relative" />
                </div>
              </div>
            </OverlayView>

            {/* Business Markers on Google Map */}
            {businessesWithCoords.map(({ biz, coords, pinStyle }) => {
              const isSelected = selectedBusiness && (selectedBusiness.id === biz.id || selectedBusiness._id === biz._id);
              const PinIcon = pinStyle.Icon;

              return (
                <OverlayView
                  key={biz._id || biz.id}
                  position={coords}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div
                    style={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedBusiness(biz);
                      if (googleMapRef.current) {
                        googleMapRef.current.panTo(coords);
                        googleMapRef.current.setZoom(15);
                      }
                    }}
                    className={`transition-all duration-200 ${isSelected ? 'scale-120 z-30' : 'scale-100 hover:scale-110 z-10'}`}
                  >
                    <div
                      style={{ backgroundColor: pinStyle.bg }}
                      className={`rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] border-2 border-white transition-all ${
                        isSelected ? 'w-10 h-10 ring-4 ring-black/15 shadow-xl' : 'w-8 h-8'
                      }`}
                    >
                      <PinIcon className={isSelected ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                    </div>
                  </div>
                </OverlayView>
              );
            })}
          </GoogleMap>
        ) : loadError ? (
          /* Graceful Leaflet fallback if Google script fails to load */
          <div ref={leafletContainerRef} className="w-full h-full" />
        ) : (
          /* Smooth Map Loading State */
          <div className="w-full h-full bg-[#F4F6F5] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-[#016A54] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[#718096]">Loading nearby map...</p>
          </div>
        )}
      </div>

      {/* Floating Re-center to My Location Button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute right-4 bottom-48 z-[1000] w-11 h-11 bg-white/95 backdrop-blur-md rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-[#F0F2F1] flex items-center justify-center text-[#1A202C] hover:text-[#016A54] active:scale-95 transition-all"
        title="My Location"
      >
        <FiCrosshair className="w-5 h-5" />
      </button>

      {/* Floating Bottom Business Preview Card */}
      {selectedBusiness && (
        <div className="absolute bottom-22 sm:bottom-24 left-0 right-0 z-[1000] px-4 pointer-events-none w-full max-w-lg mx-auto">
          <div
            onClick={() => navigate(`/user/listings/${selectedBusiness.id || selectedBusiness._id}`, { state: { listing: selectedBusiness } })}
            className="pointer-events-auto bg-white/98 backdrop-blur-md rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-[#F0F2F1] flex items-center justify-between cursor-pointer hover:shadow-[0_12px_36px_rgba(0,0,0,0.16)] transition-all duration-200 active:scale-[0.99] group"
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
                    'Local Marketplace')} • {selectedBusiness.distance || (selectedBusiness.distanceKm ? `${selectedBusiness.distanceKm.toFixed(1)} km` : 'Nearby')}
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
