import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiChevronDown, FiBell } from 'react-icons/fi';
import { useCity } from '../../../../context/CityContext';

const TopHeader = ({ unreadNotifications = 3 }) => {
  const navigate = useNavigate();
  const { currentCity } = useCity();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userData');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      // ignore
    }
  }, []);

  const cityName = currentCity?.name ? `${currentCity.name}, Madhya Pradesh` : 'Indore, Madhya Pradesh';
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : null;
  const userPhoto = user?.profilePhoto || null;

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/90 backdrop-blur-md border-b border-neutral-150/70 transition-all">
      <div className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Location Selector */}
        <button
          type="button"
          onClick={() => navigate('/user/map')}
          className="flex items-center gap-2 group text-left max-w-[65%]"
          aria-label="Change location"
        >
          <div className="w-8 h-8 rounded-full bg-[#EDF8F5] text-[#016A54] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#D5EFEB] transition-colors border border-[#ADE2D7]/50">
            <FiMapPin className="w-4 h-4 text-[#016A54]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 leading-none">
              Current Location
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm font-extrabold text-[#102030] truncate">
                {cityName}
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
            className="relative w-9 h-9 rounded-full bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-neutral-700 hover:text-[#016A54] hover:border-[#ADE2D7] transition-all active:scale-95"
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
            className="w-9 h-9 rounded-full bg-[#016A54] text-white font-black text-xs flex items-center justify-center overflow-hidden ring-2 ring-white shadow-2xs hover:ring-[#ADE2D7] transition-all active:scale-95 cursor-pointer"
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
  );
};

export default TopHeader;
