import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiArrowLeft, FiTrash2, FiX, FiBell } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import BottomNav from '../../components/layout/BottomNav';
import { Button, EmptyState, Modal, SkeletonCard } from '../../../../components/ui';
import { gradients } from '../../../../theme';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from '../../services/notificationService';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [filter, setFilter] = useState('all'); // all, alerts, jobs, payments

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time updates (if implemented via window event or socket)
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('userNotificationsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('userNotificationsUpdated', handleUpdate);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      // Update local state to reflect change immediately
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (error) {
      console.error('Failed to mark all as read', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      // Professional confirmation could be a custom modal, but native confirm is robust for now
      // Or just delete with undo toast.
      // User asked for "professionally". Often direct delete is preferred for single items, confirmation for "Clear All".
      // But let's add no confirm for single item for speed, or a simple one.
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification removed');
    } catch (error) {
      console.error('Failed to delete notification', error);
      toast.error('Failed to delete');
    }
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      toast.success('All notifications cleared');
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear notifications', error);
      toast.error('Failed to clear');
      setShowClearConfirm(false);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;

    const type = (notif.type || '').toLowerCase();

    if (filter === 'payments') {
      return ['payment_', 'refund_', 'wallet_'].some(prefix => type.includes(prefix));
    }

    if (filter === 'jobs') { // Mapped to 'Bookings' in UI
      return ['booking_', 'job_', 'worker_', 'visit_', 'work_', 'journey_', 'vendor_'].some(prefix => type.includes(prefix));
    }

    if (filter === 'alerts') {
      return ['alert', 'general', 'security', 'account'].some(prefix => type.includes(prefix));
    }

    return type === filter;
  });

  const getNotificationIcon = (originalType) => {
    const type = (originalType || '').toLowerCase();

    if (['payment', 'refund', 'wallet'].some(t => type.includes(t))) return 'ðŸ’°';
    if (['booking', 'job', 'work', 'visit', 'journey', 'vendor', 'scrap'].some(t => type.includes(t))) return 'ðŸ“‹';
    if (['alert', 'general'].some(t => type.includes(t))) return 'ðŸ””';

    return 'ðŸ“¢';
  };

  const getNotificationTone = (originalType) => {
    const type = (originalType || '').toLowerCase();

    if (['payment', 'refund', 'wallet'].some((t) => type.includes(t))) return 'success';
    if (['booking', 'job', 'work', 'visit', 'journey', 'vendor', 'scrap'].some((t) => type.includes(t)))
      return 'primary';
    if (['alert', 'general'].some((t) => type.includes(t))) return 'warning';

    return 'neutral';
  };

  const toneClass = {
    success: { border: 'border-l-success-500', bg: 'bg-success-50', text: 'text-success-700' },
    primary: { border: 'border-l-primary-500', bg: 'bg-primary-50', text: 'text-primary-700' },
    warning: { border: 'border-l-warning-500', bg: 'bg-warning-50', text: 'text-warning-700' },
    neutral: { border: 'border-l-neutral-300', bg: 'bg-neutral-100', text: 'text-neutral-600' },
  };

  const accentHex = {
    success: '#10b981',
    primary: '#016A54',
    warning: '#f59e0b',
    neutral: '#6b7280',
  };
  const getNotificationColor = (originalType) => accentHex[getNotificationTone(originalType)];

  return (
    <div className="min-h-screen pb-24 relative bg-[#FBFBFA] w-full max-w-lg mx-auto shadow-xs">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F0F2F1] px-4 py-3.5 flex items-center justify-between shadow-xs relative z-10">
        <div className="flex items-center gap-3">
          <Button type="button" variant="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <FiArrowLeft className="w-5 h-5 text-neutral-800" />
          </Button>
          <h1 className="text-lg font-bold text-neutral-900">Notifications</h1>
        </div>
      </header>

      <main className="px-4 py-5 relative z-10 w-full max-w-lg mx-auto">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'offers', label: 'Offers & Deals' },
            { id: 'shops', label: 'Local Shops' },
            { id: 'alerts', label: 'Updates' },
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              type="button"
              onClick={() => setFilter(filterOption.id)}
              className={`px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-all border ${
                filter === filterOption.id
                  ? 'bg-[#016A54] text-white border-transparent shadow-xs'
                  : 'bg-white text-neutral-700 border-[#E2E8F0] hover:border-[#016A54]/40'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <div className="flex justify-end gap-4 mb-4">
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Mark All as Read
            </button>
            <button
              onClick={handleClearAll}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
            >
              <FiTrash2 className="w-3 h-3" />
              Clear All
            </button>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0"></div>
                  <div className="flex-1 space-y-3 py-1">
                    <div className="flex justify-between items-start">
                      <div className="h-4 w-32 bg-slate-100 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-slate-100 rounded"></div>
                      <div className="h-3 w-2/3 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-2 w-16 bg-slate-50 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div
            className="bg-white rounded-xl p-8 text-center shadow-md"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <FiBell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 font-semibold mb-2">No notifications</p>
            <p className="text-sm text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-xl p-4 shadow-md transition-all relative group ${!notif.read ? 'border-l-4' : ''
                  }`}
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  borderLeftColor: !notif.read ? getNotificationColor(notif.type) : 'transparent',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${getNotificationColor(notif.type)}15` }}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 pr-6"> {/* Added pr-6 to avoid overlap with delete btn */}
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className={`font-semibold text-gray-800 ${!notif.read ? 'font-bold' : ''}`}>{notif.title}</p>
                        <p className="text-sm text-gray-600 mt-1 leading-snug">{notif.message}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-medium">{notif.time}</p>
                    {notif.action && (
                      <button
                        onClick={() => {
                          if (notif.action === 'view_booking') {
                            navigate(`/user/booking/${notif.bookingId}`);
                          } else if (notif.action === 'view_wallet') {
                            navigate('/user/wallet');
                          }
                        }}
                        className="mt-3 text-sm font-bold flex items-center gap-1 text-primary-600"
                      >
                        View Details
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions: Mark Read & Delete */}
                <div className="absolute top-3 right-3 flex gap-2">
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 text-green-600 transition-colors shadow-sm"
                      title="Mark as read"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="p-1.5 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                    title="Delete"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear all notifications?"
        size="sm"
      >
        <p className="text-sm text-neutral-600 mb-6">This action cannot be undone.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" fullWidth onClick={() => setShowClearConfirm(false)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" fullWidth onClick={confirmClearAll}>
            Clear all
          </Button>
        </div>
      </Modal>

    </div>
  );
};

export default Notifications;
