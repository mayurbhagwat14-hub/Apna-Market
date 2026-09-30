import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiMapPin, FiTool, FiCheckCircle, FiChevronRight, FiNavigation, FiX } from 'react-icons/fi';
import userBookingService from '../../../../services/bookingService';
import RatingModal from './RatingModal';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../../../context/SocketContext';
import { trackingTypeOf, usesLiveLocation, skipsJourney } from '../../../../utils/trackingType';
import { isLiveTrackingStatus } from '../../../../utils/bookingStatusLabels';

const LiveBookingCard = ({ hasBottomNav }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const fetchTimerRef = useRef(null);
  const inflightRef = useRef(null);

  useEffect(() => {
    setIsDismissed(false);
  }, [location.pathname]);

  const getStatusInfo = (booking) => {
    const status = booking?.status?.toUpperCase();
    const type = trackingTypeOf(booking);
    switch (status) {
      case 'ASSIGNED':
      case 'CONFIRMED':
      case 'AWAITING_PAYMENT':
      case 'ACCEPTED':
        return { label: 'Booking Active', icon: FiCheckCircle, color: 'bg-primary-500', sub: 'Vendor is handling your request' };
      case 'STARTED':
      case 'JOURNEY_STARTED':
        return usesLiveLocation(type)
          ? { label: 'On the Way', icon: FiNavigation, color: 'bg-primary-500', sub: 'Track location live', pulse: true }
          : { label: 'Service started', icon: FiCheckCircle, color: 'bg-primary-500', sub: 'Provider is on the job', pulse: true };
      case 'VISITED':
        return skipsJourney(type)
          ? { label: 'Checked in', icon: FiCheckCircle, color: 'bg-primary-500', sub: 'Provider is on site' }
          : { label: 'Reached & Started', icon: FiMapPin, color: 'bg-primary-500', sub: 'At your location' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', icon: FiTool, color: 'bg-primary-500', sub: 'Service in progress' };
      case 'WORK_DONE':
        return { label: 'Completed', icon: FiCheckCircle, color: 'bg-primary-600', sub: 'Review payment details' };
      case 'REQUESTED':
      case 'SEARCHING':
        return { label: 'Waiting for Vendor', icon: FiClock, color: 'bg-primary-500', sub: 'Vendor will accept soon...', pulse: true };
      default:
        return null;
    }
  };

  const fetchActiveBooking = useCallback(async () => {
    if (inflightRef.current) return inflightRef.current;

    inflightRef.current = (async () => {
      try {
        const res = await userBookingService.getUserBookings({ limit: 5 });
        if (res.success && res.data?.length > 0) {
          const ongoing = res.data.find((b) => {
            const s = b.status?.toUpperCase();
            if (s === 'WORK_DONE' && b.rating) return false;
            return [
              'ASSIGNED', 'CONFIRMED', 'AWAITING_PAYMENT', 'ACCEPTED', 'STARTED', 'JOURNEY_STARTED',
              'VISITED', 'IN_PROGRESS', 'WORK_DONE', 'SEARCHING', 'REQUESTED'
            ].includes(s);
          });
          setActiveBooking(ongoing || null);
        } else {
          setActiveBooking(null);
        }
      } catch {
        // Silent
      } finally {
        setLoading(false);
        inflightRef.current = null;
      }
    })();

    return inflightRef.current;
  }, []);

  const scheduleFetch = useCallback(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => {
      fetchActiveBooking();
    }, 800);
  }, [fetchActiveBooking]);

  useEffect(() => {
    fetchActiveBooking();

    if (socket) {
      socket.on('booking_updated', scheduleFetch);
      socket.on('notification', scheduleFetch);
    }

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      if (socket) {
        socket.off('booking_updated', scheduleFetch);
        socket.off('notification', scheduleFetch);
      }
    };
  }, [socket, fetchActiveBooking, scheduleFetch]);

  useEffect(() => {
    if (activeBooking && activeBooking.status?.toUpperCase() === 'WORK_DONE' && !activeBooking.rating && !showRatingModal) {
      const dismissed = localStorage.getItem(`rating_dismissed_live_${activeBooking._id}`);
      if (!dismissed) {
        setShowRatingModal(true);
      }
    }
  }, [activeBooking, showRatingModal]);

  const handleRateSubmit = async (ratingData) => {
    try {
      const response = await userBookingService.addReview(activeBooking._id || activeBooking.id, ratingData);
      if (response.success) {
        toast.success('Thank you for your rating!', {
          icon: '🌟',
          style: { borderRadius: '15px', background: '#333', color: '#fff' }
        });
        setShowRatingModal(false);
        fetchActiveBooking();
      } else {
        toast.error(response.message || 'Failed to submit review');
      }
    } catch {
      toast.error('Failed to submit review');
    }
  };

  if (loading || !activeBooking || isDismissed) return null;

  const statusInfo = getStatusInfo(activeBooking);
  if (!statusInfo) return null;

  const Icon = statusInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        key="live-booking-card"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        onClick={() => {
          const status = activeBooking.status?.toUpperCase();
          const goLiveMap = usesLiveLocation(trackingTypeOf(activeBooking))
            && (status === 'STARTED' || status === 'JOURNEY_STARTED' || isLiveTrackingStatus(activeBooking.status, trackingTypeOf(activeBooking)));
          if (goLiveMap) {
            navigate(`/user/booking/${activeBooking._id || activeBooking.id}/track`);
          } else if (status === 'SEARCHING' || status === 'REQUESTED') {
            navigate(`/user/booking-confirmation/${activeBooking._id || activeBooking.id}`);
          } else {
            navigate(`/user/booking/${activeBooking._id || activeBooking.id}`);
          }
        }}
        className={`fixed ${hasBottomNav ? 'bottom-24' : 'bottom-6'} left-4 right-4 z-50`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-4 relative overflow-hidden cursor-pointer active:scale-95 transition-transform group">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="absolute top-1 right-1 p-1 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 z-20 pointer-events-auto"
          >
            <FiX className="w-3 h-3" />
          </button>

          <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
            <motion.div
              className={`h-full ${statusInfo.color}`}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className={`w-12 h-12 rounded-full ${statusInfo.color} flex items-center justify-center shrink-0 relative`}>
            {statusInfo.pulse && (
              <div className={`absolute inset-0 rounded-full ${statusInfo.color} animate-ping opacity-50`} />
            )}
            <Icon className="text-white w-6 h-6 relative z-10" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-sm truncate">{statusInfo.label}</h4>
            <p className="text-xs text-gray-500 truncate">
              {statusInfo.sub} • {activeBooking.serviceName}
            </p>
          </div>

          {activeBooking.status?.toUpperCase() === 'WORK_DONE' && !activeBooking.cashCollected ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/booking/${activeBooking._id || activeBooking.id}`);
              }}
              className="px-4 py-2 bg-primary-600 text-white text-xs font-black rounded-xl shadow-lg shadow-primary-100 active:scale-95 transition-all"
            >
              PAY NOW
            </button>
          ) : (
            <div className="bg-gray-50 p-2 rounded-full">
              <FiChevronRight className="text-gray-400 w-5 h-5" />
            </div>
          )}
        </div>
      </motion.div>

      <RatingModal
        key="rating-modal"
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          if (activeBooking) {
            localStorage.setItem(`rating_dismissed_live_${activeBooking._id}`, 'true');
          }
        }}
        onSubmit={handleRateSubmit}
        bookingName={activeBooking.serviceName || 'Service'}
        workerName={activeBooking.workerId?.name || activeBooking.vendorId?.name || 'Vendor'}
      />
    </AnimatePresence>
  );
};

export default LiveBookingCard;
