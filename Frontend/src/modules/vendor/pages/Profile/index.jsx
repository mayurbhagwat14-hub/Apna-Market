import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiEdit2, FiMapPin, FiPhone, FiMail, FiBriefcase, FiStar, FiArrowRight, FiSettings, FiChevronRight, FiCreditCard, FiLogOut, FiTrash2, FiLayers, FiFileText, FiPackage, FiBell } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors, gradients } from '../../../../theme';
import { vendorAuthService } from '../../../../services/authService';
import { sendTestPushNotification } from '../../../../services/pushNotificationService';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import LogoLoader from '../../../../components/common/LogoLoader';
import { useBranding } from '../../../../context/BrandingContext';
import { Button } from '../../../../components/ui';

const Profile = () => {
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);

  const handleTestNotification = async () => {
    setIsSendingTestNotif(true);
    const toastId = toast.loading('Sending test notification to vendor...');
    try {
      const res = await sendTestPushNotification('vendor');
      toast.success(res.message || 'Test notification sent! Check your notification bar.', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Failed to send notification', { id: toastId });
    } finally {
      setIsSendingTestNotif(false);
    }
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const menuItems = [
    { id: 1, label: 'Meri Dukaanein (Shop Listings)', icon: FiLayers, path: '/vendor/my-services' },
    { id: 1.5, label: 'Dukaan Listing & Info', icon: FiFileText, path: '/vendor/add-service' },
    { id: 1.6, label: 'My Subscription', icon: FiPackage, path: '/vendor/subscription' },
    { id: 2, label: 'Wallet', icon: FaWallet, path: '/vendor/wallet' },
    { id: 5, label: 'My Ratings', icon: FiStar, path: '/vendor/my-ratings' },
    { id: 6, label: 'Manage Payment Methods', icon: FiCreditCard, path: '/vendor/manage-payment-methods' },
    { id: 7, label: 'Manage Address', icon: FiMapPin, path: '/vendor/address-management' },
    { id: 8, label: 'Settings', icon: FiSettings, path: '/vendor/settings' },
    { id: 9, label: `About ${branding.appName}`, icon: null, customIcon: branding.appName.charAt(0), path: '/vendor/about-app' },
  ];

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      // Try to load from local storage first for immediate display
      const storedVendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
      if (storedVendorData && Object.keys(storedVendorData).length > 0) {
        setProfile({
          name: storedVendorData.name || 'Vendor Name',
          businessName: storedVendorData.businessName || null,
          phone: storedVendorData.phone || '',
          email: storedVendorData.email || '',
          address: storedVendorData.address ?
            (typeof storedVendorData.address === 'string' ? storedVendorData.address :
              `${storedVendorData.address.addressLine1 || ''} ${storedVendorData.address.addressLine2 || ''} ${storedVendorData.address.city || ''} ${storedVendorData.address.state || ''} ${storedVendorData.address.pincode || ''}`.trim() || 'Not set')
            : 'Not set',
          rating: storedVendorData.rating || 0,
          totalJobs: storedVendorData.totalJobs || 0,
          completionRate: storedVendorData.completionRate || 0,
          serviceCategory: storedVendorData.service || '',
          skills: [],
          photo: storedVendorData.profilePhoto || storedVendorData.businessDetails?.businessLogo || null,
          approvalStatus: storedVendorData.approvalStatus,
          isPhoneVerified: storedVendorData.isPhoneVerified || false,
          isEmailVerified: storedVendorData.isEmailVerified || false
        });
        setIsLoading(false); // Show content immediately
      }

      setError(null);
      try {
        const response = await vendorAuthService.getProfile();
        if (response.success) {
          const vendorData = response.vendor;
          // Format address
          const addressString = vendorData.address
            ? (typeof vendorData.address === 'string' ? vendorData.address :
              `${vendorData.address.addressLine1 || ''} ${vendorData.address.addressLine2 || ''} ${vendorData.address.city || ''} ${vendorData.address.state || ''} ${vendorData.address.pincode || ''}`.trim() || 'Not set')
            : 'Not set';

          setProfile({
            name: vendorData.name || 'Vendor Name',
            businessName: vendorData.businessName || null,
            phone: vendorData.phone || '',
            email: vendorData.email || '',
            address: addressString,
            rating: vendorData.rating || 0,
            totalJobs: vendorData.totalJobs || 0,
            completionRate: vendorData.completionRate || 0,
            serviceCategory: vendorData.service || '',
            skills: [],
            photo: vendorData.profilePhoto || vendorData.businessDetails?.businessLogo || null,
            approvalStatus: vendorData.approvalStatus,
            isPhoneVerified: vendorData.isPhoneVerified || false,
            isEmailVerified: vendorData.isEmailVerified || false
          });
          localStorage.setItem('vendorData', JSON.stringify(vendorData));
        } else {
          // If API fails but we have local data, stick with it?
          if (!storedVendorData || Object.keys(storedVendorData).length === 0) {
            setError(response.message || 'Failed to fetch profile');
            toast.error(response.message || 'Failed to fetch profile');
          }
        }
      } catch (err) {
        console.error('Error fetching vendor profile:', err);
        if (!storedVendorData || Object.keys(storedVendorData).length === 0) {
          setError(err.response?.data?.message || 'Failed to fetch profile');
          toast.error(err.response?.data?.message || 'Failed to fetch profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    window.addEventListener('vendorDataUpdated', fetchProfile);
    window.addEventListener('vendorProfileUpdated', fetchProfile);

    return () => {
      window.removeEventListener('vendorDataUpdated', fetchProfile);
      window.removeEventListener('vendorProfileUpdated', fetchProfile);
    };
  }, []);

  if (isLoading) {
    return <LogoLoader />;
  }

  if (error && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen relative">
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />
        <div className="text-center p-6 relative z-10">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Error loading profile</h2>
          <p className="text-neutral-600 mb-4">{error}</p>
          <Button type="button" onClick={() => window.location.reload()}>
            Refresh page
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />
      <div className="relative z-10">
      <Header title="Profile" />

      <main className="px-4 pt-4 pb-6 max-w-lg mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-[24px] p-5 mb-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
          {/* Decorative subtle gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-3xl opacity-60 -mr-10 -mt-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-60 -ml-10 -mb-10 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-start gap-4">
              {/* Profile Photo */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center overflow-hidden mb-2 bg-gray-50 border-[3px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  {profile.photo ? (
                    <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                {/* Rating Badge */}
                {profile.rating > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-100 shadow-sm">
                    <FiStar className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-[11px] font-bold text-yellow-700">{profile.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-[19px] font-black text-gray-900 mb-0.5 truncate tracking-tight">{profile.name}</h2>
                <p className="text-sm font-bold text-[#016A54] mb-3 truncate">{profile.businessName || 'Service Provider'}</p>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[13px] font-semibold">{profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiMail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[13px] font-semibold truncate">{profile.email}</span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => navigate('/vendor/profile/details')}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex-shrink-0"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Completion Bar */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
                <span>Profile Completion</span>
                <span className="text-[#016A54]">{profile.profileCompletion || 75}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#016A54] rounded-full transition-all duration-500"
                  style={{ width: `${profile.profileCompletion || 75}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => navigate('/vendor/jobs')}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mb-2.5 group-hover:bg-[#016A54] transition-colors">
              <FiBriefcase className="w-4 h-4 text-[#016A54] group-hover:text-white transition-colors" />
            </div>
            <span className="text-[12px] font-bold text-gray-800">Active Jobs</span>
          </button>

          <button
            onClick={() => navigate('/vendor/wallet')}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2.5 group-hover:bg-emerald-500 transition-colors">
              <FaWallet className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <span className="text-[12px] font-bold text-gray-800">Wallet</span>
          </button>

          <button
            onClick={() => navigate('/vendor/my-ratings')}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-2.5 group-hover:bg-purple-500 transition-colors">
              <FiStar className="w-4 h-4 text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <span className="text-[12px] font-bold text-gray-800">Ratings</span>
          </button>
        </div>

        {/* Settings List */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-6">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                    {item.customIcon ? (
                      <span className="text-sm font-bold text-gray-700">{item.customIcon}</span>
                    ) : (
                      IconComponent && <IconComponent className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <span className="text-[15px] font-bold text-gray-800">{item.label}</span>
                </div>
                <FiChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Test Push Notification Card */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-emerald-100 p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#016A54] flex items-center justify-center">
              <FiBell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Push Notification Test</p>
              <p className="text-xs text-gray-500">Test notification with saved FCM token</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={isSendingTestNotif}
            className="px-4 py-2.5 rounded-xl bg-[#016A54] hover:bg-[#015B48] active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            {isSendingTestNotif ? 'Sending...' : 'Test Now 🔔'}
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            try {
              await vendorAuthService.logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
            const keys = [
              'vendorAccessToken',
              'vendorRefreshToken',
              'vendorData',
              'vendorPendingJobs',
              'vendorProfile',
              'vendorSettings',
              'vendorWorkers',
              'vendorAcceptedBookings',
              'vendorWallet',
              'vendorTransactions'
            ];
            keys.forEach((k) => {
              try { localStorage.removeItem(k); } catch {}
              try { sessionStorage.removeItem(k); } catch {}
            });
            window.location.href = '/vendor/login';
          }}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-[20px] transition-colors active:scale-[0.98]"
        >
          <FiLogOut className="w-5 h-5" />
          Logout
        </button>
      </main>

      <BottomNav />
      </div>
    </div>
  );
};

export default Profile;

