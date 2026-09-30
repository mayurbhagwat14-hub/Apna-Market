import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorTheme as themeColors } from '../../../../../theme';
import { toast } from 'react-hot-toast';
import { acceptBooking, rejectBooking } from '../../../services/bookingService';
import PendingJobCard from '../../../components/bookings/PendingJobCard';

const PendingBookings = memo(({ bookings, setPendingBookings }) => {
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = React.useState({ id: null, type: null });

  if (bookings.length === 0) {
    return null;
  }

  const handleAcceptBooking = async (e, booking) => {
    e.stopPropagation();
    const bId = booking.id || booking._id;
    if (loadingAction.id) return;
    setLoadingAction({ id: bId, type: 'accept' });
    try {
      const response = await acceptBooking(bId);

      if (response.success) {
        setPendingBookings(prev => prev.filter(b => String(b.id || b._id) !== String(bId)));

        const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
        const updated = pendingJobs.filter(b => String(b.id || b._id) !== String(bId));
        localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));

        window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id: bId } }));
        window.dispatchEvent(new Event('vendorStatsUpdated'));
        window.dispatchEvent(new Event('vendorJobsUpdated'));
        const data = response?.data || response;
        const advance = data?.advanceAmount || booking.advanceAmount;
        const needsAdvance = data?.requireAdvancePayment && Number(advance) > 0;
        toast.success(
          needsAdvance
            ? `Accepted! Waiting for advance ₹${Number(advance).toLocaleString('en-IN')}`
            : 'Booking accepted successfully!'
        );
        navigate('/vendor/jobs');
      }
    } catch (error) {
      console.error('Error accepting:', error);
      toast.error('Failed to accept booking');
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };

  const handleRejectBooking = async (e, booking) => {
    e.stopPropagation();
    const bId = booking.id || booking._id;
    if (loadingAction.id) return;
    setLoadingAction({ id: bId, type: 'reject' });
    try {
      const response = await rejectBooking(bId, 'Vendor Dashboard Reject');

      if (response.success) {
        setPendingBookings(prev => prev.filter(b => String(b.id || b._id) !== String(bId)));

        const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
        const updated = pendingJobs.filter(b => String(b.id || b._id) !== String(bId));
        localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));

        window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id: bId } }));
        window.dispatchEvent(new Event('vendorJobsUpdated'));
        toast.success('Booking rejected');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject booking');
    } finally {
      setLoadingAction({ id: null, type: null });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-800">New Requests</h2>
        <button
          type="button"
          onClick={() => navigate('/vendor/jobs')}
          className="text-sm font-medium"
          style={{ color: themeColors.button }}
        >
          Open Jobs
        </button>
      </div>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <PendingJobCard
            key={booking.id || booking._id}
            booking={booking}
            onAccept={handleAcceptBooking}
            onReject={handleRejectBooking}
            onClick={() => navigate('/vendor/jobs')}
            loadingAction={loadingAction.id === (booking.id || booking._id) ? loadingAction.type : null}
            showTimer={false}
          />
        ))}
      </div>
    </div>
  );
});

PendingBookings.displayName = 'VendorPendingBookings';

export default PendingBookings;
