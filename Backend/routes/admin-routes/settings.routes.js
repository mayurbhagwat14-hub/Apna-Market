const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const { getSettings, updateSettings, getCommonListingForms, updateCommonListingForms } = require('../../controllers/adminControllers/settingsController');

// All routes are protected and for admin only
router.use(authenticate, isAdmin);

router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

router.route('/settings/common-listing-forms')
  .get(getCommonListingForms)
  .put(updateCommonListingForms);

module.exports = router;
