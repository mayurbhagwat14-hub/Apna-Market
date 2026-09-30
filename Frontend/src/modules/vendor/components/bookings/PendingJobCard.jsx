import React from 'react';
import { FiClock, FiMapPin, FiBell, FiCheck, FiX, FiInfo } from 'react-icons/fi';

// Internal Timer Component for unification
const CountdownTimer = ({ durationSeconds, createdAt, expiresAt, onExpire }) => {
  const calculateTimeLeft = () => {
    try {
      if (expiresAt) {
        const end = new Date(expiresAt).getTime();
        if (!isNaN(end)) {
          const left = Math.floor((end - Date.now()) / 1000);
          return Math.max(0, left);
        }
      }
      if (!createdAt) return Number(durationSeconds) || 300;
      const start = new Date(createdAt).getTime();
      if (!isNaN(start)) {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        return Math.max(0, (Number(durationSeconds) || 300) - elapsed);
      }
      return Number(durationSeconds) || 300;
    } catch (err) {
      return 0;
    }
  };

  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

  React.useEffect(() => {
    // Recalculate once on mount to handle refresh correctly
    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    if (initial <= 0 && onExpire) onExpire();
  }, [createdAt, expiresAt]);

  React.useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }
    const interval = setInterval(() => {
      const current = calculateTimeLeft();
      setTimeLeft(current);
      if (current <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, createdAt, expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return (
    <div className={`text-[11px] font-mono font-bold flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded-md shadow-sm border border-white/50 backdrop-blur-sm ${timeLeft < 30 ? 'text-rose-600 animate-pulse' : 'text-amber-700'}`}>
      <FiClock className="w-3.5 h-3.5" />
      <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
    </div>
  );
};

const PendingJobCard = ({ booking, onAccept, onReject, onClick, loadingAction, showTimer = false, maxSearchTimeMins = 5 }) => {
  const bookingId = booking.id || booking._id;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer active:scale-[0.98] transition-all duration-300 border border-gray-100/80 overflow-hidden relative group"
    >
      {/* Decorative gradient glow at top */}
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
      
      {/* Timer Header */}
      {showTimer && (
        <div className="px-5 py-3 bg-gradient-to-r from-amber-50/80 to-orange-50/50 border-b border-amber-100/50 flex justify-between items-center">
          <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
            booking.bookingType === 'instant' ? 'text-rose-500 animate-pulse' : 'text-indigo-600'
          }`}>
            {booking.serviceListingId && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded mr-1">DIRECT</span>}
            {booking.bookingType === 'instant' ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> INSTANT JOB</>
            ) : (
              <><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> SCHEDULED</>
            )}
          </span>
          <CountdownTimer
            durationSeconds={
              booking.serviceListingId || booking.isDirectRequest
                ? 60 * 60
                : maxSearchTimeMins * 60
            }
            createdAt={booking.createdAt}
            expiresAt={booking.expiresAt}
            onExpire={() => {
              // Locally remove from state if it expires
              window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id: bookingId } }));
            }}
          />
        </div>
      )}

      <div className="p-5">
        {/* Top section: Category, Title, Icon */}
        <div className="flex gap-4 mb-5">
          {/* Image / Icon */}
          <div className="relative shrink-0">
            {booking.categoryIcon || booking.serviceId?.category?.icon ? (
              <div className="w-14 h-14 rounded-2xl bg-gray-50/80 border border-gray-100 p-2 shadow-sm flex items-center justify-center overflow-hidden group-hover:shadow-md transition-all duration-300">
                <img src={booking.categoryIcon || booking.serviceId?.category?.icon} className="w-full h-full object-contain drop-shadow-sm" alt="Category" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100/80 flex items-center justify-center shadow-sm">
                <FiBell className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
            )}
            {/* Request Badge */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-white shadow-sm uppercase tracking-widest whitespace-nowrap z-10">
              NEW REQ
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">
              {booking.serviceCategory || booking.serviceId?.category?.title || booking.categoryName || 'General Service'}
            </p>
            <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-2 line-clamp-2 pr-2">
              {booking.serviceName || booking.serviceType || booking.serviceId?.title || 'New Booking Request'}
            </h3>
            
            {booking.brandName && (
              <div className="flex items-center gap-1.5 w-fit mb-2">
                <div className="bg-gray-50 border border-gray-200/60 rounded-md px-1.5 py-0.5 flex items-center gap-1.5 shadow-sm">
                  {booking.brandIcon && <img src={booking.brandIcon} alt={booking.brandName} className="w-3.5 h-3.5 object-contain" />}
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">{booking.brandName}</span>
                </div>
              </div>
            )}
            
            <p className="text-[12px] font-medium text-gray-500 line-clamp-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></span>
              <span className="text-gray-800 font-semibold">{booking.customerName || booking.userId?.name || 'Customer'}</span>
              <span className="text-gray-300 font-bold mx-0.5">•</span>
              <span className="truncate">{booking.location?.address || booking.address?.addressLine1 || 'Location'}</span>
            </p>
          </div>
        </div>

        {/* Info Row (Time, Distance, Price) */}
        <div className="bg-gray-50/80 rounded-[14px] p-3 mb-5 flex items-center justify-between border border-gray-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-50">
              <FiClock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Time</span>
              <span className="text-[12px] font-bold text-gray-800 leading-none tracking-tight">
                {booking.timeSlot?.date || (booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '')}
                {(booking.timeSlot?.date || booking.scheduledDate) ? ' ' : ''}
                {booking.timeSlot?.time || booking.scheduledTime || 'N/A'}
              </span>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-200/60"></div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-50">
              <FiMapPin className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Dist.</span>
              <span className="text-[12px] font-bold text-gray-800 leading-none tracking-tight">
                {(() => {
                  const dist = booking.location?.distance || booking.distance;
                  if (!dist || dist === 'N/A') return 'N/A';
                  return String(dist).includes('km') ? dist : `${dist} km`;
                })()}
              </span>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-200/60"></div>

          <div className="flex flex-col items-end pl-1 pr-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Earn</span>
            <span className="text-[16px] font-black text-emerald-500 leading-none tracking-tight drop-shadow-sm">
              ₹{booking.price || booking.vendorEarnings || booking.finalAmount || 0}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={!!loadingAction}
            onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
            className="flex-1 bg-white border border-gray-200/80 text-gray-700 py-2.5 px-3 rounded-xl text-[13px] font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <FiInfo className="w-4 h-4 text-gray-400" /> Details
          </button>
          <button
            type="button"
            disabled={!!loadingAction}
            onClick={(e) => onReject(e, booking)}
            className="flex-[0.8] bg-rose-50 border border-rose-100/80 text-rose-600 py-2.5 px-3 rounded-xl text-[13px] font-bold hover:bg-rose-100 transition-all shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <FiX className="w-4 h-4" /> Decline
          </button>
          <button
            type="button"
            disabled={!!loadingAction}
            onClick={(e) => onAccept(e, booking)}
            className="flex-[1.5] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2.5 px-3 rounded-xl text-[13px] font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-1.5"
          >
            <FiCheck className="w-4 h-4 drop-shadow-sm" /> 
            {loadingAction === 'accept' ? 'Accepting...' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingJobCard;

