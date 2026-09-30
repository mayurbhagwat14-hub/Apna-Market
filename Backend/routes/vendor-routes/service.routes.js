const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor, isVendorSelfService } = require('../../middleware/roleMiddleware');
const {
  getVendorServices,
  getServiceDetail,
  createServiceListing,
  updateServiceListing,
  toggleServiceStatus,
  deleteServiceListing,
  getAvailableCategories,
  applyCategoryEnrollment,
  getVendorCategoryEnrollments,
  updateCategoryEnrollmentAnswers,
  getServicePreview
} = require('../../controllers/vendorControllers/vendorServiceController');

// Service Listing Routes (use isVendorSelfService to allow pre-approval access)
router.get('/services', authenticate, isVendorSelfService, getVendorServices);
router.get('/services/:id/detail', authenticate, isVendorSelfService, getServiceDetail);
router.get('/services/:id/preview', authenticate, isVendorSelfService, getServicePreview);
router.post('/services', authenticate, isVendorSelfService, createServiceListing);
router.patch('/services/:id', authenticate, isVendorSelfService, updateServiceListing);
router.patch('/services/:id/toggle', authenticate, isVendorSelfService, toggleServiceStatus);
router.delete('/services/:id', authenticate, isVendorSelfService, deleteServiceListing);

// Vendor Category Enrollment Routes
router.get('/categories', authenticate, isVendorSelfService, getAvailableCategories);
router.get('/category-enrollments', authenticate, isVendorSelfService, getVendorCategoryEnrollments);
router.post('/category-enrollment', authenticate, isVendorSelfService, applyCategoryEnrollment);
router.patch('/category-enrollment/:categoryId/answers', authenticate, isVendorSelfService, updateCategoryEnrollmentAnswers);

module.exports = router;
