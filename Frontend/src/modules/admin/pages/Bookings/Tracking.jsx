import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiCheckCircle, FiTruck, FiPackage, FiClipboard, FiLogIn, FiMapPin, FiNavigation
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { adminBookingService } from '../../../../services/adminBookingService';
import { toast } from 'react-hot-toast';
import BookingListingOrigin from '../../components/BookingListingOrigin';
import TrackingTypeBadge from '../../components/TrackingTypeBadge';
import {
  trackingTypeOf,
  usesLiveLocation,
  usesPresence,
  skipsJourney,
  isCheckedIn,
  isCheckedOut,
  formatPresenceTime,
  TRACKING_TYPE
} from '../../../../utils/trackingType';
import { getStatusLabel, resolveServiceFulfillmentType } from '../../../../utils/bookingStatusLabels';

const TRACKING_FILTERS = [
  { id: 'all', label: 'All types' },
  { id: TRACKING_TYPE.LIVE, label: 'Live GPS' },
  { id: TRACKING_TYPE.STATUS_ONLY, label: 'Status only' },
  { id: TRACKING_TYPE.HYBRID, label: 'Hybrid' }
];

const Tracking = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [trackingFilter, setTrackingFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = {
          page: 1,
          limit: 40,
          search: debouncedSearch
        };
        if (trackingFilter !== 'all') {
          params.trackingType = trackingFilter;
        }
        const res = await adminBookingService.getAllBookings(params);
        if (res.success) {
          setBookings(res.data);
          setSelectedOrder((prev) => {
            if (!prev) return prev;
            return res.data.find((b) => b._id === prev._id) || null;
          });
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [debouncedSearch, trackingFilter]);

  const selectedType = selectedOrder ? trackingTypeOf(selectedOrder) : TRACKING_TYPE.LIVE;
  const skipTravel = skipsJourney(selectedType);
  const fulfillment = selectedOrder
    ? resolveServiceFulfillmentType({ booking: selectedOrder })
    : 'ON_SITE';

  const steps = useMemo(() => {
    if (skipTravel) {
      return [
        { title: 'Booking placed', icon: FiClipboard },
        { title: 'Confirmed', icon: FiCheckCircle },
        { title: 'Checked in', icon: FiLogIn },
        { title: 'In progress', icon: FiPackage },
        { title: 'Work done', icon: FiCheckCircle },
        { title: 'Completed', icon: FiCheckCircle }
      ];
    }
    return [
      { title: 'Booking placed', icon: FiClipboard },
      { title: 'Assigned', icon: FiClipboard },
      { title: 'Journey started', icon: FiTruck },
      { title: 'Work in progress', icon: FiPackage },
      { title: 'Work done', icon: FiCheckCircle },
      { title: 'Completed', icon: FiCheckCircle }
    ];
  }, [skipTravel]);

  const getStatusStep = (status, trackingType) => {
    const s = String(status || '').toLowerCase();
    if (skipsJourney(trackingType)) {
      if (['pending', 'requested', 'searching', 'awaiting_payment'].includes(s)) return 0;
      if (['confirmed', 'accepted', 'assigned'].includes(s)) return 1;
      if (s === 'visited') return 2;
      if (s === 'in_progress') return 3;
      if (s === 'work_done') return 4;
      if (s === 'completed') return 5;
      return 0;
    }
    if (['pending', 'requested', 'searching', 'awaiting_payment', 'confirmed', 'accepted'].includes(s)) return 0;
    if (s === 'assigned') return 1;
    if (['journey_started', 'visited'].includes(s)) return 2;
    if (s === 'in_progress') return 3;
    if (s === 'work_done') return 4;
    if (s === 'completed') return 5;
    return 0;
  };

  const getStatusColor = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'completed': return 'bg-primary-700';
      case 'work_done': return 'bg-primary-600';
      case 'in_progress': return 'bg-primary-500';
      case 'journey_started':
      case 'visited': return 'bg-primary-500';
      case 'assigned': return 'bg-primary-400';
      case 'confirmed':
      case 'accepted':
      case 'pending': return 'bg-secondary-500';
      case 'cancelled':
      case 'rejected': return 'bg-error-500';
      default: return 'bg-neutral-500';
    }
  };

  const live = selectedOrder?.tracking?.live;
  const presence = selectedOrder?.tracking?.presence;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
        <div className="relative w-full">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Booking ID or service name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TRACKING_FILTERS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setTrackingFilter(opt.id);
                setSelectedOrder(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                trackingFilter === opt.id
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-250px)]">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="bg-gray-50/50">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Booking ID</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tracking</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Booking Date</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">Loading orders...</td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">No orders found</td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    const type = trackingTypeOf(booking);
                    return (
                      <tr
                        key={booking._id}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedOrder?._id === booking._id ? 'bg-primary-50/50' : ''}`}
                        onClick={() => setSelectedOrder(booking)}
                      >
                        <td className="p-4">
                          <span className="font-semibold text-gray-800 text-sm">
                            #{booking.bookingNumber || booking._id.slice(-6).toUpperCase()}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[140px]">
                            {booking.serviceName || booking.serviceId?.title || 'Service'}
                          </p>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{booking.userId?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{booking.userId?.email || 'No email'}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <TrackingTypeBadge trackingType={type} />
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white uppercase tracking-wide ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status, resolveServiceFulfillmentType({ booking }))}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 text-sm">
                          {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(booking);
                            }}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg font-medium text-xs transition-colors"
                          >
                            Track
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedOrder ? (
            <motion.div
              key={selectedOrder._id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-2 mb-6">
                <h2 className="text-lg font-bold text-gray-900">Tracking Details</h2>
                <TrackingTypeBadge trackingType={selectedType} />
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Order ID</p>
                <p className="text-lg font-bold text-gray-900">
                  #{selectedOrder.bookingNumber || selectedOrder._id.slice(-6).toUpperCase()}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Customer</p>
                <p className="text-base font-semibold text-gray-900">{selectedOrder.userId?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{selectedOrder.userId?.email}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="text-sm font-bold text-gray-900">
                  {getStatusLabel(selectedOrder.status, fulfillment)}
                </p>
              </div>

              <div className="mb-6">
                <BookingListingOrigin booking={selectedOrder} />
              </div>

              {usesPresence(selectedType) && (
                <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Presence</p>
                  {isCheckedIn(selectedOrder) && (
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <FiLogIn className="w-4 h-4 text-primary-600" />
                      Checked in {formatPresenceTime(presence?.checkedInAt)}
                    </p>
                  )}
                  {isCheckedOut(selectedOrder) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Checked out {formatPresenceTime(presence?.checkedOutAt)}
                    </p>
                  )}
                  {!isCheckedIn(selectedOrder) && !isCheckedOut(selectedOrder) && (
                    <p className="text-sm text-gray-500">Not checked in yet</p>
                  )}
                  {presence?.notes && (
                    <p className="text-xs text-gray-500 mt-2">{presence.notes}</p>
                  )}
                </div>
              )}

              {usesLiveLocation(selectedType) && (
                <div className="mb-6 rounded-xl border border-primary-100 bg-primary-50/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600 mb-2">Live GPS</p>
                  {live?.lat != null && live?.lng != null ? (
                    <>
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <FiNavigation className="w-4 h-4 text-primary-600" />
                        {Number(live.lat).toFixed(5)}, {Number(live.lng).toFixed(5)}
                      </p>
                      {live.lastUpdatedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Updated {new Date(live.lastUpdatedAt).toLocaleString('en-IN')}
                        </p>
                      )}
                      <a
                        href={`https://www.google.com/maps?q=${live.lat},${live.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary-600 hover:underline"
                      >
                        <FiMapPin className="w-3.5 h-3.5" /> Open map
                      </a>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No GPS points received yet</p>
                  )}
                </div>
              )}

              <div className="flex-1 relative pl-4 border-l-2 border-gray-100 space-y-8 mb-8">
                {steps.map((step, index) => {
                  const currentStepIdx = getStatusStep(selectedOrder.status, selectedType);
                  const isCompleted = index <= currentStepIdx;

                  return (
                    <div key={step.title} className="relative pl-6">
                      <div className={`absolute -left-[23px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 
                        ${isCompleted ? 'bg-primary-50 border-primary-500 text-primary-600' : 'bg-gray-50 border-gray-200 text-gray-300'}
                      `}>
                        <step.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className={`text-sm font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.title}
                        </h3>
                        <p className={`text-xs ${isCompleted ? 'text-primary-600' : 'text-gray-400'}`}>
                          {isCompleted ? 'Reached' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-gray-100 mt-auto">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/bookings/${selectedOrder._id}`)}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  View Full Details
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center h-full text-center text-gray-500">
              <FiSearch className="w-12 h-12 text-gray-300 mb-4" />
              <p>Select an order to view tracking details</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Tracking;
