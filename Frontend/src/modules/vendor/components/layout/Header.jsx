import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Logo from '../../../../components/common/Logo';
import api from '../../../../services/api';

const Header = memo(({
  title,
  onBack,
  showBack = true,
  showSearch = false,
  showNotifications = true,
  notificationCount = 0,
  customHeaderContent,
  rightAction,
}) => {
  const navigate = useNavigate();
  const [count, setCount] = useState(notificationCount);

  useEffect(() => {
    if (typeof notificationCount !== 'undefined') {
      setCount(notificationCount);
    }
  }, [notificationCount]);

  useEffect(() => {
    let cancelled = false;
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notifications/vendor', { cacheTtl: 30 });
        if (!cancelled && res.data.success && typeof res.data.unreadCount === 'number') {
          setCount(res.data.unreadCount);
        }
      } catch {
        // Silent fail
      }
    };

    if (showNotifications) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
    return undefined;
  }, [showNotifications]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className="relative w-full bg-[#0B1528] text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] rounded-b-[2rem] overflow-hidden z-40">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[400px] h-32 bg-primary-500/20 blur-[60px] pointer-events-none rounded-full" />
      <div className="px-5 pt-5 pb-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          {showBack ? (
            <motion.button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <FiArrowLeft className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              className="cursor-pointer"
              onClick={() => navigate('/vendor/dashboard')}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo className="h-10 w-auto filter drop-shadow-[0_2px_8px_rgba(1, 106, 84,0.4)]" />
            </motion.button>
          )}
          {showBack && <h1 className="text-lg font-bold text-white">{title || 'Vendor'}</h1>}
          {!showBack && customHeaderContent}
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <button
              type="button"
              className="p-2 rounded-full text-white hover:bg-white/10 transition-colors active:scale-95"
              onClick={() => navigate('/vendor/jobs')}
            >
              <FiSearch className="w-5 h-5" />
            </button>
          )}
          {showNotifications && (
            <motion.button
              type="button"
              onClick={() => navigate('/vendor/notifications')}
              className="relative p-2.5 rounded-full text-white hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.95 }}
              aria-label="Notifications"
            >
              <FiBell className="w-5 h-5 text-white/90" />
              {count > 0 && (
                <span className="absolute -top-1 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#EF4444] rounded-full flex items-center justify-center border-[2.5px] border-[#0B1528] shadow-sm">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </motion.button>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'VendorHeader';
export default Header;
