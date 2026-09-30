import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiMapPin, FiClock, FiUser, FiSearch, FiCreditCard } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { gradients } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import { Button, EmptyState, Loader } from '../../../../components/ui';
import PendingJobCard from '../../components/bookings/PendingJobCard';
import { getBookings, acceptBooking, rejectBooking } from '../../services/bookingService';
import { ConfirmDialog } from '../../components/common';
import { getStatusLabel, resolveServiceFulfillmentType } from '../../../../utils/bookingStatusLabels';

const FILTER_TABS = [
  { id: 'requests', label: 'Requests' },
  { id: 'awaiting_payment', label: 'Advance Due' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
];



const formatSchedule = (job) => {
  const instant =
    job.bookingType === 'instant'
    || String(job.scheduledTime || '').toUpperCase() === 'ASAP';
  if (instant) return 'Today • ASAP';
  const date = job.scheduledDate
    ? new Date(job.scheduledDate).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short'
    })
    : job.timeSlot?.date || '';
  const time = job.scheduledTime || job.timeSlot?.time || '';
  return [date, time].filter(Boolean).join(' • ');
};

const mapJobFromApi = (job) => ({
  id: job._id || job.id,
  _id: job._id || job.id,
  serviceType: job.serviceName || 'Service',
  serviceName: job.serviceName,
  serviceCategory: job.serviceCategory,
  categoryIcon: job.categoryIcon,
  brandName: job.brandName,
  brandIcon: job.brandIcon,
  bookingType: job.bookingType,
  serviceListingId: job.serviceListingId,
  isDirectRequest: Boolean(job.serviceListingId),
  finalAmount: job.finalAmount,
  advanceAmount: job.advanceAmount,
  balanceAmount: job.balanceAmount,
  paymentPhase: job.paymentPhase,
  serviceFulfillmentType: job.serviceFulfillmentType,
  trackingType: job.trackingType,
  tracking: job.tracking,
  createdAt: job.createdAt,
  expiresAt: job.expiresAt,
  user: { name: job.userId?.name || 'Customer' },
  userId: job.userId,
  customerName: job.userId?.name || 'Customer',
  customerPhoneHidden: job.customerPhoneHidden,
  location: {
    address: job.address?.addressLine1
      ? `${job.address.addressLine1}${job.address.city ? `, ${job.address.city}` : ''}`
      : 'Address not available'
  },
  address: job.address,
  price: job.finalAmount,
  status: job.status,
  assignedTo: job.workerId ? { name: job.workerId.name } : (job.assignedAt ? { name: 'You (Self)' } : null),
  timeSlot: {
    date: job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-IN') : '',
    time: job.scheduledTime || ''
  },
  scheduledDate: job.scheduledDate,
  scheduledTime: job.scheduledTime,
});

const ActiveJobs = memo(() => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAction, setLoadingAction] = useState({ id: null, type: null });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const loadJobs = useCallback(async (currentFilter, currentSearch) => {
    try {
      setLoading(true);
      const statusParam = currentFilter;
      const response = await getBookings({
        status: statusParam,
        q: currentSearch,
        limit: 50
      });
      const jobsData = response.data || [];
      setJobs(jobsData.map(mapJobFromApi));
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs(filter, searchQuery);
    }, filter === 'requests' && searchQuery === '' ? 0 : 500);
    return () => clearTimeout(timer);
  }, [filter, searchQuery, loadJobs]);

  useEffect(() => {
    let timer = null;
    const onUpdate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => loadJobs(filter, searchQuery), 800);
    };
    window.addEventListener('vendorJobsUpdated', onUpdate);
    return () => {
      window.removeEventListener('vendorJobsUpdated', onUpdate);
      if (timer) clearTimeout(timer);
    };
  }, [loadJobs, filter, searchQuery]);

  const handleAccept = async (e, booking) => {
    e?.stopPropagation();
    const bookingId = booking.id || booking._id;
    if (loadingAction.id) return;
    setLoadingAction({ id: bookingId, type: 'accept' });
    try {
      const res = await acceptBooking(bookingId);
      const data = res?.data || res;
      const advance = data?.advanceAmount || booking.advanceAmount;
      const needsAdvance = data?.requireAdvancePayment && Number(advance) > 0;
      toast.success(
        needsAdvance
          ? `Accepted! Waiting for customer to pay advance ₹${Number(advance).toLocaleString('en-IN')}`
          : 'Booking accepted!'
      );
      const pending = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]')
        .filter((j) => String(j.id || j._id) !== String(bookingId));
      localStorage.setItem('vendorPendingJobs', JSON.stringify(pending));
      window.dispatchEvent(new Event('vendorJobsUpdated'));
      setFilter(needsAdvance ? 'awaiting_payment' : 'in_progress');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to accept booking');
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };

  const handleReject = async (e, booking) => {
    e?.stopPropagation();
    const bookingId = booking.id || booking._id;
    if (loadingAction.id) return;
    setLoadingAction({ id: bookingId, type: 'reject' });
    try {
      await rejectBooking(bookingId, 'Declined by vendor');
      toast.success('Request declined');
      const pending = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]')
        .filter((j) => String(j.id || j._id) !== String(bookingId));
      localStorage.setItem('vendorPendingJobs', JSON.stringify(pending));
      loadJobs(filter, searchQuery);
      window.dispatchEvent(new Event('vendorJobsUpdated'));
    } catch (error) {
      toast.error('Failed to decline request');
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };

  const hexToRgba = useCallback((hex, alpha) => {
    if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  const getStatusColor = useCallback((status) => {
    const colors = {
      REQUESTED: '#F59E0B',
      SEARCHING: '#F59E0B',
      AWAITING_PAYMENT: '#016A54',
      ACCEPTED: '#F59E0B',
      ASSIGNED: '#016A54',
      CONFIRMED: '#10B981',
      JOURNEY_STARTED: '#F59E0B',
      VISITED: '#8B5CF6',
      IN_PROGRESS: '#6366F1',
      WORK_DONE: '#10B981',
      COMPLETED: '#059669',
    };
    return colors[status?.toUpperCase()] || '#6B7280';
  }, []);

  const emptyMessages = {
    requests: { title: 'No requests', message: 'Booking requests will appear here.' },
    awaiting_payment: { title: 'No pending advance', message: 'After you accept, customer advance payments show here.' },
    in_progress: { title: 'No active jobs', message: 'Confirmed jobs in progress will appear here.' },
    completed: { title: 'No completed jobs', message: 'Finished jobs will appear here.' },
    all: { title: 'No jobs found', message: 'Your jobs will appear here.' },
  };

  const empty = emptyMessages[filter] || emptyMessages.all;

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />
      <div className="relative z-10">
        <Header title="Jobs" showSearch={true} />

        <main className="px-4 py-6 max-w-lg mx-auto">
          <div className="mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all shadow-sm ${
                  filter === tab.id ? 'bg-primary-600 text-white' : 'bg-white text-neutral-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filter === 'requests' && !loading && (
            <p className="text-xs text-neutral-500 mb-4">
              Review details, accept the request — customer pays advance (if required), then service starts.
            </p>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse h-32" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState title={empty.title} message={searchQuery ? 'Try a different search term.' : empty.message} icon={FiBriefcase} />
          ) : filter === 'requests' ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <PendingJobCard
                  key={job.id}
                  booking={job}
                  showTimer={false}
                  loadingAction={loadingAction.id === job.id ? loadingAction.type : null}
                  onClick={() => navigate(`/vendor/booking/${job.id}`)}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          ) : filter === 'awaiting_payment' ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/vendor/booking/${job.id}`)}
                  className="bg-white rounded-2xl p-4 border-2 border-primary-100 shadow-md cursor-pointer active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider mb-1">Awaiting Advance</p>
                      <h3 className="font-bold text-gray-900">{job.serviceType}</h3>
                      <p className="text-xs text-gray-500 mt-1">{job.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-primary-500">
                        ₹{(job.advanceAmount || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-gray-400">advance due</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-primary-50 rounded-lg p-2.5">
                    <FiCreditCard className="w-4 h-4 text-primary-400 shrink-0" />
                    <span>Customer must pay advance before service can start. Balance ₹{(job.balanceAmount || 0).toLocaleString('en-IN')} after service.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                    <FiClock className="w-3.5 h-3.5" />
                    {formatSchedule(job)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const statusColor = getStatusColor(job.status);
                return (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/vendor/booking/${job.id}`)}
                    className="rounded-xl p-4 shadow-lg cursor-pointer active:scale-98 transition-all duration-200 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                      boxShadow: `0 8px 24px ${hexToRgba(statusColor, 0.15)}`,
                      border: `2px solid ${hexToRgba(statusColor, 0.3)}`,
                    }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: statusColor }} />
                    <div className="relative z-10 pl-2">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FiBriefcase className="w-4 h-4" style={{ color: statusColor }} />
                            <h3 className="font-bold text-gray-800 text-base">{job.serviceType}</h3>
                          </div>
                          <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: statusColor }}>
                            {getStatusLabel(job.status, resolveServiceFulfillmentType({ booking: job }))}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FiUser className="w-4 h-4 text-gray-400" />
                          <span>{job.user?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{job.location?.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiClock className="w-4 h-4 text-gray-400" />
                          <span>{formatSchedule(job)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
        />

        <BottomNav />
      </div>
    </div>
  );
});

export default ActiveJobs;
