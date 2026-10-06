import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
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

        {/* User Module */}
        <Route path="/user/*" element={<UserRoutes />} />

        {/* Vendor Module */}
        <Route path="/vendor/*" element={<VendorRoutes />} />

        {/* Admin Module */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Dev / Design System Preview */}
        <Route path="/design-system" element={<DesignSystemPreview />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
