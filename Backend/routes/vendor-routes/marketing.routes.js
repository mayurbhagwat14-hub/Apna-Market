const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendorSelfService } = require('../../middleware/roleMiddleware');
const {
  getMarketingOverview,
  createOffer,
  updateOffer,
  deleteOffer,
  uploadShopPhoto,
  deleteShopPhoto,
  toggleStoreVisibility
} = require('../../controllers/vendorControllers/vendorMarketingController');

// All marketing routes require vendor authentication
router.get('/', authenticate, isVendorSelfService, getMarketingOverview);
router.post('/offers', authenticate, isVendorSelfService, createOffer);
router.put('/offers/:id', authenticate, isVendorSelfService, updateOffer);
router.delete('/offers/:id', authenticate, isVendorSelfService, deleteOffer);

router.post('/photos', authenticate, isVendorSelfService, uploadShopPhoto);
router.delete('/photos/:id', authenticate, isVendorSelfService, deleteShopPhoto);

router.patch('/visibility', authenticate, isVendorSelfService, toggleStoreVisibility);

module.exports = router;
