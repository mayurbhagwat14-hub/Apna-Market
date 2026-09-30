const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { isVendor } = require('../middleware/roleMiddleware');
const {
  requestQuote,
  getVendorQuotes,
  getCustomerQuotes,
  proposeQuote,
  respondQuote
} = require('../controllers/publicControllers/quoteController');

// Customer quote routes
router.post('/quotes', authenticate, requestQuote);
router.get('/quotes/my', authenticate, getCustomerQuotes);
router.post('/quotes/:quoteId/respond', authenticate, respondQuote);

// Vendor quote routes
router.get('/vendor/quotes', authenticate, isVendor, getVendorQuotes);
router.post('/vendor/quotes/:quoteId/propose', authenticate, isVendor, proposeQuote);

module.exports = router;
