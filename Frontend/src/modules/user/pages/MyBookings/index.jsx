import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiMapPin, FiCalendar, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { bookingService } from '../../../../services/bookingService';
import NotificationBell from '../../components/common/NotificationBell';
import { Badge, Button, EmptyState, SkeletonCard } from '../../../../components/ui';
import { gradients } from '../../../../theme';

const STATUS_BORDER = {
  confirmed: 'border-l-success-500',
  in_progress: 'border-l-primary-500',
  'in-progress': 'border-l-primary-500',
  journey_started: 'border-l-secondary-500',
  visited: 'border-l-secondary-500',
  completed: 'border-l-primary-600',
  cancelled: 'border-l-error-500',
  rejected: 'border-l-error-500',
  awaiting_payment: 'border-l-warning-500',
};

const getStatusBorder = (status) =>
  STATUS_BORDER[String(status || '').toLowerCase()] || 'border-l-neutral-300';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const params = {};
        if (filter !== 'all') {
          params.status = filter;
        }
        const response = await bookingService.getUserBookings(params);
        if (response.success) {
          setBookings(response.data || []);
        } else {
          toast.error(response.message || 'Failed to load bookings');
          setBookings([]);
        }
      } catch {
        toast.error('Failed to load bookings. Please try again.');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
    window.addEventListener('userBookingsUpdated', loadBookings);
    return () => window.removeEventListener('userBookingsUpdated', loadBookings);
  }, [filter]);

  const handleBookingClick = (booking) => {
    navigate(`/user/booking/${booking._id || booking.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getAddressString = (address) => {
    if (typeof address === 'string') return address;
    if (address && typeof address === 'object') {
      return [address.addressLine1, address.addressLine2, address.city].filter(Boolean).join(', ');
    }
    return 'Detailed Address';
  };

  const filterTabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen pb-20 relative bg-slate-50/60">
      <div className="relative z-10">
        {/* Sleek Top Header */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-slate-200/80 px-3.5 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 active:scale-95"
              aria-label="Go back"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-800">My Bookings</h1>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200/60">
            <NotificationBell />
          </div>
        </header>

        {/* Filter Pills Scroll Row */}
        <div className="bg-white border-b border-slate-200/60 sticky top-[49px] z-20 shadow-2xs">
          <div className="flex overflow-x-auto px-3.5 py-2.5 gap-2 scrollbar-hide scroll-smooth">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                  filter === tab.id
                    ? 'border-transparent bg-slate-900 text-white shadow-xs active:scale-95'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="px-3.5 py-4 max-w-2xl mx-auto w-full">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={FiClock}
              title="No bookings found"
              message={
                filter === 'all'
                  ? "You haven't booked any services yet. Explore categories on home to get started."
                  : `You don't have any ${filter.replace('-', ' ')} bookings right now.`
              }
              actionLabel="Browse services"
              onAction={() => navigate('/user')}
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
              }}
              className="space-y-3"
            >
              {bookings.map((booking) => {
                const statusKey = String(booking.status || '').toLowerCase().replace(/-/g, '_');
                return (
                  <motion.div
                    key={booking._id || booking.id}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 140, damping: 20 } },
                    }}
                    onClick={() => handleBookingClick(booking)}
                    className={`group bg-white rounded-xl p-3.5 border border-slate-200/80 border-l-[3.5px] shadow-2xs hover:shadow-md hover:border-slate-300 active:scale-[0.99] transition-all duration-200 cursor-pointer ${getStatusBorder(booking.status)}`}
                  >
                    {/* Header Row: Category Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                          #{booking.bookingNumber || (booking._id || booking.id).substring(0, 8)}
                        </span>
                        {booking.serviceCategory && (
                          <span className="inline-block text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100/80 truncate">
                            {booking.serviceCategory}
                          </span>
                        )}
                        {booking.serviceListingId && (
                          <span className="inline-block text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100/80">
                            Direct
                          </span>
                        )}
                        {(booking.bookingType === 'instant' || String(booking.scheduledTime || '').toUpperCase() === 'ASAP') ? (
                          <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/80">
                            ⚡ Instant
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100/80">
                            📅 Scheduled
                          </span>
                        )}
                      </div>
                      <Badge variant="status" status={statusKey} size="sm" className="shrink-0 text-[10px] uppercase font-bold" />
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-1 group-hover:text-primary-500 transition-colors mb-2">
                      {booking.serviceName || 'Service Request'}
                    </h3>

                    {/* Items Summary */}
                    {booking.bookedItems?.length > 0 && (
                      <p className="text-xs text-slate-500 line-clamp-1 mb-2.5 font-medium">
                        {booking.bookedItems.map((item) => item.card?.title || item.title).join(', ')}
                      </p>
                    )}

                    {/* Slot & Location Info Box */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FiCalendar className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Slot</p>
                          <p className="font-bold text-slate-800 text-[11px] truncate mt-0.5">
                            {formatDate(booking.scheduledDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        <FiMapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Location</p>
                          <p className="font-semibold text-slate-700 text-[11px] truncate mt-0.5">
                            {getAddressString(booking.address)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Amount & Action Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total: </span>
                        <span className="text-base font-black text-slate-900 ml-1">
                          ₹{(booking.finalAmount || booking.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-primary-500 group-hover:text-primary-600 transition-colors">
                        <span>Details</span>
                        <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyBookings;
