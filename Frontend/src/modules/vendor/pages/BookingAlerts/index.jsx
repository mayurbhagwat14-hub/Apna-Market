import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiMapPin, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Header from '../../components/layout/Header';
import { gradients } from '../../../../theme';
import { EmptyState, Loader } from '../../../../components/ui';
import { vendorDashboardService } from '../../services/dashboardService';
import { acceptBooking, rejectBooking, getBookings } from '../../services/bookingService';
import { useSocket } from '../../../../context/SocketContext';

import PendingJobCard from '../../components/bookings/PendingJobCard';

const REQUEST_QUEUE_TABS = [
  { id: 'instant', label: '⚡ Instant', status: 'requests_instant' },
  { id: 'scheduled', label: '📅 Scheduled', status: 'requests_scheduled' },
];

const mapAlertFromApi = (b) => ({
  ...b,
  id: b._id || b.id,
  serviceName: b.serviceName || b.serviceId?.title || 'New Booking Request',
  serviceCategory: b.serviceCategory || b.serviceId?.categoryId?.title || 'General Service',
  customerName: b.userId?.name || 'Customer',
  bookingType: b.bookingType,
  serviceListingId: b.serviceListingId,
  isDirectRequest: Boolean(b.serviceListingId),
  finalAmount: b.finalAmount,
  requireAdvancePayment: b.requireAdvancePayment,
});

const BookingAlerts = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState({ id: null, type: null });
  const [globalConfig, setGlobalConfig] = useState({ maxSearchTime: 5 });
  const [requestQueue, setRequestQueue] = useState('instant');

  const fetchAlerts = React.useCallback(async () => {
    try {
      setLoading(true);
      const statsRes = await vendorDashboardService.getDashboardStats();
      let localConfig = { maxSearchTime: 5 };
      if (statsRes.success && statsRes.data?.config) {
        localConfig = statsRes.data.config;
        setGlobalConfig(localConfig);
      }

      const statusParam = REQUEST_QUEUE_TABS.find((t) => t.id === requestQueue)?.status || 'requests_instant';
      const response = await getBookings({ status: statusParam, limit: 50 });

      if (response.success && response.data) {
        let bookings = response.data;

        const mergedPending = [];

        bookings.forEach((b) => {
          const bId = b._id || b.id;
          const expiresAt = b.expiresAt || (b.createdAt && localConfig
            ? new Date(new Date(b.createdAt).getTime() + (localConfig.maxSearchTime || 5) * 60000).toISOString()
            : null);
          const isExpired = expiresAt && new Date(expiresAt) <= new Date();
          if (!isExpired) {
            mergedPending.push({ ...b, id: bId, expiresAt });
          }
        });

        const apiIds = new Set(mergedPending.map((b) => String(b.id)));
        const localPending = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');

        localPending.forEach((localB) => {
          const id = String(localB.id || localB._id);
          if (!apiIds.has(id)) {
            const createdAt = localB.createdAt ? new Date(localB.createdAt).getTime() : Date.now();
            const expiresAt = localB.expiresAt || (localB.createdAt && localConfig
              ? new Date(createdAt + (localConfig.maxSearchTime || 5) * 60000).toISOString()
              : null);
            const isExpired = (expiresAt && new Date(expiresAt) <= new Date()) || (Date.now() - createdAt > 300000);
            const isInstant = localB.bookingType === 'instant'
              || String(localB.scheduledTime || '').toUpperCase() === 'ASAP';
            const matchesQueue = requestQueue === 'instant' ? isInstant : !isInstant;

            if (!isExpired && matchesQueue && (localB.status === 'requested' || localB.status === 'searching')) {
              mergedPending.push(localB);
            }
          }
        });

        localStorage.setItem('vendorPendingJobs', JSON.stringify(mergedPending));
        setAlerts(mergedPending.map(mapAlertFromApi));
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [requestQueue]);

  // Fetch pending alerts
  useEffect(() => {
    fetchAlerts();

    const handleUpdate = () => fetchAlerts();
    window.addEventListener('vendorJobsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('vendorJobsUpdated', handleUpdate);
    };
  }, [fetchAlerts]);

  // Socket listener for booking_taken (using shared socket from context)
  useEffect(() => {
    if (!socket) {
      console.log('[BookingAlerts] Socket not available yet');
      return;
    }

    console.log('[BookingAlerts] Setting up booking_taken listener on socket:', socket.id);

    const handleBookingTaken = (data) => {
      console.log('[BookingAlerts] booking_taken event received:', data);
      const takenBookingId = String(data.bookingId);

      // Remove from state immediately
      setAlerts(prev => prev.filter(a => {
        const alertId = String(a._id || a.id);
        return alertId !== takenBookingId;
      }));

      // Remove from localStorage
      const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
      const updatedPending = pendingJobs.filter(job => {
        const jobId = String(job.id || job._id);
        return jobId !== takenBookingId;
      });
      localStorage.setItem('vendorPendingJobs', JSON.stringify(updatedPending));

      // Show toast
      toast.error(data.message || 'This job was accepted by another vendor.', { icon: '⚡' });

      // Trigger global update
      window.dispatchEvent(new Event('vendorStatsUpdated'));
      window.dispatchEvent(new Event('vendorJobsUpdated'));
    };

    socket.on('booking_taken', handleBookingTaken);

    return () => {
      socket.off('booking_taken', handleBookingTaken);
    };
  }, [socket]);

  // Listen for local remove events (like timer expiration)
  useEffect(() => {
    const handleRemove = (e) => {
      const idToRemove = String(e.detail?.id);
      if (!idToRemove) return;

      setAlerts(prev => prev.filter(a => String(a._id || a.id) !== idToRemove));

      // Also clean up localStorage
      const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
      const updatedPending = pendingJobs.filter(job => String(job.id || job._id) !== idToRemove);
      localStorage.setItem('vendorPendingJobs', JSON.stringify(updatedPending));
    };

    window.addEventListener('removeVendorBooking', handleRemove);
    return () => window.removeEventListener('removeVendorBooking', handleRemove);
  }, []);

  const handleAccept = async (e, booking) => {
    e?.stopPropagation();
    const bookingId = booking._id || booking.id;
    if (loadingAction.id) return;
    setLoadingAction({ id: bookingId, type: 'accept' });
    try {
      const res = await acceptBooking(bookingId);
      const data = res?.data || res;
      const advance = data?.advanceAmount || booking.advanceAmount;
      const needsAdvance = data?.requireAdvancePayment && Number(advance) > 0;
      toast.success(
        needsAdvance
          ? `Accepted! Waiting for advance ₹${Number(advance).toLocaleString('en-IN')}`
          : 'Booking accepted!'
      );
      // Remove from list
      setAlerts(prev => prev.filter(a => (a._id || a.id) !== bookingId));

      // Remove from localStorage
      const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
      const updatedPending = pendingJobs.filter(job => (job.id || job._id) !== bookingId);
      localStorage.setItem('vendorPendingJobs', JSON.stringify(updatedPending));

      // Trigger global update
      window.dispatchEvent(new Event('vendorStatsUpdated'));
      window.dispatchEvent(new Event('vendorJobsUpdated'));
    } catch (error) {
      console.error('Accept error:', error);
      toast.error('Failed to accept booking');
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };

  const handleReject = async (e, booking) => {
    e?.stopPropagation();
    const bookingId = booking._id || booking.id;
    if (loadingAction.id) return;
    setLoadingAction({ id: bookingId, type: 'reject' });
    try {
      await rejectBooking(bookingId);
      toast.success('Booking rejected');
      setAlerts(prev => prev.filter(a => (a._id || a.id) !== bookingId));

      // Remove from localStorage
      const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
      const updatedPending = pendingJobs.filter(job => (job.id || job._id) !== bookingId);
      localStorage.setItem('vendorPendingJobs', JSON.stringify(updatedPending));

      window.dispatchEvent(new Event('vendorStatsUpdated'));
      window.dispatchEvent(new Event('vendorJobsUpdated'));
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject booking');
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />
      <div className="relative z-10">
      <Header title="Pending Alerts" showBack={true} />

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {!loading && (
          <div className="flex gap-2">
            {REQUEST_QUEUE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRequestQueue(tab.id)}
                className={`flex-1 py-2 rounded-xl font-semibold text-xs transition-all border ${
                  requestQueue === tab.id
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-neutral-600 border-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No pending alerts"
            message="You're all caught up. New booking requests will appear here."
            icon={FiCheckCircle}
            actionLabel="Back to dashboard"
            onAction={() => navigate('/vendor/dashboard')}
          />
        ) : (
          alerts.map(alert => (
            <PendingJobCard
              key={alert._id || alert.id}
              booking={alert}
              onAccept={handleAccept}
              onReject={handleReject}
              onClick={() => navigate('/vendor/dashboard', { state: { openBookingId: alert._id || alert.id } })}
              loadingAction={loadingAction.id === (alert._id || alert.id) ? loadingAction.type : null}
              showTimer={true}
              maxSearchTimeMins={globalConfig.maxSearchTime}
            />
          ))
        )}
      </main>
      </div>
    </div>
  );
};

export default BookingAlerts;
