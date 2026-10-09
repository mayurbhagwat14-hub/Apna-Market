import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiLocationMarker, HiCheck } from 'react-icons/hi';
import { FiNavigation, FiHome, FiBriefcase, FiMapPin, FiLoader } from 'react-icons/fi';
import { useCity } from '../../../../context/CityContext';
import { toast } from 'react-hot-toast';

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
    isDetectingLocation
  } = useCity();

  const modalRef = useRef(null);
  const [gpsError, setGpsError] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
      setGpsError(null);
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
      await detectCurrentLocation();
      toast.success('Current location detected successfully!');
      onClose();
    } catch (err) {
      setGpsError('Could not access GPS. Please allow location permissions in your browser.');
      toast.error('Location permission denied or timed out');
    }
  };

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
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
          >
            <div
              ref={modalRef}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
              style={{ maxHeight: '85vh' }}
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
              <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(85vh - 70px)' }}>
                {/* 1. Quick GPS Location Button */}
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
                        {isDetectingLocation ? 'Locating device coordinates...' : 'Fetch real-time GPS location'}
                      </p>
                    </div>
                  </div>
                  {userLocation?.source === 'gps' && (
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

                {/* 2. User Saved Addresses Section */}
                {userAddresses && userAddresses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                      Saved Delivery Addresses
                    </h4>
                    <div className="grid gap-2">
                      {userAddresses.map((addr, idx) => {
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
                                <HiCheck className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Cities Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                    Select City / Region
                  </h4>
                  <div className="grid gap-2">
                    {cities.map((city) => {
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
                              <HiCheck className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
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
