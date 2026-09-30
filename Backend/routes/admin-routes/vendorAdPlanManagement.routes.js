const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getAllVendorAdPlans,
  getVendorAdPlanById,
  createVendorAdPlan,
  updateVendorAdPlan,
  deleteVendorAdPlan,
  toggleVendorAdPlan,
  getAllVendorSubscriptions,
  grantVendorSubscription
} = require('../../controllers/adminControllers/vendorAdPlanController');

// ─── VENDOR AD PLANS (CRUD) ───
// GET /api/admin/vendor-plans — Get all vendor advertisement plans
router.get('/vendor-plans', authenticate, isAdmin, getAllVendorAdPlans);

// GET /api/admin/vendor-plans/:id — Get single plan
router.get('/vendor-plans/:id', authenticate, isAdmin, getVendorAdPlanById);

// POST /api/admin/vendor-plans — Create new plan
router.post('/vendor-plans', authenticate, isAdmin, createVendorAdPlan);

// PUT /api/admin/vendor-plans/:id — Update plan
router.put('/vendor-plans/:id', authenticate, isAdmin, updateVendorAdPlan);

// DELETE /api/admin/vendor-plans/:id — Delete plan
router.delete('/vendor-plans/:id', authenticate, isAdmin, deleteVendorAdPlan);

// PATCH /api/admin/vendor-plans/:id/toggle — Toggle active/inactive
router.patch('/vendor-plans/:id/toggle', authenticate, isAdmin, toggleVendorAdPlan);

// ─── VENDOR SUBSCRIPTIONS (ADMIN VIEW) ───
// GET /api/admin/vendor-subscriptions — View all vendor subscriptions
router.get('/vendor-subscriptions', authenticate, isAdmin, getAllVendorSubscriptions);

// POST /api/admin/vendor-subscriptions/grant — Admin manually grants a subscription
router.post('/vendor-subscriptions/grant', authenticate, isAdmin, grantVendorSubscription);

module.exports = router;
