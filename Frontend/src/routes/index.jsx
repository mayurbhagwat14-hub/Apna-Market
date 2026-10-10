import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LogoLoader from '../components/common/LogoLoader';

// Lazy load module routes for code splitting
const LandingPage = lazy(() => import('../modules/landing/pages/LandingPage'));
const UserRoutes = lazy(() => import('../modules/user/routes'));
const VendorRoutes = lazy(() => import('../modules/vendor/routes'));
const AdminRoutes = lazy(() => import('../modules/admin/routes'));
const DesignSystemPreview = lazy(() => import('../modules/landing/pages/DesignSystemPreview'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<LogoLoader />}>
      <Routes>
        {/* Home / Landing */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/Home" element={<LandingPage />} />

        {/* User Module - support both /user and /user/* */}
        <Route path="/user" element={<Navigate to="/user/" replace />} />
        <Route path="/user/*" element={<UserRoutes />} />

        {/* Vendor Module - support both /vendor and /vendor/* */}
        <Route path="/vendor" element={<Navigate to="/vendor/" replace />} />
        <Route path="/vendor/*" element={<VendorRoutes />} />

        {/* Admin Module - support both /admin and /admin/* */}
        <Route path="/admin" element={<Navigate to="/admin/" replace />} />
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Dev / Design System Preview */}
        <Route path="/design-system" element={<DesignSystemPreview />} />

        {/* Global Fallback: redirect unmatched routes to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
