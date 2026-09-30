const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getServiceListingsForReview,
  getServiceListingDetail,
  approveServiceListing,
  rejectServiceListing,
  suspendServiceListing
} = require('../../controllers/adminControllers/adminServiceListingController');

// Service Listing Review Routes
router.get('/service-listings', authenticate, isAdmin, getServiceListingsForReview);
router.get('/service-listings/:id', authenticate, isAdmin, getServiceListingDetail);
router.patch('/service-listings/:id/approve', authenticate, isAdmin, approveServiceListing);
router.patch('/service-listings/:id/reject', authenticate, isAdmin, rejectServiceListing);
router.patch('/service-listings/:id/suspend', authenticate, isAdmin, suspendServiceListing);

module.exports = router;
