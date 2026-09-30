import React, { useState, useEffect, memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiTag, FiUser, FiLayers } from 'react-icons/fi';
import { HiHome, HiTag, HiUser } from 'react-icons/hi';
import { FaWallet } from 'react-icons/fa';

const BottomNav = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingJobsCount, setPendingJobsCount] = useState(0);

  useEffect(() => {
    const updatePendingCount = () => {
      try {
        const pending = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
        const active = pending.filter((j) => {
          const s = (j.status || '').toLowerCase();
          return s === 'requested' || s === 'searching';
        });
        setPendingJobsCount(active.length);
      } catch {
        setPendingJobsCount(0);
      }
    };

    updatePendingCount();
    window.addEventListener('storage', updatePendingCount);
    window.addEventListener('vendorJobsUpdated', updatePendingCount);
    return () => {
      window.removeEventListener('storage', updatePendingCount);
      window.removeEventListener('vendorJobsUpdated', updatePendingCount);
    };
  }, []);

  const navItems = useMemo(
    () => [
      { path: '/vendor/dashboard', icon: FiHome, activeIcon: HiHome, label: 'Home' },
      { path: '/vendor/offers', icon: FiTag, activeIcon: HiTag, label: 'Offers' },
      { path: '/vendor/my-services', icon: FiLayers, activeIcon: FiLayers, label: 'Catalog' },
      { path: '/vendor/wallet', icon: FaWallet, activeIcon: FaWallet, label: 'Wallet' },
      { path: '/vendor/profile', icon: FiUser, activeIcon: HiUser, label: 'Profile' },
    ],
    []
  );

  const hideNavRoutes = ['/vendor/booking-alert/', '/vendor/booking/'];
  const shouldHideNav = hideNavRoutes.some(
    (route) =>
      location.pathname.includes(route) &&
      (location.pathname.includes('/map') || location.pathname.includes('/alert/'))
  );

  if (shouldHideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto pointer-events-none lg:hidden safe-area-bottom">
      <div className="bg-[#0B1528] text-white pt-2.5 pb-2 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.4)] flex items-center justify-around pointer-events-auto backdrop-blur-xl border-t border-white/5">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === '/vendor/dashboard' && location.pathname === '/vendor');
            const IconComponent = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => location.pathname !== item.path && navigate(item.path)}
                className={`flex flex-col items-center justify-center w-14 h-11 transition-all ${
                  isActive ? 'text-[#016A54] font-semibold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="relative mb-1">
                  <IconComponent
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-[#016A54]' : 'text-gray-400'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-[#0B1528]">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-wide">
                  {item.label}
                </span>
              </button>
            );
          })}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
export default BottomNav;
