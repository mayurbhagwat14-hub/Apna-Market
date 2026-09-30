import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { gsap } from 'gsap';
import { themeColors } from '../../../../theme';
import api from '../../../../services/api';

const NotificationBell = ({ notificationCount = 0 }) => {
  const navigate = useNavigate();
  const bellRef = useRef(null);
  const bellButtonRef = useRef(null);
  const [count, setCount] = useState(notificationCount);

  // Sync prop changes
  useEffect(() => {
    if (typeof notificationCount !== 'undefined') {
      setCount(notificationCount);
    }
  }, [notificationCount]);

  // Fetch unread count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!token) return; // Not logged in, count 0

        const res = await api.get('/notifications/user');
        if (res.data.success && typeof res.data.unreadCount === 'number') {
          setCount(res.data.unreadCount);
        }
      } catch (error) {
        // Silent fail (e.g. 401 not logged in)
      }
    };

    fetchUnreadCount();
    
    const handleNotification = () => fetchUnreadCount();
    window.addEventListener('appNotificationReceived', handleNotification);
    
    return () => {
      window.removeEventListener('appNotificationReceived', handleNotification);
    };
  }, []);

  return (
    <div
      ref={bellButtonRef}
      className="relative rounded-full cursor-pointer group active:scale-95 transition-transform duration-300 z-50 shrink-0"
      style={{
        width: '38px',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        navigate('/user/notifications');
      }}
      onMouseEnter={() => {
        if (bellButtonRef.current && bellRef.current) {
          const btn = bellButtonRef.current.querySelector('button');
          gsap.to(bellButtonRef.current, { scale: 1.08, duration: 0.3, ease: 'power2.out' });
          if (btn) {
            gsap.to(btn, {
              boxShadow: count > 0
                ? '0 6px 20px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                : `0 4px 12px ${themeColors.brand.teal}40`,
              duration: 0.3,
              ease: 'power2.out',
            });
          }
          gsap.to(bellRef.current, { rotation: 15, scale: 1.08, duration: 0.3, ease: 'power2.out' });
        }
      }}
      onMouseLeave={() => {
        if (bellButtonRef.current && bellRef.current) {
          const btn = bellButtonRef.current.querySelector('button');
          gsap.to(bellButtonRef.current, { scale: 1.0, duration: 0.3, ease: 'power2.out' });
          if (btn) {
            gsap.to(btn, {
              boxShadow: count > 0
                ? '0 3px 12px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                : `0 2px 6px ${themeColors.brand.teal}26`,
              duration: 0.3,
              ease: 'power2.out',
            });
          }
          gsap.to(bellRef.current, { rotation: 0, scale: 1.0, duration: 0.3, ease: 'power2.out' });
        }
      }}
    >
      {/* Outer Shadow Container */}
      <div className="absolute inset-0 rounded-full z-0 bg-[#016A54] shadow-xs hover:shadow-md transition-shadow" />

      {/* Inner Button */}
      <button
        className="relative z-10 w-full h-full rounded-full flex items-center justify-center bg-[#016A54]"
      >
        <FiBell
          ref={bellRef}
          className="w-[18px] h-[18px] text-white transition-all duration-300"
        />
      </button>

      {/* Active Badge */}
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center z-20 border-2 border-white"
          style={{
            minWidth: '20px',
            height: '20px',
          }}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
