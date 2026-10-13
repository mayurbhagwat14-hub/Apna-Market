import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { HiX, HiLocationMarker, HiCheck } from 'react-icons/hi';
import { FiNavigation, FiHome, FiBriefcase, FiMapPin, FiLoader, FiSearch, FiX } from 'react-icons/fi';
import { useCity } from '../../../../context/CityContext';
import { toast } from 'react-hot-toast';

const libraries = ['places', 'geometry'];

const CitySelectorModal = ({ isOpen, onClose }) => {
  const {
    cities,
    currentCity,
    selectCity,
    userLocation,
    userAddresses,
    activeAddress,
    selectSavedAddress,
    detectCurrentLocation,
    setExplicitLocation,
    isDetectingLocation
  } = useCity();

  const modalRef = useRef(null);
  const [gpsError, setGpsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Load Google Maps Places API for autocomplete
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking Google Places Autocomplete dropdown
      if (event.target.closest && event.target.closest('.pac-container')) {
        return;
      }
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
      setGpsError(null);
      setSearchQuery('');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleCitySelect = (city) => {
    selectCity(city);
    toast.success(`Location set to ${city.name}`);
    onClose();
  };

  const handleAddressSelect = (addr) => {
    selectSavedAddress(addr);
    toast.success(`Address set to ${addr.addressLine1 || addr.city}`);
    onClose();
  };

  const handleGPSClick = async () => {
    try {
      setGpsError(null);
      const res = await detectCurrentLocation();
      const locName = res?.location?.addressName || 'Current location';
      toast.success(`Location set: ${locName}`);
      onClose();
    } catch (err) {
      setGpsError('Could not access GPS. Please ensure device location is turned ON.');
      window.dispatchEvent(new CustomEvent('requestLocationPrompt'));
      onClose();
    }
  };

  // When user selects a suggestion from Google Places Autocomplete
  const handlePlaceChanged = () => {
    if (!autocomplete) return;

    try {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) {
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const comps = place.address_components || [];

      const getComp = (type) =>
        comps.find((c) => Array.isArray(c.types) && c.types.includes(type))?.long_name || '';

      const sublocality = getComp('sublocality_level_1') || getComp('sublocality') || getComp('neighborhood');
      const locality = getComp('locality');
      const admin2 = getComp('administrative_area_level_2');
      const admin1 = getComp('administrative_area_level_1');
      const postal = getComp('postal_code');

      const area = sublocality || place.name || '';
      const city = locality || admin2 || '';
      const state = admin1 || '';
      const pincode = postal || '';

      let addressName = '';
      if (area && city && area.toLowerCase() !== city.toLowerCase()) {
        addressName = `${area}, ${city}`;
      } else if (area) {
        addressName = area;
      } else if (city) {
        addressName = city;
      } else {
        addressName = place.formatted_address || 'Custom Location';
      }

      const newLoc = {
        lat,
        lng,
        cityName: city || area || 'Indore',
        area,
        state,
        pincode,
        addressName,
        fullAddress: place.formatted_address || addressName,
        source: 'search'
      };

      setExplicitLocation(newLoc);

      // Auto-match currentCity if detected city is in system cities
      if (city && Array.isArray(cities)) {
        const matched = cities.find(
          (c) => c.name?.toLowerCase().trim() === city.toLowerCase().trim()
        );
        if (matched) {
          selectCity(matched);
        }
      }

      toast.success(`Location set to ${addressName}`);
      onClose();
    } catch (e) {
      console.warn('Place selection error:', e);
    }
  };

  // Handle form submission / Enter key press on search input
  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // 1. Check if matches any known city
    const matchedCity = cities.find(
      (c) => c.name?.toLowerCase().trim() === query.toLowerCase()
    );
    if (matchedCity) {
      handleCitySelect(matchedCity);
      return;
    }

    // 2. Geocode search query using Nominatim fallback
    setIsSearching(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`
      );
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const lat = Number(item.lat);
          const lng = Number(item.lon);
          const parts = (item.display_name || '').split(',');
          const addressName = parts.slice(0, 2).join(',').trim() || query;

          const newLoc = {
            lat,
            lng,
            cityName: item.name || query,
            addressName,
            fullAddress: item.display_name || addressName,
            source: 'search'
          };

          setExplicitLocation(newLoc);
          toast.success(`Location set to ${addressName}`);
          onClose();
          return;
        }
      }
      toast.error('Location not found. Please pick from the list or allow GPS.');
    } catch (err) {
      toast.error('Could not find location. Please select from the list.');
    } finally {
      setIsSearching(false);
    }
  };

  // Filter cities by search query
  const cleanQuery = searchQuery.toLowerCase().trim();
  const filteredCities = (cities || []).filter((city) => {
    if (!cleanQuery) return true;
    return (
      (city.name || '').toLowerCase().includes(cleanQuery) ||
      (city.state || '').toLowerCase().includes(cleanQuery)
    );
  });

  // Filter saved addresses by search query
  const filteredAddresses = (userAddresses || []).filter((addr) => {
    if (!cleanQuery) return true;
    return (
      (addr.addressLine1 || '').toLowerCase().includes(cleanQuery) ||
      (addr.city || '').toLowerCase().includes(cleanQuery) ||
      (addr.landmark || '').toLowerCase().includes(cleanQuery) ||
      (addr.type || '').toLowerCase().includes(cleanQuery)
    );
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              ref={modalRef}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col pointer-events-auto"
              style={{ maxHeight: '88vh' }}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Choose Location & Address</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Shops & distances are shown based on this address</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer"
                  aria-label="Close modal"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(88vh - 70px)' }}>
                {/* 1. Type Location / Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative z-20">
                  <div className="relative">
                    {isLoaded ? (
                      <Autocomplete
                        onLoad={setAutocomplete}
                        onPlaceChanged={handlePlaceChanged}
                        options={{
                          componentRestrictions: { country: 'in' },
                          fields: ['formatted_address', 'geometry', 'name', 'address_components']
                        }}
                      >
                        <div className="relative">
                          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                          <input
                            type="text"
                            placeholder="Type area, landmark, or city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 focus:border-[#016A54] rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#016A54]/15 transition-all font-medium"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer z-10"
                              aria-label="Clear search"
                            >
                              <FiX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </Autocomplete>
                    ) : (
                      <div className="relative">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          placeholder="Type area, landmark, or city..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 focus:border-[#016A54] rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#016A54]/15 transition-all font-medium"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer z-10"
                            aria-label="Clear search"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {isSearching && (
                    <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1.5 px-1 font-medium">
                      <FiLoader className="w-3 h-3 animate-spin" />
                      Searching location...
                    </p>
                  )}
                </form>

                {/* 2. Quick GPS Location Button */}
                <button
                  type="button"
                  onClick={handleGPSClick}
                  disabled={isDetectingLocation}
                  className="w-full p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 transition-all flex items-center justify-between group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#016A54] text-white flex items-center justify-center shadow-xs shrink-0">
                      {isDetectingLocation ? (
                        <FiLoader className="w-5 h-5 animate-spin" />
                      ) : (
                        <FiNavigation className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#01352A] flex items-center gap-1.5">
                        <span>Use Current Location</span>
                        <span className="text-[10px] bg-emerald-200/80 text-[#016A54] px-1.5 py-0.2 rounded font-extrabold uppercase">GPS</span>
                      </div>
                      <p className="text-xs text-[#015B48] mt-0.5">
                        {isDetectingLocation ? 'Fetching exact GPS location...' : 'Detect exact location + address via Maps'}
                      </p>
                    </div>
                  </div>
                  {(userLocation?.source === 'gps' || userLocation?.source === 'map_api') && (
                    <div className="w-6 h-6 rounded-full bg-[#016A54] text-white flex items-center justify-center shrink-0">
                      <HiCheck className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>

                {gpsError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    {gpsError}
                  </p>
                )}

                {/* 3. User Saved Addresses Section */}
                {filteredAddresses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                      Saved Delivery Addresses
                    </h4>
                    <div className="grid gap-2">
                      {filteredAddresses.map((addr, idx) => {
                        const isSelected = activeAddress && (
                          (addr._id && activeAddress._id === addr._id) ||
                          (addr.id && activeAddress.id === addr.id) ||
                          (activeAddress.addressLine1 === addr.addressLine1)
                        ) && userLocation?.source === 'saved_address';

                        const icon = addr.type === 'work' ? FiBriefcase : (addr.type === 'home' ? FiHome : FiMapPin);
                        const IconComp = icon;

                        return (
                          <button
                            key={addr._id || addr.id || idx}
                            type="button"
                            onClick={() => handleAddressSelect(addr)}
                            className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#EDF8F5] border-[#016A54] shadow-xs'
                                : 'bg-white border-gray-150 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#016A54] text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-gray-900 capitalize flex items-center gap-1.5">
                                  <span>{addr.type || 'Address'}</span>
                                  {addr.isDefault && (
                                    <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded font-semibold">Default</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 truncate mt-0.5">
                                  {addr.addressLine1} {addr.landmark ? `(${addr.landmark})` : ''}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {addr.city}, {addr.pincode}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#016A54] text-white flex items-center justify-center shrink-0 ml-2">
                                <HiCheck className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Cities Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                    Select City / Region
                  </h4>
                  {filteredCities.length > 0 ? (
                    <div className="grid gap-2">
                      {filteredCities.map((city) => {
                        const isSelected = currentCity && (currentCity._id === city._id || currentCity.id === city.id) && userLocation?.source === 'city';

                        return (
                          <button
                            key={city._id || city.id}
                            type="button"
                            onClick={() => handleCitySelect(city)}
                            className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-[#016A54] shadow-xs'
                                : 'bg-white border-gray-150 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#016A54] text-white shadow-xs' : 'bg-gray-100 text-gray-500'
                              }`}>
                                <HiLocationMarker className="w-4 h-4" />
                              </div>
                              <div>
                                <div className={`text-sm font-bold ${isSelected ? 'text-[#01352A]' : 'text-gray-800'}`}>
                                  {city.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {city.state || 'Madhya Pradesh'}
                                </div>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#016A54] text-white flex items-center justify-center shrink-0">
                                <HiCheck className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
                      <p className="text-xs text-gray-500">
                        No city matches <span className="font-semibold text-gray-700">"{searchQuery}"</span>.
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Select a suggestion from the address search above or press Enter to locate.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CitySelectorModal;
