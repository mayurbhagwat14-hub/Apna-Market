import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiMail, FiPhone, FiMessageCircle, FiShield, FiChevronRight, FiLogOut, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { userAuthService } from '../../../../services/authService';
import { registerFCMToken, removeFCMToken } from '../../../../services/pushNotificationService';
import BottomNav from '../../components/layout/BottomNav';
import { Button } from '../../../../components/ui';
import { gradients } from '../../../../theme';

const Settings = () => {
  const navigate = useNavigate();

  // State for notification toggles
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
  });

  // Load user settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await userAuthService.getProfile();
      if (response.success && response.user?.settings) {
        setNotifications(prev => ({
          ...prev,
          push: response.user.settings.notifications ?? true
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleToggle = async (key) => {
    // Optimistic update
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    // Handle Push Toggle specifically
    if (key === 'push') {
      const newState = !notifications.push;
      const toastId = toast.loading(newState ? 'Enabling notifications...' : 'Disabling notifications...');

      try {
        if (newState) {
          // Enable
          const token = await registerFCMToken('user', true);
          if (!token) {
            toast.error('Failed to enable. Check permissions.', { id: toastId });
            // Revert state
            setNotifications(prev => ({ ...prev, push: false }));
            return;
          }
        } else {
          // Disable
          await removeFCMToken('user');
        }

        // Persist preference to backend
        await userAuthService.updateProfile({
          settings: { notifications: newState }
        });

        toast.success(newState ? 'Notifications enabled' : 'Notifications disabled', { id: toastId });

      } catch (error) {
        console.error('Error updating notification settings:', error);
        toast.error('Failed to update settings', { id: toastId });
        // Revert
        setNotifications(prev => ({ ...prev, push: !newState }));
      }
    }
  };

  const handlePrivacyClick = () => {
    // Navigate to privacy page (can be implemented later)
    // navigate('/privacy');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-24 text-neutral-900 w-full max-w-lg mx-auto shadow-xs relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F0F2F1] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-[#F5F7F6] flex items-center justify-center text-neutral-800 hover:bg-[#EAEFEA] active:scale-95 transition-all"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-neutral-900">Settings</h1>
        </div>
      </header>

      <main className="px-4 py-5 space-y-6">
        {/* Local Market Alerts Section */}
        <div className="bg-white rounded-2xl border border-neutral-150/80 p-4 shadow-2xs">
          <h2 className="text-sm font-bold text-neutral-900 mb-1">Local Market Alerts</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Stay updated with exclusive offers, weekend flash sales, and new shop openings in your neighborhood.
          </p>
        </div>

        {/* Notifications & Reminders Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 px-1">Notifications & Reminders</h2>

          <div className="bg-white rounded-2xl border border-neutral-150/80 divide-y divide-neutral-100 overflow-hidden shadow-2xs">
            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#EDF8F5] text-[#016A54]">
                  <FiBell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">Push Notifications</span>
                  <span className="text-[11px] text-neutral-400">Receive instant local alerts</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('push')}
                className={`relative w-12 h-6.5 rounded-full transition-colors duration-200 cursor-pointer ${notifications.push ? 'bg-[#016A54]' : 'bg-neutral-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5.5 h-5.5 bg-white rounded-full transition-transform duration-200 shadow-xs ${notifications.push ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#EDF8F5] text-[#016A54]">
                  <FiMail className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">Email Updates</span>
                  <span className="text-[11px] text-neutral-400">Weekly digest of top deals</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('email')}
                className={`relative w-12 h-6.5 rounded-full transition-colors duration-200 cursor-pointer ${notifications.email ? 'bg-[#016A54]' : 'bg-neutral-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5.5 h-5.5 bg-white rounded-full transition-transform duration-200 shadow-xs ${notifications.email ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 px-1">Account & Security</h2>
          <div className="bg-white rounded-2xl border border-neutral-150/80 divide-y divide-neutral-100 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={async () => {
                const confirmed = window.confirm('Are you sure you want to log out?');
                if (confirmed) {
                  await userAuthService.logout();
                  navigate('/user/login');
                  toast.success('Logged out successfully');
                }
              }}
              className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 active:bg-neutral-100 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-50 text-red-500">
                <FiLogOut className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-red-600 block">Log Out</span>
                <span className="text-[11px] text-neutral-400">Sign out of this device</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action is irreversible.')) {
                  toast.loading('Processing deletion...');
                  setTimeout(() => {
                    toast.dismiss();
                    toast.error('Please contact support to delete account for security reasons.');
                  }, 1000);
                }
              }}
              className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 active:bg-neutral-100 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-500">
                <FiTrash2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-700 block">Delete Account</span>
                <span className="text-[11px] text-neutral-400">Permanently remove your account and data</span>
              </div>
            </button>
          </div>
        </div>

        {/* Privacy & Data Section */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/user/cancellation-policy')}
            className="w-full bg-white rounded-2xl border border-neutral-150/80 p-4 flex items-center justify-between hover:bg-neutral-50 active:scale-[0.99] transition-all shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#EDF8F5] text-[#016A54]">
                <FiShield className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-neutral-900 block">Privacy & Terms</span>
                <span className="text-[11px] text-neutral-400">Read policies and community guidelines</span>
              </div>
            </div>
            <FiChevronRight className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
