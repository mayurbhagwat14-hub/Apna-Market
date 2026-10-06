import { useState, useEffect } from 'react';
import { FiMenu, FiBell, FiLogOut } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../Button';
import NotificationWindow from './NotificationWindow';
import { adminAuthService } from '../../../../services/authService';
import api from '../../../../services/api';

const AdminHeader = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await adminAuthService.logout();
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local storage and redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('adminData');
      toast.success('Logged out successfully');
      navigate('/admin/login');
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Get page info from pathname
  const getPageInfo = (pathname) => {
    const mappings = [
      { path: '/admin/dashboard', title: 'Apna Market Dashboard', description: 'Overview of local shops, customers, orders, and revenue.' },
      { path: '/admin/users/all', title: 'Customers', description: 'Manage Apna Market customers and their activity.' },
      { path: '/admin/users/bookings', title: 'Customer Orders', description: 'Track customer orders and booking history.' },
      { path: '/admin/users/analytics', title: 'Customer Analytics', description: 'Analyze customer growth and behavior.' },
      { path: '/admin/users/transactions', title: 'Customer Transactions', description: 'Monitor customer payments and wallet activity.' },
      { path: '/admin/users', title: 'Customers', description: 'Manage Apna Market customers and their activity.' },
      { path: '/admin/vendors/all', title: 'Shops & Vendors', description: 'Verify vendors, shops, offers, and store content.' },
      { path: '/admin/vendors/analytics', title: 'Shop Analytics', description: 'Analyze vendor and local shop performance.' },
      { path: '/admin/vendors', title: 'Shops & Vendors', description: 'Manage vendor registrations, shop content, and performance.' },
      { path: '/admin/workers/all', title: 'Field Partners', description: 'Manage field partners and their activity.' },
      { path: '/admin/workers/analytics', title: 'Partner Analytics', description: 'Analyze field partner performance.' },
      { path: '/admin/workers', title: 'Field Partners', description: 'Monitor and manage Apna Market field partners.' },
      { path: '/admin/bookings', title: 'Orders & Bookings', description: 'Track and manage Apna Market orders.' },
      { path: '/admin/bookings/notifications', title: 'Order Alerts', description: 'Track booking alerts and customer updates.' },
      { path: '/admin/user-categories', title: 'Apna Market Catalog', description: 'Manage customer home content, categories, brands, and listing setup.' },
      { path: '/admin/payments/users', title: 'Customer Payments', description: 'Monitor customer payment transactions.' },
      { path: '/admin/payments/vendors', title: 'Vendor Payouts', description: 'Monitor shop earnings, dues, and payouts.' },
      { path: '/admin/payments/workers', title: 'Partner Payments', description: 'Monitor and manage field partner payouts.' },
      { path: '/admin/payments/revenue', title: 'Apna Market Revenue', description: 'Track platform commissions and income.' },
      { path: '/admin/payments/reports', title: 'Payment Reports', description: 'Analyze payment data and financial insights.' },
      { path: '/admin/payments', title: 'Payments & Settlements', description: 'Monitor transactions, payouts, and revenue.' },
      { path: '/admin/reports', title: 'Apna Market Reports', description: 'Analyze marketplace performance with data insights.' },
      { path: '/admin/settings', title: 'Apna Market Settings', description: 'Configure app, admin, support, and marketplace preferences.' },
      { path: '/admin/user-categories/categories', title: 'Marketplace Categories', description: 'Manage shop/service categories and listing config.' },
      { path: '/admin/settlements/pending', title: 'Pending Settlements', description: 'Review and approve vendor cash settlements' },
      { path: '/admin/settlements/withdrawals', title: 'Withdrawal Requests', description: 'Manage vendor payout requests' },
      { path: '/admin/settlements/vendors', title: 'Vendor Balances', description: 'Monitor vendor dues and credit limits' },
      { path: '/admin/settlements/history', title: 'Settlement History', description: 'View past transaction records' },
      { path: '/admin/settlements', title: 'Vendor Settlements', description: 'Manage shop dues, settlement requests, and withdrawals.' },
      { path: '/admin/reviews', title: 'Customer Reviews', description: 'Manage Apna Market reviews and ratings.' },
      { path: '/admin/vendor-ad-plans', title: 'Shop Promotion Plans', description: 'Manage advertisement plans and vendor subscriptions.' },
      { path: '/admin/service-listings', title: 'Shop Listing Review', description: 'Approve vendor listings, packages, catalog items, photos, and offers.' },
      { path: '/admin/scrap', title: 'Scrap Orders', description: 'Manage Apna Market scrap collection orders.' },
    ];

    const match = mappings.find(m => pathname === m.path || pathname.startsWith(m.path + '/'));

    if (match) return match;

    const path = pathname.split('/').pop() || 'dashboard';
    return {
      title: path.charAt(0).toUpperCase() + path.slice(1),
      description: `Manage Apna Market ${path} here.`
    };
  };

  const { title, description } = getPageInfo(location.pathname);

  // Notification Logic
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      // Import api dynamically if needed or just use fetch with auth headers
      // Since we don't have api imported, let's use adminAuthService's axios instance if available, or just fetch
      // Assuming api.js handles interceptors. Let's import api at top.
      const res = await api.get('/notifications/admin');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Optimistic update
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      // If deleted was unread, decrease count? We don't know easily without checking.
      // Ideally re-fetch or check current state
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <header
      className="bg-white fixed top-0 left-0 right-0 z-30 transition-all duration-300 lg:left-[278px] border-b border-gray-100 shadow-sm"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between px-4 lg:px-6 py-6">
        {/* Left: Menu Button & Page Title */}
        <div className="flex items-center gap-4">
          <Button
            onClick={onMenuClick}
            variant="icon"
            className="lg:hidden text-gray-700"
            icon={FiMenu}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{title}</h1>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">{description}</p>
          </div>
        </div>

        {/* Right: Notifications & Logout */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <Button
              data-notification-button
              onClick={toggleNotifications}
              variant="icon"
              className="text-gray-700"
              icon={FiBell}
            />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}

            <NotificationWindow
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              position="right"
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDelete}
            />
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            icon={FiLogOut}
            size="sm"
            className="text-gray-700 hover:bg-red-600 hover:text-white hover:border-red-600 border border-gray-300"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

