import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiCompass, FiMapPin, FiHeart, FiUser } from 'react-icons/fi';
import { HiHome, HiHeart, HiUser } from 'react-icons/hi';
import { FaCompass } from 'react-icons/fa';
import { useSaved } from '../../../../context/SavedContext';

const BottomNav = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { savedIds } = useSaved();

  const ALLOWED_PATHS = [
    '/user',
    '/user/',
    '/user/explore',
    '/user/map',
    '/user/nearby',
    '/user/saved',
    '/user/favorites',
    '/user/account',
    '/user/profile',
    '/user/all-services'
  ];

  // Also show on category pages if desired, but hide on checkout/booking track
  const isExcluded = location.pathname.includes('/checkout') ||
    location.pathname.includes('/booking/') ||
    location.pathname.includes('/login') ||
    location.pathname.includes('/signup');

  const shouldShow = !isExcluded && (
    ALLOWED_PATHS.includes(location.pathname) ||
    location.pathname.startsWith('/user/category') ||
    location.pathname === '/user/explore' ||
    location.pathname === '/user/map' ||
    location.pathname === '/user/saved'
  );

  if (!shouldShow) {
    return null;
  }

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/user' || path === '/user/') return 'home';
    if (path.includes('/explore') || path.includes('/all-services') || path.startsWith('/user/category')) return 'explore';
    if (path.includes('/map') || path.includes('/nearby')) return 'map';
    if (path.includes('/saved') || path.includes('/favorites')) return 'saved';
    if (path.includes('/account') || path.includes('/profile') || path.includes('/settings')) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full sm:max-w-xl md:max-w-2xl mx-auto pointer-events-none pb-[env(safe-area-inset-bottom)] sm:pb-3 sm:px-4">
      <div className="bg-white/95 backdrop-blur-xl border-t sm:border border-neutral-150/80 px-4 sm:px-6 py-1.5 sm:py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] sm:shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex items-center justify-around pointer-events-auto rounded-t-3xl sm:rounded-full transition-all">
        
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => navigate('/user')}
          className={`flex flex-col items-center justify-center w-14 h-12 transition-all active:scale-95 ${
            activeTab === 'home' ? 'text-[#016A54] font-extrabold' : 'text-neutral-400 hover:text-neutral-700'
          }`}
          aria-label="Home"
        >
          {activeTab === 'home' ? (
            <HiHome className="w-5.5 h-5.5 text-[#016A54]" />
          ) : (
            <FiHome className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Home</span>
        </button>

        {/* 2. Explore */}
        <button
          type="button"
          onClick={() => navigate('/user/explore')}
          className={`flex flex-col items-center justify-center w-14 h-12 transition-all active:scale-95 ${
            activeTab === 'explore' ? 'text-[#016A54] font-extrabold' : 'text-neutral-400 hover:text-neutral-700'
          }`}
          aria-label="Explore"
        >
          {activeTab === 'explore' ? (
            <FaCompass className="w-5 h-5 text-[#016A54]" />
          ) : (
            <FiCompass className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Explore</span>
        </button>

        {/* 3. Center Raised Map / Nearby Action Button */}
        <div className="relative -mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={() => navigate('/user/map')}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
              activeTab === 'map'
                ? 'bg-[#014A3B] text-white ring-4 ring-[#EDF8F5] shadow-[#014A3B]/40'
                : 'bg-[#016A54] text-white shadow-[#016A54]/30 hover:bg-[#015B48]'
            }`}
            aria-label="Nearby Map"
          >
            <FiMapPin className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* 4. Saved */}
        <button
          type="button"
          onClick={() => navigate('/user/saved')}
          className={`flex flex-col items-center justify-center w-14 h-12 relative transition-all active:scale-95 ${
            activeTab === 'saved' ? 'text-[#016A54] font-extrabold' : 'text-neutral-400 hover:text-neutral-700'
          }`}
          aria-label="Saved"
        >
          {activeTab === 'saved' ? (
            <HiHeart className="w-5.5 h-5.5 text-[#016A54]" />
          ) : (
            <FiHeart className="w-5 h-5" />
          )}
          {savedIds.length > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#016A54] ring-2 ring-white"></span>
          )}
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Saved</span>
        </button>

        {/* 5. Profile */}
        <button
          type="button"
          onClick={() => navigate('/user/account')}
          className={`flex flex-col items-center justify-center w-14 h-12 transition-all active:scale-95 ${
            activeTab === 'profile' ? 'text-[#016A54] font-extrabold' : 'text-neutral-400 hover:text-neutral-700'
          }`}
          aria-label="Profile"
        >
          {activeTab === 'profile' ? (
            <HiUser className="w-5.5 h-5.5 text-[#016A54]" />
          ) : (
            <FiUser className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Profile</span>
        </button>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
