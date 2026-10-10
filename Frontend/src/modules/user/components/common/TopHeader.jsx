import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiChevronDown, FiBell, FiNavigation } from 'react-icons/fi';
import { useCity } from '../../../../context/CityContext';
import CitySelectorModal from './CitySelectorModal';

const TopHeader = ({ unreadNotifications = 3 }) => {
  const navigate = useNavigate();
  const { currentCity, userLocation } = useCity();
  const [user, setUser] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userData');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      // ignore
    }
  }, []);

  const displayLocation = userLocation?.addressName ||
    (currentCity?.name ? `${currentCity.name}, Madhya Pradesh` : 'Indore, Madhya Pradesh');
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : null;
  const isGps = userLocation?.source === 'gps';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-black/[0.03] shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all">
        <div className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Location Selector Button */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-2 group text-left max-w-[70%] sm:max-w-[65%] cursor-pointer"
            aria-label="Change location & address"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-all ${
              isGps 
                ? 'bg-emerald-600 text-white'
                : 'bg-[#EDF8F5] text-[#016A54] group-hover:bg-[#D5EFEB]'
            }`}>
              {isGps ? <FiNavigation className="w-4 h-4" /> : <FiMapPin className="w-4 h-4 text-[#016A54]" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 leading-none flex items-center gap-1">
                <span>Location</span>
                {isGps && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-black">GPS</span>
                )}
                {userLocation?.source === 'saved_address' && (
                  <span className="text-[9px] bg-sky-100 text-sky-800 px-1 rounded font-black">SAVED</span>
                )}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs sm:text-sm font-extrabold text-[#102030] truncate">
                  {displayLocation}
                </span>
                <FiChevronDown className="w-3.5 h-3.5 text-neutral-500 group-hover:translate-y-0.5 transition-transform shrink-0" />
              </div>
            </div>
          </button>

          {/* Right Actions: Notifications & Profile Avatar */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => navigate('/user/notifications')}
              className="relative w-9 h-9 rounded-full bg-white border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center text-neutral-700 hover:text-[#016A54] hover:shadow-[0_4px_12px_rgba(1,106,84,0.12)] transition-all active:scale-95 cursor-pointer"
              aria-label="Notifications"
            >
              <FiBell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center shadow-xs">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* User Profile Avatar / Guest Icon */}
            <button
              type="button"
              onClick={() => navigate('/user/account')}
              className="w-9 h-9 rounded-full bg-[#016A54] text-white font-black text-xs flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
              aria-label="User Profile"
            >
              {userInitial ? (
                <span>{userInitial}</span>
              ) : (
                <span className="text-[10px] font-bold">G</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Location Selection Modal */}
      <CitySelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
};

export default TopHeader;
