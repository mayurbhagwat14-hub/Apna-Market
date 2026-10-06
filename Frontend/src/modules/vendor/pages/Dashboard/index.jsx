import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiBriefcase,
  FiStar,
  FiBell,
  FiUser,
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiTrendingUp,
  FiChevronRight,
  FiLayers,
  FiPlus,
  FiTag,
  FiEye,
  FiCamera,
  FiPhoneCall,
  FiAlertCircle
} from 'react-icons/fi';
import { FaWallet, FaStore } from 'react-icons/fa';
import { vendorTheme as themeColors, gradients } from '../../../../theme';
import { Button } from '../../../../components/ui';
import Header from '../../components/layout/Header';
import { vendorDashboardService } from '../../services/dashboardService';
import vendorMarketingService from '../../services/vendorMarketingService';
import api from '../../../../services/api';
import { registerFCMToken } from '../../../../services/pushNotificationService';
import LogoLoader from '../../../../components/common/LogoLoader';
import toast from 'react-hot-toast';

// Marketing components
import QuickMarketingActions from './components/QuickMarketingActions';
import MarketingStatsCards from './components/MarketingStatsCards';
import ActiveOffersSection from './components/ActiveOffersSection';
import ShopGallerySection from './components/ShopGallerySection';
import CreateOfferModal from './components/CreateOfferModal';
import UploadPhotoModal from './components/UploadPhotoModal';
import PendingBookings from './components/PendingBookings';

const Dashboard = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // Marketing & store state
  const [marketingData, setMarketingData] = useState({
    storeName: 'Apna Store',
    category: 'Local Shop',
    address: 'Indore, MP',
    profilePhoto: null,
    isStoreLive: true,
    stats: {
      storeViews: 1480,
      offerClicks: 215,
      inquiriesCalls: 38,
      customerLikes: 94,
      activeOffersCount: 1,
      totalPhotosCount: 0
    },
    offers: [],
    shopPhotos: []
  });

  const [vendorProfile, setVendorProfile] = useState({
    name: 'Shop Owner',
    businessName: 'Apna Store',
    photo: null,
    categoryName: 'Local Shop',
    address: 'Indore, MP',
    service: []
  });

  const [stats, setStats] = useState({
    todayEarnings: 0,
    activeJobs: 0,
    pendingAlerts: 0,
    workersOnline: 0,
    totalEarnings: 0,
    completedJobs: 0,
    rating: 4.8,
  });

  const [listingStats, setListingStats] = useState({ total: 0, live: 0, pending: 0 });
  const [pendingBookings, setPendingBookings] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const ignoredBookingIds = useRef(new Set());

  // Load all marketing data (Offers, Photos, Store stats)
  const loadMarketingData = useCallback(async () => {
    try {
      const res = await vendorMarketingService.getOverview();
      if (res.success && res.data) {
        setMarketingData(prev => ({
          ...prev,
          ...res.data,
          stats: {
            ...prev.stats,
            ...res.data.stats,
            activeOffersCount: (res.data.offers || []).filter(o => (!o.reviewStatus || o.reviewStatus === 'approved') && o.isActive).length,
            totalPhotosCount: (res.data.shopPhotos || []).length
          }
        }));

        if (res.data.storeName) {
          setVendorProfile(p => ({
            ...p,
            businessName: res.data.storeName,
            categoryName: res.data.category || p.categoryName,
            address: res.data.address || p.address
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch marketing overview:', err);
    }
  }, []);

  // Process Booking API response
  const processApiResponse = useCallback((response) => {
    if (!response.success) return;

    const { stats: apiStats, recentBookings, config } = response.data;

    const requestedBookings = (recentBookings || []).filter(booking => {
      const s = booking.status?.toLowerCase();
      return s === 'requested' || s === 'searching';
    });
    const otherBookings = (recentBookings || []).filter(booking => {
      const s = booking.status?.toLowerCase();
      return s !== 'requested' && s !== 'searching';
    });

    const mergedMap = new Map();
    const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
    const vendorId = vendorData._id || vendorData.id;

    requestedBookings.forEach(b => {
      const id = String(b._id || b.id);
      let distance = 'Nearby';
      if (b.potentialVendors && vendorId) {
        const potentialVendor = b.potentialVendors.find(pv =>
          String(pv.vendorId?._id || pv.vendorId) === String(vendorId)
        );
        if (potentialVendor && potentialVendor.distance) {
          distance = `${potentialVendor.distance.toFixed(1)} km`;
        }
      }

      mergedMap.set(id, {
        ...b,
        id,
        serviceName: b.serviceName || b.serviceId?.title || 'Customer Inquiry / Order',
        serviceCategory: b.serviceCategory || b.serviceId?.categoryId?.title || 'Store Order',
        customerName: b.userId?.name || 'Customer',
        location: {
          address: b.address?.addressLine1 || 'Local Customer Area',
          distance
        },
        price: (b.vendorEarnings > 0 ? b.vendorEarnings : (b.finalAmount > 0 ? b.finalAmount * 0.9 : 0)).toFixed(2),
        vendorEarnings: b.vendorEarnings,
        timeSlot: {
          date: new Date(b.scheduledDate).toLocaleDateString(),
          time: b.scheduledTime || 'Time not set'
        },
        status: b.status,
        expiresAt: b.expiresAt || (b.createdAt && config ? new Date(new Date(b.createdAt).getTime() + (config.maxSearchTime || 5) * 60000).toISOString() : null)
      });
    });

    const finalMap = new Map();
    mergedMap.forEach((val, key) => {
      if (!ignoredBookingIds.current.has(key)) finalMap.set(key, val);
    });

    const localPending = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
    const apiPending = Array.from(finalMap.values());
    const mergedPending = [...apiPending];

    localPending.forEach(localJob => {
      const id = String(localJob.id || localJob._id);
      if (!mergedPending.find(job => String(job.id || job._id) === id) && !ignoredBookingIds.current.has(id)) {
        const lowerStatus = String(localJob.status || '').toLowerCase();
        if (lowerStatus === 'requested' || lowerStatus === 'searching') {
          mergedPending.push({ ...localJob, id });
        }
      }
    });

    setPendingBookings(mergedPending);
    localStorage.setItem('vendorPendingJobs', JSON.stringify(mergedPending));

    setStats({
      todayEarnings: apiStats.vendorEarnings || 0,
      activeJobs: apiStats.inProgressBookings || 0,
      pendingAlerts: mergedPending.length,
      workersOnline: apiStats.workersOnline || 0,
      totalEarnings: apiStats.vendorEarnings || 0,
      completedJobs: apiStats.completedBookings || 0,
      rating: apiStats.rating || 4.8,
    });

    const recentJobsData = otherBookings.slice(0, 3).map(booking => ({
      id: booking._id,
      serviceType: booking.serviceId?.title || 'Order / Inquiry',
      customerName: booking.userId?.name || 'Customer',
      location: booking.address?.addressLine1 || 'Local Customer',
      price: (booking.vendorEarnings > 0 ? booking.vendorEarnings : (booking.finalAmount ? booking.finalAmount * 0.9 : 0)).toFixed(2),
      timeSlot: {
        date: new Date(booking.scheduledDate).toLocaleDateString(),
        time: booking.scheduledTime || 'Time not set'
      },
      status: booking.status,
    }));
    setRecentJobs(recentJobsData);
  }, []);

  // Main data loader
  const loadDashboardData = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);

      // Load marketing overview and dashboard stats simultaneously
      await Promise.allSettled([
        loadMarketingData(),
        vendorDashboardService.getDashboardStats().then(processApiResponse)
      ]);

      // Load vendor profile from localStorage
      const profile = JSON.parse(localStorage.getItem('vendorData') || '{}');
      setVendorProfile(prev => ({
        ...prev,
        name: profile.name || prev.name,
        businessName: profile.businessName || profile.businessDetails?.businessName || profile.name || prev.businessName,
        photo: profile.profilePhoto || prev.photo,
        categoryName: (profile.categories && profile.categories[0]) || (profile.service && profile.service[0]) || prev.categoryName,
        address: profile.address?.city || profile.address?.fullAddress || prev.address
      }));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(String(err.message || 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, [loadMarketingData, processApiResponse]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Load listing count
  useEffect(() => {
    api.get('/vendors/services', { params: { limit: 50 }, cacheTtl: 30 })
      .then((res) => {
        const items = res.data?.data || [];
        setListingStats({
          total: res.data?.pagination?.total ?? items.length,
          live: items.filter((s) => s.status === 'APPROVED').length,
          pending: items.filter((s) => s.status === 'PENDING_REVIEW' || s.status === 'CHANGES_REQUESTED').length
        });
      })
      .catch(() => {});
  }, []);

  // Event listeners for real-time updates
  useEffect(() => {
    registerFCMToken('vendor', true).catch(err => console.error('FCM registration failed:', err));

    const handleUpdate = () => {
      loadMarketingData();
    };

    window.addEventListener('vendorJobsUpdated', handleUpdate);
    window.addEventListener('vendorStatsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('vendorJobsUpdated', handleUpdate);
      window.removeEventListener('vendorStatsUpdated', handleUpdate);
    };
  }, [loadMarketingData]);

  // Marketing Offer Actions
  const handleCreateOffer = async (offerData) => {
    const res = await vendorMarketingService.createOffer(offerData);
    if (res.success) {
      await loadMarketingData();
    }
  };

  const handleToggleOffer = async (id, isActive) => {
    try {
      await vendorMarketingService.updateOffer(id, { isActive });
      setMarketingData(prev => ({
        ...prev,
        offers: prev.offers.map(o => (o._id === id || o.id === id ? { ...o, isActive, reviewStatus: 'pending' } : o)),
        stats: {
          ...prev.stats,
          activeOffersCount: prev.offers.filter(o => {
            if (o._id === id || o.id === id) return false;
            return (!o.reviewStatus || o.reviewStatus === 'approved') && o.isActive;
          }).length
        }
      }));
      toast.success(isActive ? 'Offer activation sent for admin approval' : 'Offer pause sent for admin approval');
    } catch (err) {
      toast.error('Failed to update offer');
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      await vendorMarketingService.deleteOffer(id);
      setMarketingData(prev => ({
        ...prev,
        offers: prev.offers.filter(o => (o._id !== id && o.id !== id)),
        stats: {
          ...prev.stats,
          activeOffersCount: Math.max(0, (prev.stats?.activeOffersCount || 1) - 1)
        }
      }));
      toast.success('Offer deleted successfully');
    } catch (err) {
      toast.error('Failed to delete offer');
    }
  };

  // Marketing Photo Actions
  const handleUploadPhoto = async (photoData) => {
    const res = await vendorMarketingService.uploadPhoto(photoData);
    if (res.success) {
      await loadMarketingData();
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm('Are you sure you want to remove this photo?')) return;
    try {
      await vendorMarketingService.deletePhoto(id);
      setMarketingData(prev => ({
        ...prev,
        shopPhotos: prev.shopPhotos.filter(p => (p._id !== id && p.id !== id && p !== id)),
        stats: {
          ...prev.stats,
          totalPhotosCount: Math.max(0, (prev.stats?.totalPhotosCount || 1) - 1)
        }
      }));
      toast.success('Photo removed successfully');
    } catch (err) {
      toast.error('Failed to delete photo');
    }
  };

  // Store Live visibility toggle
  const handleToggleStoreLive = async () => {
    const nextStatus = !marketingData.isStoreLive;
    try {
      await vendorMarketingService.toggleVisibility(nextStatus);
      setMarketingData(prev => ({ ...prev, isStoreLive: nextStatus }));
      toast.success(nextStatus ? '🟢 Store is now LIVE on Apna Market!' : '🟡 Store is temporarily paused');
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  // Helper for category badge styling
  const formatCategory = (cat) => {
    if (!cat) return '🛍️ Local Store';
    const s = String(cat).toLowerCase();
    if (s.includes('shop') || s.includes('retail')) return '🛍️ Retail Shop';
    if (s.includes('cloth') || s.includes('fashion') || s.includes('wear')) return '👗 Fashion & Wear';
    if (s.includes('rest') || s.includes('food') || s.includes('cafe')) return '🍽️ Restaurant & Cafe';
    if (s.includes('salon') || s.includes('beauty')) return '💄 Beauty & Salon';
    if (s.includes('elec')) return '📱 Electronics';
    return `🏪 ${cat}`;
  };

  if (loading) {
    return <LogoLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center relative">
        <div className="text-center px-6 relative z-10">
          <p className="text-5xl mb-4" aria-hidden>⚠️</p>
          <h2 className="text-neutral-900 text-xl font-bold mb-2">Failed to Load Dashboard</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Button type="button" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const currentStoreName = marketingData.storeName || vendorProfile.businessName || vendorProfile.name;
  const currentCategory = formatCategory(marketingData.category || vendorProfile.categoryName);
  const currentAddress = marketingData.address || vendorProfile.address || 'Indore, MP';

  return (
    <div className="min-h-screen pb-24 relative bg-[#f8fafc]">
      {/* Decorative top-right soft glow */}
      <div className="fixed top-0 right-0 w-[80vw] h-[360px] bg-gradient-to-b from-[#016A54]/10 to-transparent rounded-bl-full pointer-events-none z-0" aria-hidden />

      {/* Top Header - Vendor / Store Identity */}
      <div className="relative z-20">
        <Header 
          title="" 
          showBack={false} 
          notificationCount={stats.pendingAlerts} 
          customHeaderContent={
            <div 
              className="flex items-center gap-3 ml-2 pl-3 py-1 cursor-pointer transition-transform active:scale-95"
              onClick={() => navigate('/vendor/profile')}
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-400 bg-white/10 shrink-0 shadow-md relative flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  {marketingData.profilePhoto || vendorProfile.photo ? (
                    <img 
                      src={marketingData.profilePhoto || vendorProfile.photo} 
                      alt={currentStoreName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <FaStore className="w-6 h-6 text-[#016A54]" />
                  )}
                </div>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[17px] font-black leading-tight text-white truncate max-w-[170px] tracking-tight">
                    {currentStoreName}
                  </span>
                  <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
                <div className="text-[11px] text-emerald-100/90 font-semibold truncate max-w-[180px] leading-tight flex items-center gap-2">
                  <span className="truncate">{currentCategory}</span>
                  <span className="text-white/40">•</span>
                  <span className="flex items-center gap-0.5 truncate text-gray-300">
                    <FiMapPin className="w-2.5 h-2.5 shrink-0" /> {currentAddress}
                  </span>
                </div>
              </div>
            </div>
          }
        />
      </div>

      <main className="pt-0 relative z-10 space-y-4">

        {/* 1. Store Online / Live Status Switch Banner */}
        <div className="px-4 pt-3">
          <div className="w-full rounded-2xl bg-white border border-gray-100 p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                {marketingData.isStoreLive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${marketingData.isStoreLive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              </span>
              <div>
                <p className="text-[14px] font-extrabold text-gray-900 leading-tight">
                  {marketingData.isStoreLive ? 'Store is Live' : 'Store is Paused'}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">
                  {marketingData.isStoreLive ? 'Nearby customers can discover & call your shop' : 'Store is currently hidden from customer search'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleStoreLive}
              className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide transition-all shadow-xs ${
                marketingData.isStoreLive 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {marketingData.isStoreLive ? 'Live on App' : 'Go Online'}
            </button>
          </div>
        </div>

        {/* 2. Quick Marketing Actions Bar (Post Offer, Upload Photos, Catalog) */}
        <QuickMarketingActions
          storeName={currentStoreName}
          onOpenOfferModal={() => setIsOfferModalOpen(true)}
          onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
        />

        {/* 3. Marketing Reach & Footfall Analytics (Impressions, Clicks, Inquiries) */}
        <MarketingStatsCards
          stats={marketingData.stats}
          onOpenOffers={() => setIsOfferModalOpen(true)}
          onOpenPhotos={() => setIsPhotoModalOpen(true)}
        />

        {/* 4. Active Offers & Discounts Manager Section */}
        <div className="px-4">
          <ActiveOffersSection
            offers={marketingData.offers}
            onOpenCreateModal={() => setIsOfferModalOpen(true)}
            onToggleOffer={handleToggleOffer}
            onDeleteOffer={handleDeleteOffer}
          />
        </div>

        {/* 5. Shop Showcase & Photos Gallery Section */}
        <div className="px-4">
          <ShopGallerySection
            photos={marketingData.shopPhotos}
            onOpenUploadModal={() => setIsPhotoModalOpen(true)}
            onDeletePhoto={handleDeletePhoto}
          />
        </div>

        {/* 6. Catalog / Services Management Button */}
        <div className="px-4">
          <button
            type="button"
            onClick={() => navigate('/vendor/my-services')}
            className="w-full bg-white rounded-3xl p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                <FiLayers className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-bold text-gray-900 mb-0.5">Product & Menu Catalog</p>
                <p className="text-[12px] text-gray-500 font-medium">
                  {listingStats.total === 0
                    ? 'Add items & rate cards for customers to explore'
                    : `${listingStats.live} items live • ${listingStats.pending} in review`}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[13px] font-bold text-[#016A54] bg-[#016A54]/10 px-3 py-1.5 rounded-full">
              {listingStats.total === 0 ? 'Add Items' : 'Manage'} <FiChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
            </span>
          </button>
        </div>

        {/* 7. Pending Customer Inquiries / Orders (if any) */}
        {pendingBookings.length > 0 && (
          <div className="px-4">
            <PendingBookings
              bookings={pendingBookings}
              setPendingBookings={setPendingBookings}
            />
          </div>
        )}

        {/* 8. Local Marketing Footfall Growth Tips Card */}
        <div className="px-4">
          <div className="rounded-3xl p-4.5 bg-gradient-to-br from-[#016A54] to-[#014032] text-white shadow-lg shadow-[#016A54]/15 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-extrabold uppercase tracking-wider">
                  Store Growth Tip
                </span>
                <span className="text-emerald-200 text-xs font-semibold">Attract 3x Footfall</span>
              </div>
              <h4 className="text-[15px] font-black tracking-tight mb-1">
                Weekend Flash Offers & Clear Storefront Photos
              </h4>
              <p className="text-[12px] text-emerald-100/80 font-medium leading-relaxed mb-3">
                Customers in your area search for active discounts on weekends. Keep your photos and festive banners updated to rank on top.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full bg-white text-[#016A54] text-xs font-black shadow-md hover:bg-emerald-50 active:scale-95 transition-all"
                >
                  Create Weekend Deal
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold hover:bg-white/25 transition-all"
                >
                  Upload New Photo
                </button>
              </div>
            </div>

            {/* Decorative Vector */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          </div>
        </div>

      </main>

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        onOfferCreated={handleCreateOffer}
      />

      {/* Upload Photo Modal */}
      <UploadPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotoUploaded={handleUploadPhoto}
      />

    </div>
  );
});

Dashboard.displayName = 'VendorDashboard';
export default Dashboard;
