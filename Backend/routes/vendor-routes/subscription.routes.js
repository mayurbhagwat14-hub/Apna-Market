const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendorSelfService } = require('../../middleware/roleMiddleware');
const {
  getAvailablePlans,
  getMySubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment
} = require('../../controllers/vendorControllers/vendorSubscriptionController');

// GET /api/vendors/subscription/plans — Get all active plans (vendor view)
router.get('/plans', authenticate, isVendorSelfService, getAvailablePlans);

// GET /api/vendors/subscription/my — Get vendor's current subscription & history
router.get('/my', authenticate, isVendorSelfService, getMySubscription);

// POST /api/vendors/subscription/create-order — Create Razorpay order for plan purchase
router.post('/create-order', authenticate, isVendorSelfService, createSubscriptionOrder);

// POST /api/vendors/subscription/verify-payment — Verify payment and activate subscription
router.post('/verify-payment', authenticate, isVendorSelfService, verifySubscriptionPayment);

module.exports = router;
