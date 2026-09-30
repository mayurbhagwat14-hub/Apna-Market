import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBriefcase, FiStar, FiBell, FiArrowRight, FiUser, FiClock, FiMapPin, FiCheckCircle, FiTrendingUp, FiChevronRight, FiLayers, FiPlus } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { vendorTheme as themeColors, gradients } from '../../../../theme';
import { Button } from '../../../../components/ui';
import Header from '../../components/layout/Header';
import { vendorDashboardService } from '../../services/dashboardService';
// Booking requests appear under Jobs — no popup alerts
import { io } from 'socket.io-client';
import api from '../../../../services/api';

import { registerFCMToken } from '../../../../services/pushNotificationService';
import LogoLoader from '../../../../components/common/LogoLoader';
import StatsCards from './components/StatsCards';
import PendingBookings from './components/PendingBookings';


const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

const Dashboard = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to convert hex to rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const [stats, setStats] = useState({
    todayEarnings: 0,
    activeJobs: 0,
    pendingAlerts: 0,
    workersOnline: 0,
    totalEarnings: 0,
    completedJobs: 0,
    rating: 0,
  });
  const [vendorProfile, setVendorProfile] = useState({
    name: 'Vendor Name',
    businessName: 'Business Name',
    photo: null,
    service: []
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalConfig, setGlobalConfig] = useState({ maxSearchTime: 5, waveDuration: 60 });
  const [listingStats, setListingStats] = useState({ total: 0, live: 0, pending: 0 });

  const ignoredBookingIds = useRef(new Set());

  // Process API response - extracted to avoid duplication
  const processApiResponse = useCallback((response) => {
    if (!response.success) return;

    const { stats: apiStats, recentBookings, config } = response.data;
    if (config) setGlobalConfig(config);

    // Separate requested/searching bookings from other bookings
    const requestedBookings = (recentBookings || []).filter(booking => {
      const status = booking.status?.toLowerCase();
      return status === 'requested' || status === 'searching';
    });
    const otherBookings = (recentBookings || []).filter(booking => {
      const status = booking.status?.toLowerCase();
      return status !== 'requested' && status !== 'searching';
    });

    // Build pending bookings map
    const mergedMap = new Map();
    const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
    const vendorId = vendorData._id || vendorData.id;

    requestedBookings.forEach(b => {
      const id = String(b._id || b.id);

      // Find distance for this vendor if available
      let distance = 'N/A';
      if (b.potentialVendors && vendorId) {
        const potentialVendor = b.potentialVendors.find(pv =>
          String(pv.vendorId?._id || pv.vendorId) === String(vendorId)
        );
        if (potentialVendor && potentialVendor.distance) {
          distance = `${potentialVendor.distance.toFixed(1)} km`;
        }
      }

      mergedMap.set(id, {
        ...b, // Spread first!
        id,
        serviceName: b.serviceName || b.serviceId?.title || 'New Booking Request',
        serviceCategory: b.serviceCategory || b.serviceId?.categoryId?.title || 'General Service',
        customerName: b.userId?.name || 'Customer',
        location: {
          address: b.address?.addressLine1 || 'Address not available',
          distance: distance
        },
        // Prioritize vendorEarnings, fallback to 90% of finalAmount if it's not a free plan (finalAmount > 0)
        price: (b.vendorEarnings > 0 ? b.vendorEarnings : (b.finalAmount > 0 ? b.finalAmount * 0.9 : 0)).toFixed(2),
        vendorEarnings: b.vendorEarnings, // Ensure it's explicitly passed
        timeSlot: {
          date: new Date(b.scheduledDate).toLocaleDateString(),
          time: b.scheduledTime || 'Time not set'
        },
        status: b.status,
        expiresAt: b.expiresAt || (b.createdAt && config ? new Date(new Date(b.createdAt).getTime() + (config.maxSearchTime || 5) * 60000).toISOString() : null)
      });
    });

    // Filter out locally ignored bookings
    const finalMap = new Map();
    mergedMap.forEach((value, key) => {
      if (!ignoredBookingIds.current.has(key)) {
        finalMap.set(key, value);
      }
    });

    // Merge with local storage to avoid losing real-time updates that haven't hit API yet
    const localPending = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
    const apiPending = Array.from(finalMap.values());
    const mergedPending = [...apiPending];

    localPending.forEach(localJob => {
      const id = String(localJob.id || localJob._id);
      if (!mergedPending.find(job => String(job.id || job._id) === id) && !ignoredBookingIds.current.has(id)) {

        const createdAt = localJob.createdAt ? new Date(localJob.createdAt).getTime() : Date.now();
        const expiresAt = localJob.expiresAt || (localJob.createdAt && config ? new Date(createdAt + (config.maxSearchTime || 5) * 60000).toISOString() : null);
        const isExpired = (expiresAt && new Date(expiresAt) <= new Date()) || (Date.now() - createdAt > 300000);

        const lowerStatus = String(localJob.status || '').toLowerCase();

        if (!isExpired && (lowerStatus === 'requested' || lowerStatus === 'searching')) {
          mergedPending.push({
            ...localJob,
            id,
            serviceName: localJob.serviceName || localJob.serviceId?.title || 'New Booking Request',
            serviceCategory: localJob.serviceCategory || localJob.serviceId?.categoryId?.title || 'General Service',
            customerName: localJob.customerName || localJob.userId?.name || 'Customer',
            expiresAt
          });
        }
      }
    });

    setPendingBookings(mergedPending);
    localStorage.setItem('vendorPendingJobs', JSON.stringify(mergedPending));

    // Update stats
    setStats({
      todayEarnings: apiStats.vendorEarnings || 0,
      activeJobs: apiStats.inProgressBookings || 0,
      pendingAlerts: mergedPending.length,
      workersOnline: apiStats.workersOnline || 0,
      totalEarnings: apiStats.vendorEarnings || 0,
      completedJobs: apiStats.completedBookings || 0,
      rating: apiStats.rating || 0,
    });

    // Recent jobs (non-requested)
    const recentJobsData = otherBookings.slice(0, 3).map(booking => ({
      id: booking._id,
      serviceType: booking.serviceId?.title || 'Service',
      customerName: booking.userId?.name || 'Customer',
      location: booking.address?.addressLine1 || 'Address not available',
      price: (booking.vendorEarnings > 0 ? booking.vendorEarnings : (booking.finalAmount ? booking.finalAmount * 0.9 : 0)).toFixed(2),
      vendorEarnings: booking.vendorEarnings,
      timeSlot: {
        date: new Date(booking.scheduledDate).toLocaleDateString(),
        time: booking.scheduledTime || 'Time not set'
      },
      status: booking.status,
      assignedTo: booking.workerId ? { name: booking.workerId.name } : null,
    }));
    setRecentJobs(recentJobsData);

    // Load vendor profile from localStorage (once)
    const profile = JSON.parse(localStorage.getItem('vendorData') || '{}');
    setVendorProfile({
      name: profile.name || 'Vendor Name',
      businessName: profile.businessName || 'Business Name',
      photo: profile.profilePhoto || null,
      service: profile.service || []
    });
  }, []);

  // Main data loader - useCallback to prevent recreation
  const loadDashboardData = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);

      const response = await vendorDashboardService.getDashboardStats();
      processApiResponse(response);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(String(err.message || 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, [processApiResponse]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

  // If navigated with a specific request id, open Jobs queue (no popup)
  useEffect(() => {
    if (location.state?.openBookingId) {
      navigate('/vendor/jobs', { replace: true });
    }
  }, [location.state, navigate]);

  // Listen for real-time updates via window events (dispatched by useAppNotifications)
  useEffect(() => {
    let refreshTimer = null;
    const handleUpdate = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => loadDashboardData(false), 1000);
    };

    // Ask for notification permission and register FCM
    registerFCMToken('vendor', true).catch(err => console.error('FCM registration failed:', err));

    // Quiet queue: new requests refresh pending list only (no fullscreen alert)
    const handleShowAlert = (e) => {
      if (e.detail) {
        setPendingBookings(prev => {
          if (prev.find(b => b.id === e.detail.id)) return prev;
          return [e.detail, ...prev];
        });
      }
    };

    const handleRemoveBooking = (e) => {
      if (e.detail?.id) {
        const idToRemove = String(e.detail.id);

        // Add to ignored list so it doesn't come back on next fetch
        ignoredBookingIds.current.add(idToRemove);

        // Remove from pending bookings state immediately
        setPendingBookings(prev => prev.filter(b => String(b.id || b._id) !== idToRemove));

        // Remove from recent jobs state
        setRecentJobs(prev => prev.filter(b => String(b.id || b._id) !== idToRemove));

        // Remove from localStorage
        const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
        const updatedPending = pendingJobs.filter(job => String(job.id || job._id) !== idToRemove);
        localStorage.setItem('vendorPendingJobs', JSON.stringify(updatedPending));
      }
    };

    window.addEventListener('vendorJobsUpdated', handleUpdate);
    window.addEventListener('vendorStatsUpdated', handleUpdate);
    window.addEventListener('showDashboardBookingAlert', handleShowAlert);
    window.addEventListener('removeVendorBooking', handleRemoveBooking);

    return () => {
      window.removeEventListener('vendorJobsUpdated', handleUpdate);
      window.removeEventListener('vendorStatsUpdated', handleUpdate);
      window.removeEventListener('showDashboardBookingAlert', handleShowAlert);
      window.removeEventListener('removeVendorBooking', handleRemoveBooking);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [loadDashboardData]);


  // Memoize quickActions to prevent recreation on every render
  const quickActions = useMemo(() => [
    {
      title: 'Active Jobs',
      icon: FiBriefcase,
      color: themeColors?.brand?.blue || '#016A54',
      path: '/vendor/jobs',
      count: stats.activeJobs,
      subtitle: `${stats.activeJobs} running`,
    },
    {
      title: 'My Ratings',
      icon: FiStar,
      color: '#F59E0B',
      path: '/vendor/ratings',
      count: stats.rating > 0 ? stats.rating.toFixed(1) : '—',
      subtitle: 'Customer feedback',
    },
    {
      title: 'Wallet',
      icon: FaWallet,
      color: '#F59E0B',
      path: '/vendor/wallet',
      subtitle: `₹${stats.totalEarnings.toLocaleString()} total`,
    },
  ], [stats.activeJobs, stats.rating, stats.totalEarnings]);

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    const statusColors = {
      'accepted': '#016A54',
      'confirmed': '#10B981',
      'assigned': '#8B5CF6',
      'journey_started': '#F59E0B',
      'visited': '#F59E0B',
      'in_progress': '#F59E0B',
      'work_done': '#10B981',
      'completed': '#10B981',
      'worker_paid': '#016A54',
      'settlement_pending': '#F97316',
    };
    return statusColors[s] || '#6B7280';
  };

  const getStatusLabel = (status) => {
    const s = String(status).toLowerCase();
    const labels = {
      'requested': 'Requested',
      'searching': 'Searching',
      'accepted': 'Accepted',
      'confirmed': 'Confirmed',
      'assigned': 'Assigned',
      'journey_started': 'On the way',
      'visited': 'Visited',
      'in_progress': 'In Progress',
      'work_done': 'Work Done',
      'completed': 'Completed',
      'worker_paid': 'Payment Done',
      'settlement_pending': 'Settlement',
      'cancelled': 'Cancelled',
      'rejected': 'Rejected'
    };
    return labels[s] || status;
  };

  // Show loading state
  if (loading) {
    return <LogoLoader />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center relative">
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />
        <div className="text-center px-6 relative z-10">
          <p className="text-5xl mb-4" aria-hidden>⚠️</p>
          <h2 className="text-neutral-900 text-xl font-semibold mb-2">Failed to Load Dashboard</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Button type="button" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen pb-20 relative bg-[#f8fafc]">
      {/* Top right background accent (like in the design) */}
      <div className="fixed top-0 right-0 w-[80vw] h-[400px] bg-gradient-to-b from-[var(--color-primary-50)] to-transparent rounded-bl-full opacity-60 pointer-events-none z-0" aria-hidden />
      
      <div className="relative z-10">
        <Header 
          title="" 
          showBack={false} 
          notificationCount={stats.pendingAlerts} 
          customHeaderContent={
            <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-4 py-1 cursor-pointer transition-transform active:scale-95" onClick={() => navigate('/vendor/profile')}>
              <div className="w-12 h-12 rounded-full overflow-hidden border-[1.5px] border-[#016A54] bg-transparent shrink-0 shadow-lg relative flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                  {vendorProfile.photo ? (
                    <img src={vendorProfile.photo} alt={vendorProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-full h-full p-2.5 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[17px] font-bold leading-none text-white truncate max-w-[140px] tracking-tight">{vendorProfile.name}</span>
                  <FiCheckCircle className="w-4 h-4 text-[#10B981] shrink-0" />
                </div>
                <span className="text-[12px] text-gray-400 font-medium truncate max-w-[140px] leading-tight flex flex-col gap-0.5">
                  <span>Professional Driver</span>
                  <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" /> Burhanpur, MP</span>
                </span>
              </div>
            </div>
          }
        />
      </div>

      <main className="pt-0 relative z-10">
        {/* Profile Card Section */}




        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/vendor/my-services')}
            className="w-full bg-white rounded-2xl p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#EEF2FF] flex items-center justify-center shrink-0">
                <FiLayers className="w-6 h-6 text-[#016A54]" />
              </div>
              <div className="text-left">
                <p className="text-[16px] font-bold text-gray-900 mb-0.5">My Services</p>
                <p className="text-[13px] text-gray-500 font-medium">
                  {listingStats.total === 0
                    ? 'Add a service + packages for customers to book'
                    : `${listingStats.live} live • ${listingStats.pending} in review`}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[14px] font-bold text-[#016A54]">
              {listingStats.total === 0 ? 'Create' : 'Manage'} <FiChevronRight className="w-4 h-4" strokeWidth={3} />
            </span>
          </button>
        </div>

        {/* Stats Cards - Optimized Component */}
        <StatsCards stats={stats} />

        {/* Content Section (below gradient) */}
        <div className="px-4 py-4 space-y-4">
          {/* Pending Booking Alerts - Optimized Component */}
          <PendingBookings
            bookings={pendingBookings}
            setPendingBookings={setPendingBookings}
          />

          {/* Performance Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Performance Overview</h2>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                This Month <FiChevronRight className="w-3.5 h-3.5 rotate-90" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Completed Jobs Card */}
              <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-shadow min-h-[160px]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#016A54] shadow-sm"></span>
                    <p className="text-[12px] font-bold text-gray-700">Completed Jobs</p>
                  </div>
                  <p className="text-[32px] font-black text-gray-900 leading-none">{stats.completedJobs}</p>
                </div>
                <div className="mt-4 h-[60px] w-full relative">
                  <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d="M0,30 L15,25 L30,28 L45,15 L60,20 L75,10 L90,12 L100,2" fill="none" stroke="#016A54" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0,30 L15,25 L30,28 L45,15 L60,20 L75,10 L90,12 L100,2 L100,40 L0,40 Z" fill="url(#chart-grad-1)" opacity="0.4" />
                    <defs>
                      <linearGradient id="chart-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#016A54" stopOpacity="1" />
                        <stop offset="100%" stopColor="#016A54" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <circle cx="0" cy="30" r="2.5" fill="#016A54" stroke="white" strokeWidth="1" />
                    <circle cx="15" cy="25" r="2.5" fill="#016A54" stroke="white" strokeWidth="1" />
                    <circle cx="30" cy="28" r="2.5" fill="#016A54" stroke="white" strokeWidth="1" />
                    <circle cx="45" cy="15" r="2.5" fill="#016A54" stroke="white" strokeWidth="1" />
                    <circle cx="60" cy="20" r="2.5" fill="#016A54" stroke="white" strokeWidth="1" />
                    <circle cx="75" cy="10" r="2.5" fill="#016A54" stroke="white" strokeWidth="1" />
                    <circle cx="90" cy="12" r="2.5" fill="#016A54" stroke="white" strokeWidth="1" />
                    <circle cx="100" cy="2" r="2.5" fill="#016A54" stroke="white" strokeWidth="1" />
                  </svg>
                  <div className="flex justify-between w-full text-[8px] font-bold text-gray-400 mt-2.5 px-0.5">
                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                  </div>
                </div>
              </div>

              {/* Rating Card */}
              <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-shadow min-h-[160px]">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiStar className="w-3.5 h-3.5 text-[#8B5CF6]" fill="#8B5CF6" />
                    <p className="text-[12px] font-bold text-gray-700">Average Rating</p>
                  </div>
                  <p className="text-[32px] font-black text-gray-900 leading-none">{stats.rating > 0 ? stats.rating.toFixed(1) : '3.0'}</p>
                </div>
                <div className="mt-4 h-[60px] w-full relative">
                  <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d="M0,35 L15,25 L30,20 L45,15 L60,12 L75,14 L90,5 L100,2" fill="none" stroke="#8B5CF6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0,35 L15,25 L30,20 L45,15 L60,12 L75,14 L90,5 L100,2 L100,40 L0,40 Z" fill="url(#chart-grad-2)" opacity="0.4" />
                    <defs>
                      <linearGradient id="chart-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <circle cx="0" cy="35" r="2.5" fill="#8B5CF6" stroke="white" strokeWidth="1" />
                    <circle cx="15" cy="25" r="2.5" fill="#8B5CF6" stroke="white" strokeWidth="1" />
                    <circle cx="30" cy="20" r="2.5" fill="#8B5CF6" stroke="white" strokeWidth="1" />
                    <circle cx="45" cy="15" r="2.5" fill="#8B5CF6" stroke="white" strokeWidth="1" />
                    <circle cx="60" cy="12" r="2.5" fill="#8B5CF6" stroke="white" strokeWidth="1" />
                    <circle cx="75" cy="14" r="2.5" fill="#8B5CF6" stroke="white" strokeWidth="1" />
                    <circle cx="90" cy="5" r="2.5" fill="#8B5CF6" stroke="white" strokeWidth="1" />
                    <circle cx="100" cy="2" r="2.5" fill="#8B5CF6" stroke="white" strokeWidth="1" />
                  </svg>
                  <div className="flex justify-between w-full text-[8px] font-bold text-gray-400 mt-2.5 px-0.5">
                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Jobs - List View */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Active Jobs</h2>
              {recentJobs.length > 0 && (
                <button
                  onClick={() => navigate('/vendor/jobs')}
                  className="font-bold text-[13px] text-[#016A54] hover:text-primary-600 transition-colors"
                >
                  View All
                </button>
              )}
            </div>
            {recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job, index) => {
                  const statusColors = {
                    'Completed': '#10b981',
                    'Canceled': '#ef4444',
                    'Ongoing': '#016A54',
                  };
                  
                  const label = getStatusLabel(job.status);
                  const dummyBorderColors = ['#016A54', '#ef4444', '#f59e0b', '#0ea5e9'];
                  const accentColor = statusColors[label] || dummyBorderColors[index % dummyBorderColors.length];

                  return (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/vendor/booking/${job.id}`)}
                      className="bg-white rounded-[20px] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.03)] cursor-pointer active:scale-[0.98] transition-all duration-300 relative overflow-hidden border border-gray-100 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[5px]"
                        style={{ background: accentColor }}
                      />

                      <div className="px-4 py-4 pl-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border border-primary-100 bg-primary-50/50">
                            <FiUser className="w-5 h-5 text-primary-400" strokeWidth={2} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[15px] font-bold text-gray-900 truncate tracking-tight">{job.customerName}</p>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-500 tracking-wide border border-primary-200">
                                {job.serviceType || 'Service'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 mb-2">
                              <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-[13px] text-gray-500 font-medium truncate">{job.location}</span>
                            </div>

                            <div className="flex items-center gap-3 mt-1.5">
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: `${accentColor}15`, color: accentColor }}
                              >
                                {label}
                              </span>
                              
                              <div className="flex items-center gap-1 text-gray-400">
                                <FiClock className="w-3 h-3" />
                                <span className="text-[11px] font-medium">{job.time}</span>
                              </div>
                            </div>
                          </div>

                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50">
                            <FiChevronRight className="w-4 h-4 text-gray-600" strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] text-center border border-gray-100"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiBriefcase className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-[15px] font-bold text-gray-800 mb-1">No active jobs</p>
                <p className="text-[13px] text-gray-500 font-medium">New bookings will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>

    </div>
  );
});

export default Dashboard;
