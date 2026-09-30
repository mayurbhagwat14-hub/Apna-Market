import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiX, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { gradients } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import { Button, EmptyState, Loader, Modal } from '../../../../components/ui';
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
  const [filter, setFilter] = useState('all');

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

    // Listen for real-time updates (if implemented via window event)
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('vendorNotificationsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('vendorNotificationsUpdated', handleUpdate);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      // Update local state to reflect change immediately
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark as read', error);
      toast.error('Failed to mark as read');
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
      return ['payment_', 'payout_', 'wallet_', 'refund_'].some(prefix => type.includes(prefix));
    }

    if (filter === 'jobs') {
      return ['booking_', 'job_', 'worker_', 'visit_', 'work_', 'journey_', 'vendor_'].some(prefix => type.includes(prefix));
    }

    if (filter === 'alerts') {
      return ['alert', 'general', 'security', 'account'].some(prefix => type.includes(prefix));
    }

    return type === filter;
  });

  const getNotificationIcon = (originalType) => {
    const type = (originalType || '').toLowerCase();

    if (['payment', 'refund', 'wallet', 'payout'].some(t => type.includes(t))) return '💰';
    if (['booking', 'job', 'work', 'visit', 'journey', 'vendor'].some(t => type.includes(t))) return '📋';
    if (['alert', 'general'].some(t => type.includes(t))) return '🔔';

    return '📢';
  };

  const getNotificationColor = (originalType) => {
    const type = (originalType || '').toLowerCase();

    if (['payment', 'refund', 'wallet', 'payout'].some(t => type.includes(t))) return '#10B981'; // Green
    if (['booking', 'job', 'work', 'visit', 'journey', 'vendor'].some(t => type.includes(t))) return '#016A54'; // Blue
    if (['alert', 'general'].some(t => type.includes(t))) return '#016A54';

    return '#6B7280'; // Gray
  };

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />
      <div className="relative z-10">
      <Header title="Notifications" />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All' },
            { id: 'jobs', label: 'Jobs' },
            { id: 'payments', label: 'Payments' },
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all shadow-sm ${
                filter === filterOption.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-700'
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
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState title="No notifications" message="You're all caught up!" icon={FiBell} />
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
                  <div className="flex-1 pr-6">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className={`font-semibold text-gray-800 ${!notif.read ? 'font-bold' : ''}`}>{notif.title}</p>
                        <p className="text-sm text-gray-600 mt-1 leading-snug">{notif.message}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{notif.time || (notif.createdAt && new Date(notif.createdAt).toLocaleString())}</p>

                    {/* Action button based on type/related entity */}
                    {(notif.action || notif.relatedType === 'booking' || notif.type === 'payout_requested') && (
                      <button
                        onClick={() => {
                          if (notif.relatedType === 'booking' && notif.relatedId) {
                            navigate(`/vendor/booking/${notif.relatedId}`);
                          } else if (notif.action === 'view_booking' && notif.bookingId) {
                            navigate(`/vendor/booking/${notif.bookingId}`);
                          } else if (notif.action === 'view_wallet') {
                            navigate('/vendor/wallet');
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

                {/* Actions: Mark Read & Delete - Positioned absolute top-right */}
                <div className="absolute top-3 right-3 flex gap-2">
                  {!notif.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
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

      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear all notifications?">
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
    </div>
  );
};

export default Notifications;
