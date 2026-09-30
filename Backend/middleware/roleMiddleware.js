const { USER_ROLES } = require('../utils/constants');

/**
 * Role-based authorization middleware
 */
const isUser = (req, res, next) => {
  if (req.userRole !== USER_ROLES.USER) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User role required.'
    });
  }
  next();
};

const isVendor = (req, res, next) => {
  if (req.userRole !== USER_ROLES.VENDOR) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Vendor role required.'
    });
  }
  next();
};

const isWorker = (req, res) => {
  // ZEVYGO: Worker role retired — vendors fulfill all services
  return res.status(410).json({
    success: false,
    message: 'Worker role is no longer supported. Use the Vendor app.'
  });
};

const isAdmin = (req, res, next) => {
  if (req.userRole !== USER_ROLES.ADMIN && req.userRole !== 'super_admin' && req.userRole !== 'admin' && req.userRole !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

const isAdminOrVendor = (req, res, next) => {
  if (req.userRole !== USER_ROLES.ADMIN && req.userRole !== 'super_admin' && req.userRole !== USER_ROLES.VENDOR) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Vendor role required.'
    });
  }
  next();
};

/**
 * Super Admin only middleware
 * Checks if admin user has super_admin role in database
 */
const isSuperAdmin = async (req, res, next) => {
  try {
    /* if (req.userRole !== USER_ROLES.ADMIN && req.userRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.user.id);

    if (!admin || admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin role required.'
      });
    } */

    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

/**
 * Vendor Self-Service middleware
 * Allows vendors to access profile, services, and KYC endpoints
 * even before full admin approval. Blocks suspended/blocked vendors.
 * Use this instead of isVendor for self-service endpoints.
 */
const isVendorSelfService = (req, res, next) => {
  if (req.userRole !== USER_ROLES.VENDOR) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Vendor role required.'
    });
  }

  // Block suspended or blocked vendors
  const accountStatus = req.user?.accountStatus;
  if (accountStatus === 'SUSPENDED' || accountStatus === 'BLOCKED') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been suspended or blocked. Please contact support.'
    });
  }

  next();
};

module.exports = {
  isUser,
  isVendor,
  isWorker,
  isAdmin,
  isAdminOrVendor,
  isSuperAdmin,
  isVendorSelfService
};

