import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { userAuthService } from '../../../../services/authService';
import { useSaved } from '../../../../context/SavedContext';
import { sendTestPushNotification } from '../../../../services/pushNotificationService';
import {
  FiEdit2,
  FiCompass,
  FiHeart,
  FiBell,
  FiSettings,
  FiHelpCircle,
  FiInfo,
  FiChevronRight,
  FiLogOut,
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';

const Account = () => {
  const navigate = useNavigate();
  const { savedList } = useSaved();

  const [userProfile, setUserProfile] = useState({
    name: 'Bhavesh Bansal',
    phone: '',
    email: '',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    followingCount: 12,
    followersCount: 28,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);

  const handleTestNotification = async () => {
    setIsSendingTestNotif(true);
    const toastId = toast.loading('Sending test notification...');
    try {
      const res = await sendTestPushNotification('user');
      toast.success(res.message || 'Test notification sent! Check your notification bar.', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Failed to send notification', { id: toastId });
    } finally {
      setIsSendingTestNotif(false);
    }
  };

  // Fetch user profile from database
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          setUserProfile((prev) => ({
            ...prev,
            name: userData.name || 'Bhavesh Bansal',
            phone: userData.phone || '',
            email: userData.email || '',
            profilePhoto: userData.profilePhoto || prev.profilePhoto,
          }));
        }

        const response = await userAuthService.getProfile();
        if (response?.success && response.user) {
          setUserProfile((prev) => ({
            ...prev,
            name: response.user.name || prev.name,
            phone: response.user.phone || prev.phone,
            email: response.user.email || prev.email,
            profilePhoto: response.user.profilePhoto || prev.profilePhoto,
          }));
        }
      } catch (error) {
        // Fallback to local
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await userAuthService.logout();
      toast.success('Logged out successfully');
      navigate('/user/login', { replace: true });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('userData');
      toast.success('Logged out successfully');
      navigate('/user/login', { replace: true });
    }
  };

  const menuItems = [
    {
      icon: FiHeart,
      label: 'Saved Shops',
      onClick: () => navigate('/user/saved'),
    },
    {
      icon: FiCompass,
      label: 'Explore Local Businesses',
      onClick: () => navigate('/user/explore'),
    },
    {
      icon: FiBell,
      label: 'Notifications',
      badge: '3',
      onClick: () => navigate('/user/notifications'),
    },
    {
      icon: FiSettings,
      label: 'Settings',
      onClick: () => navigate('/user/settings'),
    },
    {
      icon: FiHelpCircle,
      label: 'Help & Support',
      onClick: () => navigate('/user/help-support'),
    },
    {
      icon: FiInfo,
      label: 'About Apna Market',
      onClick: () => navigate('/user/about-app'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-32 text-[#1A202C] w-full max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 relative">
      {/* Mint Gradient Header with Profile details (Matches Screen 7) */}
      <div className="bg-gradient-to-b from-[#E1F3EE] via-[#EDF8F5] to-[#FBFBFA] pt-8 pb-4 px-4 rounded-3xl mt-2 sm:mt-4">
        <div className="max-w-md mx-auto flex flex-col items-center text-center">
          {/* Avatar display without photo upload button */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md bg-[#EDF8F5] flex items-center justify-center text-[#016A54]">
              {userProfile.name ? (
                <span className="text-3xl font-black">{userProfile.name.charAt(0).toUpperCase()}</span>
              ) : (
                <FiUser className="w-10 h-10 text-[#016A54]" />
              )}
            </div>
          </div>

          {/* Name & Subtitle */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <h1 className="text-lg font-bold text-[#1A202C]">
              {userProfile.name}
            </h1>
            <button
              onClick={() => navigate('/user/update-profile')}
              className="text-[#718096] hover:text-[#016A54]"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-[#718096]">
            Exploring Local • Member since 2026
          </p>

          {/* Stats Row (12 Following, 28 Followers, 5 Saved) */}
          <div className="w-full grid grid-cols-3 gap-2 mt-5 py-3 border-y border-[#E2E8F0]/60 max-w-sm">
            <div className="text-center">
              <p className="text-base font-bold text-[#1A202C]">
                {userProfile.followingCount}
              </p>
              <p className="text-[11px] text-[#718096]">Following</p>
            </div>
            <div className="text-center border-x border-[#E2E8F0]/60">
              <p className="text-base font-bold text-[#1A202C]">
                {userProfile.followersCount}
              </p>
              <p className="text-[11px] text-[#718096]">Followers</p>
            </div>
            <div className="text-center cursor-pointer" onClick={() => navigate('/user/saved')}>
              <p className="text-base font-bold text-[#1A202C]">
                {savedList.length > 0 ? savedList.length : 5}
              </p>
              <p className="text-[11px] text-[#718096]">Saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu List */}
      <main className="max-w-3xl lg:max-w-4xl mx-auto pt-4 space-y-4">
        <div className="bg-white rounded-2xl border border-[#F0F2F1] shadow-sm divide-y divide-[#F0F2F1] overflow-hidden">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={item.onClick}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F9FBFA] active:bg-[#EDF8F5] transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F5F7F6] flex items-center justify-center text-[#4A5568] group-hover:text-[#016A54] group-hover:bg-[#EDF8F5] transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#1A202C]">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                  <FiChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#016A54] transition-colors" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Test Push Notification Card */}
        <div className="bg-white rounded-2xl border border-emerald-100/80 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#016A54] flex items-center justify-center">
              <FiBell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Push Notification Test</p>
              <p className="text-[11px] text-gray-500">Test notification via saved FCM Token</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={isSendingTestNotif}
            className="px-3.5 py-2 rounded-xl bg-[#016A54] hover:bg-[#015B48] active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            {isSendingTestNotif ? 'Sending...' : 'Test Now 🔔'}
          </button>
        </div>

        {/* Bottom "Support Local" Card (Matches Screen 7) */}
        <div className="bg-[#FEF5F0] border border-[#FDDBC9] rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EA580C] text-white flex items-center justify-center shadow-sm">
              <FaStore className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#9A3412]">
                Support Local
              </p>
              <p className="text-[11px] text-[#C2410C]">
                Shop Local • Grow Together
              </p>
            </div>
          </div>
          <FiChevronRight className="w-5 h-5 text-[#C2410C]" />
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>

        {/* Version info */}
        <p className="text-center text-[10px] text-neutral-400 pt-1 pb-4">
          Apna Market v2.6.0 • Indore
        </p>
      </main>
    </div>
  );
};

export default Account;
