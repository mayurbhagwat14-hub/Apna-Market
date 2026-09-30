import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiUser, FiMapPin, FiCalendar, FiLogIn, FiNavigation } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { adminBookingService } from '../../../../services/adminBookingService';
import BookingListingOrigin from '../../components/BookingListingOrigin';
import TrackingTypeBadge from '../../components/TrackingTypeBadge';
import {
  trackingTypeOf,
  usesLiveLocation,
  usesPresence,
  isCheckedIn,
  isCheckedOut,
  formatPresenceTime
} from '../../../../utils/trackingType';
import { getStatusLabel, resolveServiceFulfillmentType } from '../../../../utils/bookingStatusLabels';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminBookingService.getBookingById(id);
        if (res.success) setBooking(res.data);
      } catch (err) {
        toast.error(err.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <p className="text-sm font-bold text-neutral-700">Booking not found</p>
      </div>
    );
  }

  const trackingType = trackingTypeOf(booking);
  const fulfillment = resolveServiceFulfillmentType({ booking });
  const live = booking.tracking?.live;
  const presence = booking.tracking?.presence;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-primary-600"
      >
        <FiArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Order</p>
            <h1 className="text-lg font-black text-neutral-900">#{booking.bookingNumber}</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {getStatusLabel(booking.status, fulfillment)}
            </p>
            <div className="mt-2">
              <TrackingTypeBadge trackingType={trackingType} />
            </div>
          </div>
          <span className="text-sm font-black text-neutral-900">₹{booking.finalAmount?.toLocaleString()}</span>
        </div>

        <BookingListingOrigin booking={booking} />

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">Customer</p>
            <p className="font-bold text-neutral-900 flex items-center gap-1"><FiUser className="w-3.5 h-3.5" />{booking.userId?.name || '—'}</p>
            <p className="text-neutral-500 mt-0.5">{booking.userId?.phone}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">Vendor</p>
            <p className="font-bold text-neutral-900">{booking.vendorId?.name || booking.vendorId?.businessName || 'Unassigned'}</p>
            <p className="text-neutral-500 mt-0.5">{booking.vendorId?.phone}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">Service</p>
            <p className="font-bold text-neutral-900">{booking.serviceName}</p>
            <p className="text-neutral-500 mt-0.5">{booking.serviceCategory}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">Schedule</p>
            <p className="font-bold text-neutral-900 flex items-center gap-1">
              <FiCalendar className="w-3.5 h-3.5" />
              {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : '—'}
            </p>
            <p className="text-neutral-500 mt-0.5">{booking.scheduledTime}</p>
          </div>
        </div>

        {usesPresence(trackingType) && (
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
            <p className="text-[10px] font-bold uppercase text-neutral-400 mb-2">Presence</p>
            {isCheckedIn(booking) && (
              <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                <FiLogIn className="w-3.5 h-3.5 text-primary-600" />
                Checked in {formatPresenceTime(presence?.checkedInAt)}
              </p>
            )}
            {isCheckedOut(booking) && (
              <p className="text-neutral-600 mt-1">
                Checked out {formatPresenceTime(presence?.checkedOutAt)}
              </p>
            )}
            {!isCheckedIn(booking) && !isCheckedOut(booking) && (
              <p className="text-neutral-500">Not checked in yet</p>
            )}
            {presence?.notes && <p className="text-neutral-500 mt-2">{presence.notes}</p>}
          </div>
        )}

        {usesLiveLocation(trackingType) && (
          <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 text-xs">
            <p className="text-[10px] font-bold uppercase text-primary-600 mb-2">Live GPS snapshot</p>
            {live?.lat != null && live?.lng != null ? (
              <>
                <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <FiNavigation className="w-3.5 h-3.5 text-primary-600" />
                  {Number(live.lat).toFixed(5)}, {Number(live.lng).toFixed(5)}
                </p>
                {live.lastUpdatedAt && (
                  <p className="text-neutral-500 mt-1">
                    Updated {new Date(live.lastUpdatedAt).toLocaleString('en-IN')}
                  </p>
                )}
                <a
                  href={`https://www.google.com/maps?q=${live.lat},${live.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 font-bold text-primary-600 hover:underline"
                >
                  <FiMapPin className="w-3.5 h-3.5" /> Open in Maps
                </a>
              </>
            ) : (
              <p className="text-neutral-500">No GPS points received yet</p>
            )}
          </div>
        )}

        {booking.address && (
          <div className="text-xs text-neutral-600 flex items-start gap-2">
            <FiMapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
            <span>
              {booking.address.addressLine1}
              {booking.address.city ? `, ${booking.address.city}` : ''}
              {booking.address.pincode ? ` ${booking.address.pincode}` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetail;
