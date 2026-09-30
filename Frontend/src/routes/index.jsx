import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import module routes
import UserRoutes from '../modules/user/routes';
import VendorRoutes from '../modules/vendor/routes';
import AdminRoutes from '../modules/admin/routes';

import LandingPage from '../modules/landing/pages/LandingPage';
import DesignSystemPreview from '../modules/landing/pages/DesignSystemPreview';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Proper Home Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/Home" element={<LandingPage />} />

      {/* User Routes */}
      <Route path="/user/*" element={<UserRoutes />} />

      {/* Vendor Routes */}
      <Route path="/vendor/*" element={<VendorRoutes />} />



      {/* Admin Routes */}
      <Route path="/admin/*" element={<AdminRoutes />} />
    </Routes>
  );
};

export default AppRoutes;

