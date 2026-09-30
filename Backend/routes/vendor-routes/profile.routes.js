const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendorSelfService } = require('../../middleware/roleMiddleware');
const {
  getProfile,
  updateProfile,
  updatePersonal,
  updateBusiness,
  updateBank,
  updateAvailability,
  updateAddress,
  updateLocation
} = require('../../controllers/vendorControllers/vendorProfileController');

// Dummy validation middlewares if needed
const updateProfileValidation = [];
const updateAddressValidation = [];

// Routes - use isVendorSelfService to allow profile editing prior to admin approval
router.get('/profile', authenticate, isVendorSelfService, getProfile);
router.put('/profile', authenticate, isVendorSelfService, updateProfile);
router.patch('/profile/personal', authenticate, isVendorSelfService, updatePersonal);
router.patch('/profile/business', authenticate, isVendorSelfService, updateBusiness);
router.patch('/profile/bank', authenticate, isVendorSelfService, updateBank);
router.patch('/profile/availability', authenticate, isVendorSelfService, updateAvailability);
router.put('/address', authenticate, isVendorSelfService, updateAddress);
router.put('/profile/location', authenticate, isVendorSelfService, updateLocation);

module.exports = router;
