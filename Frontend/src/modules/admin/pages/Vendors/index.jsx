import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiBriefcase,
  FiActivity,
  FiDollarSign,
  FiChevronRight,
  FiCheckSquare
} from 'react-icons/fi';

// Import sub-components
// Import sub-components
import AllVendors from './AllVendors';
import VendorAnalytics from './VendorAnalytics';
import MarketingApprovals from './MarketingApprovals';

const Vendors = () => {
  const location = useLocation();

  const navTabs = [
    { name: 'All Shops', path: '/admin/vendors/all', icon: FiUsers },
    { name: 'Shop Analytics', path: '/admin/vendors/analytics', icon: FiActivity },
    { name: 'Marketing Approvals', path: '/admin/vendors/marketing-approvals', icon: FiCheckSquare },
  ];

  const getPageTitle = () => {
    const currentTab = navTabs.find(tab => location.pathname === tab.path);
    return currentTab ? currentTab.name : 'Shop & Vendor Management';
  };

  return (
    <div className="space-y-6">
      {/* Page Content */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="all" replace />} />
          <Route path="all" element={<AllVendors />} />
          <Route path="analytics" element={<VendorAnalytics />} />
          <Route path="marketing-approvals" element={<MarketingApprovals />} />
        </Routes>
      </motion.div>
    </div>
  );
};

export default Vendors;
