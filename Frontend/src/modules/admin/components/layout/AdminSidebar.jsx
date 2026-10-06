import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiUser,
  FiShoppingBag,
  FiGrid,
  FiDollarSign,
  FiFileText,
  FiBell,
  FiSettings,
  FiChevronDown,
  FiX,
  FiPackage,
  FiTrash2,
  FiStar,
} from "react-icons/fi";
import adminMenu from "../../config/adminMenu.json";
import dashboardService from "../../services/dashboardService";
import { useBranding } from "../../../../context/BrandingContext";

// Icon mapping for menu items
const iconMap = {
  Dashboard: FiHome,
  Customers: FiUsers,
  Vendors: FiBriefcase,
  "Shops & Vendors": FiBriefcase,
  Workers: FiUser,
  Orders: FiShoppingBag,
  Bookings: FiShoppingBag,
  "Apna Market Catalog": FiGrid,
  "Shop Services": FiGrid,
  "Shop Items & Parts": FiPackage,
  Payments: FiDollarSign,
  Reports: FiFileText,
  Notifications: FiBell,
  "Scrap Items": FiTrash2,
  Reviews: FiStar,
  Settlements: FiDollarSign,
  Settings: FiSettings,
  Plans: FiPackage,
  "Shop Promotion Plans": FiPackage,
};

// Helper function to convert child name to route path
const getChildRoute = (parentRoute, childName) => {
  const routeMap = {
    "/admin/users": {
      "All Users": "/admin/users/all",
      "All Customers": "/admin/users/all",
      "User Bookings": "/admin/users/bookings",
      "Customer Orders": "/admin/users/bookings",
      "Transactions": "/admin/users/transactions",
      "User Analytics": "/admin/users/analytics",
      "Customer Analytics": "/admin/users/analytics",
    },
    "/admin/vendors": {
      "All Vendors": "/admin/vendors/all",
      "All Shops": "/admin/vendors/all",
      "Service Listings": "/admin/service-listings",
      "Listing Review": "/admin/service-listings",
      "Vendor Analytics": "/admin/vendors/analytics",
      "Shop Analytics": "/admin/vendors/analytics",
      "Vendor Payments": "/admin/vendors/payments",
      "Marketing Approvals": "/admin/vendors/marketing-approvals",
    },
    "/admin/workers": {
      "All Workers": "/admin/workers/all",
      "Worker Jobs": "/admin/workers/jobs",
      "Worker Analytics": "/admin/workers/analytics",
      "Worker Payments": "/admin/workers/payments",
    },
    "/admin/user-categories": {
      "Home": "/admin/user-categories/home",
      "Manage Categories": "/admin/user-categories/categories",
      "Marketplace Categories": "/admin/user-categories/categories",
    },
    "/admin/payments": {
      "Payment Overview": "/admin/payments/overview",
      "User Payments": "/admin/payments/users",
      "Customer Payments": "/admin/payments/users",
      "Worker Payments": "/admin/payments/workers",
      "Vendor Payments": "/admin/payments/vendors",
      "Vendor Payouts": "/admin/payments/vendors",
      "Admin Revenue": "/admin/payments/revenue",
      "Payment Reports": "/admin/payments/reports",
    },
    "/admin/reports": {
      "Revenue Report": "/admin/reports/revenue",
      "Booking Report": "/admin/reports/bookings",
      "Payment Report": "/admin/payments/reports",
    },
    "/admin/notifications": {
      "Push Notifications": "/admin/notifications/push",
      "Custom Messages": "/admin/notifications/messages",
      "Notification Settings": "/admin/notifications/settings",
    },
    "/admin/settings": {
      "General Settings": "/admin/settings/general",
      "Worker Assignment": "/admin/settings/worker-assignment",
      "Service Configuration": "/admin/settings/service-config",
      "System Settings": "/admin/settings/system",
    },
    "/admin/settlements": {
      "Pending": "/admin/settlements/pending",
      "Withdrawals": "/admin/settlements/withdrawals",
      "Vendors with Due": "/admin/settlements/vendors",
      "Vendor Dues": "/admin/settlements/vendors",
      "History": "/admin/settlements/history",
    },
  };

  return routeMap[parentRoute]?.[childName] || parentRoute;
};

const AdminSidebar = ({ isOpen, onClose }) => {
  const { branding } = useBranding();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [adminUser, setAdminUser] = useState({ name: 'Admin', email: '', role: 'admin' });
  const [counts, setCounts] = useState({
    bookings: 0,
    vendors: 0,
    withdrawals: 0,
    pendingSettlements: 0,
    scraps: 0
  });

  // Load admin user from storage
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('adminData') || localStorage.getItem('adminData');
      const stored = JSON.parse(storedData || '{}');
      if (stored.name || stored.email) {
        setAdminUser({
          name: stored.name || 'Admin',
          email: stored.email || '',
          role: stored.role || 'admin'
        });
      }
    } catch (e) {
      console.error('Failed to parse admin data:', e);
    }
  }, []);

  // Filter menu items by role
  const filteredMenu = useMemo(() => adminMenu.filter(item => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(adminUser.role);
  }), [adminUser.role]);

  // Fetch pending counts for badges
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await dashboardService.getStats();
        if (response.success && response.data?.stats) {
          const stats = response.data.stats;
          setCounts({
            bookings: stats.pendingBookings || 0,
            vendors: stats.pendingVendors || 0,
            withdrawals: stats.pendingWithdrawals || 0,
            pendingSettlements: stats.pendingSettlements || 0,
            scraps: stats.pendingScraps || 0
          });
        }
      } catch (error) {
        console.error("Error fetching sidebar counts:", error);
      }
    };

    fetchCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    // Only close if screen is small (mobile)
    if (window.innerWidth < 1024) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Auto-expand menu items when their route is active
  useEffect(() => {
    const activeItem = filteredMenu.find((item) => {
      if (item.route === "/admin/dashboard") {
        return location.pathname === "/admin/dashboard";
      }
      const isChildRoute =
        location.pathname.startsWith(item.route) &&
        location.pathname !== item.route;
      return isChildRoute;
    });
    if (activeItem && activeItem.children && activeItem.children.length > 0) {
      setExpandedItems((prev) => {
        if (prev[activeItem.title]) {
          return prev;
        }
        return {
          [activeItem.title]: true,
        };
      });
    }
  }, [location.pathname, filteredMenu]);

  // Check if a menu item is active
  const isActive = (route) => {
    if (route === "/admin/dashboard") {
      return location.pathname === "/admin/dashboard";
    }

    // Special case for catalog to avoid overlap with shop services/items.
    if (route === "/admin/user-categories") {
      if (location.pathname.startsWith("/admin/user-categories/vendor-")) {
        return false;
      }
    }

    // Strict prefix check: either exact match OR followed by a slash
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  // Toggle expanded state for menu items with children
  const toggleExpand = (title, closeOthers = true) => {
    setExpandedItems((prev) => {
      if (closeOthers) {
        return {
          [title]: !prev[title],
        };
      } else {
        return {
          ...prev,
          [title]: !prev[title],
        };
      }
    });
  };

  // Handle menu item click
  const handleMenuItemClick = (route, parentTitle = null) => {
    if (parentTitle) {
      setExpandedItems((prev) => {
        return {
          [parentTitle]: true,
        };
      });
    }
    navigate(route);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Render menu item
  const renderMenuItem = (item) => {
    const Icon = iconMap[item.title] || FiHome;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.title];
    const active = isActive(item.route);

    return (
      <div key={item.route} className="mb-1">
        {/* Main Menu Item */}
        <div
          className={`
            flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer
            ${active
              ? "bg-neutral-900 text-white font-bold shadow-md border border-neutral-800"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }
          `}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.title, true);
            } else {
              handleMenuItemClick(item.route);
            }
          }}>
          <Icon
            className={`text-xl flex-shrink-0 ${active ? "text-white" : "text-neutral-400"
              }`}
          />
          <span className="font-semibold flex-1 text-base">{item.title}</span>

          {/* Badge Display */}
          {(item.title === "Vendors" || item.title === "Shops & Vendors") && counts.vendors > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse mr-2">
              {counts.vendors > 99 ? '99+' : counts.vendors}
            </span>
          )}
          {item.title === "Settlements" && (counts.withdrawals + counts.pendingSettlements) > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse mr-2">
              {(counts.withdrawals + counts.pendingSettlements) > 99 ? '99+' : (counts.withdrawals + counts.pendingSettlements)}
            </span>
          )}
          {item.title === "Scrap Items" && counts.scraps > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse mr-2">
              {counts.scraps > 99 ? '99+' : counts.scraps}
            </span>
          )}

          {hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}>
              <FiChevronDown className="text-neutral-400 text-sm" />
            </motion.div>
          )}
        </div>

        {/* Children Items */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden">
              <div className="ml-4 mt-1.5 pl-3 border-l-2 border-neutral-800 space-y-1">
                {item.children.map((child, index) => {
                  const childRoute = getChildRoute(item.route, child);
                  const isChildActive =
                    location.pathname === childRoute ||
                    (childRoute !== item.route &&
                      location.pathname.startsWith(childRoute));

                  return (
                    <div
                      key={index}
                      onClick={() =>
                        handleMenuItemClick(childRoute, item.title)
                      }
                      className={`
                        px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer flex justify-between items-center
                        ${isChildActive
                          ? "bg-neutral-900 text-white font-bold border-l-2 border-white pl-3.5 shadow-xs"
                          : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                        }
                      `}>
                      <span>{child}</span>
                      {item.title === "Settlements" && child === "Pending" && counts.pendingSettlements > 0 && (
                        <span className="bg-red-500 text-white text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full">
                          {counts.pendingSettlements}
                        </span>
                      )}
                      {item.title === "Settlements" && child === "Withdrawals" && counts.withdrawals > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full">
                          {counts.withdrawals}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Sidebar content
  const sidebarContent = (
    <div className="h-full w-full flex flex-col bg-black">
      {/* Header Section: Reference Logo Badge & Admin Panel Title */}
      <div className="px-4 py-5 border-b border-neutral-900 bg-black">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* Sleek Logo Container */}
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 backdrop-blur-md shadow-lg flex items-center justify-center shrink-0 p-1.5 transition-all overflow-hidden">
              <img
                src={branding?.appLogo || '/apna-market-icon.png'}
                alt={branding?.appName || 'Apna Market'}
                className="w-full h-full object-contain filter drop-shadow"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/apna-market-icon.png';
                }}
              />
            </div>

            {/* Brand Name & ADMIN PANEL Subtitle */}
            <div className="flex flex-col min-w-0 justify-center py-0.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-sm truncate">
                {branding?.appName || 'Apna Market'}
              </h2>
              <span className="text-[11px] font-black text-white/80 tracking-[0.25em] uppercase leading-normal mt-0.5 block">
                MARKET ADMIN
              </span>
            </div>
          </div>

          {/* Close Button - Mobile Only */}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 lg:hidden"
            aria-label="Close sidebar">
            <FiX className="text-xl text-neutral-300" />
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-admin lg:pb-3">
        {filteredMenu.map((item) => renderMenuItem(item))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile: Overlay Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[99998] lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-[99999] lg:hidden shadow-2xl"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop Fixed */}
      <div
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30"
        style={{ width: '278px' }}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default AdminSidebar;
