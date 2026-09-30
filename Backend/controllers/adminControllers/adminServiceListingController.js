const ServiceListing = require('../../models/ServiceListing');
const Vendor = require('../../models/Vendor');
const { LISTING_STATUS } = require('../../utils/constants');
const { logAudit } = require('../../utils/auditLogger');
const { createNotification } = require('../notificationControllers/notificationController');

/**
 * Get all service listings for admin review
 * GET /api/admin/service-listings
 */
const getServiceListingsForReview = async (req, res) => {
  try {
    const { status, categoryId, vendorId, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (categoryId) query.categoryId = categoryId;
    if (vendorId) query.vendorId = vendorId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { categoryName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [listings, total] = await Promise.all([
      ServiceListing.find(query)
        .populate('vendorId', 'name email phone profilePhoto approvalStatus accountStatus address')
        .populate('categoryId', 'title slug homeIconUrl')
        .sort({ submittedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ServiceListing.countDocuments(query)
    ]);

    // Get status counts for summary
    const statusCounts = await ServiceListing.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const counts = {};
    statusCounts.forEach(s => { counts[s._id] = s.count; });

    res.status(200).json({
      success: true,
      data: listings,
      statusCounts: counts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get service listings for review error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service listings' });
  }
};

/**
 * Get single service listing detail (admin view)
 * GET /api/admin/service-listings/:id
 */
const getServiceListingDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await ServiceListing.findById(id)
      .populate('vendorId', 'name email phone profilePhoto approvalStatus accountStatus address aadhar pan bankDetails businessDetails categoryEnrollments rating totalReviews completedJobs')
      .populate('categoryId', 'title slug homeIconUrl vendorFormSchema bookingMode defaultPricingModel requiredDocuments');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    res.status(200).json({
      success: true,
      listing,
      vendorFormSchema: listing.categoryId?.vendorFormSchema || []
    });
  } catch (error) {
    console.error('Get service listing detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service listing detail' });
  }
};

/**
 * Approve a service listing
 * PATCH /api/admin/service-listings/:id/approve
 */
const approveServiceListing = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const listing = await ServiceListing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    if (listing.status !== LISTING_STATUS.PENDING_REVIEW) {
      return res.status(400).json({ success: false, message: `Cannot approve listing with status: ${listing.status}` });
    }

    const previousStatus = listing.status;
    const wasPendingEdit = Boolean(listing.hasPendingEdits);

    // If this was a pending edit of an already-approved listing, clear snapshot (new data is now live)
    if (listing.hasPendingEdits) {
      listing.approvedVersion = null;
      listing.hasPendingEdits = false;
      listing.pendingEditSubmittedAt = null;
    }

    listing.status = LISTING_STATUS.APPROVED;
    listing.approvedAt = new Date();
    listing.approvedBy = adminId;
    listing.rejectedReason = null;
    listing.adminNotes = null;

    await listing.save();

    await logAudit({
      actorId: adminId,
      actorType: 'ADMIN',
      action: 'SERVICE_LISTING_APPROVED',
      entity: 'ServiceListing',
      entityId: listing._id,
      previousValue: { status: previousStatus },
      newValue: { status: LISTING_STATUS.APPROVED, title: listing.title },
      req
    });

    // Notify vendor
    try {
      await createNotification({
        recipientId: listing.vendorId,
        recipientType: 'Vendor',
        title: 'Service Approved! ✅',
        message: wasPendingEdit
          ? `Your "${listing.title}" updates (including packages) are approved and now live for customers.`
          : `Your "${listing.title}" service listing has been approved and is now live for customers.`,
        type: 'SERVICE_APPROVED',
        data: { serviceListingId: listing._id }
      });
    } catch (notifErr) {
      console.error('Failed to send approval notification:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: `Service listing "${listing.title}" approved successfully`,
      listing
    });
  } catch (error) {
    console.error('Approve service listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve service listing' });
  }
};

/**
 * Reject a service listing (with reason)
 * PATCH /api/admin/service-listings/:id/reject
 */
const rejectServiceListing = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { reason, requestChanges = false } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const listing = await ServiceListing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    if (listing.status !== LISTING_STATUS.PENDING_REVIEW) {
      return res.status(400).json({ success: false, message: `Cannot reject listing with status: ${listing.status}` });
    }

    const previousStatus = listing.status;

    // If this was a pending edit, revert fully to approved version (incl. packages/blocks)
    if (listing.hasPendingEdits && listing.approvedVersion) {
      const approved = listing.approvedVersion;
      listing.title = approved.title;
      listing.description = approved.description;
      listing.shortDescription = approved.shortDescription;
      listing.experience = approved.experience;
      listing.languages = approved.languages;
      listing.pricingModel = approved.pricingModel;
      listing.bookingMode = approved.bookingMode;
      listing.bookingConfig = approved.bookingConfig || listing.bookingConfig;
      listing.pricing = approved.pricing;
      listing.availability = approved.availability;
      listing.serviceArea = approved.serviceArea;
      listing.cancellation = approved.cancellation;
      listing.dynamicFormAnswers = approved.dynamicFormAnswers;
      listing.pricingFormAnswers = approved.pricingFormAnswers || {};
      listing.availabilityFormAnswers = approved.availabilityFormAnswers || {};
      listing.serviceAreaFormAnswers = approved.serviceAreaFormAnswers || {};
      listing.bookingRulesFormAnswers = approved.bookingRulesFormAnswers || {};
      listing.documentsFormAnswers = approved.documentsFormAnswers || {};
      listing.listingFormAnswers = approved.listingFormAnswers || {};
      listing.portfolioPhotos = approved.portfolioPhotos;
      listing.portfolioVideos = approved.portfolioVideos || [];
      listing.documents = approved.documents;
      listing.catalogItems = approved.catalogItems || [];
      listing.markModified('catalogItems');
      listing.markModified('dynamicFormAnswers');
      listing.markModified('listingFormAnswers');
      listing.status = LISTING_STATUS.APPROVED; // Keep approved version live
      listing.approvedVersion = null;
      listing.hasPendingEdits = false;
      listing.pendingEditSubmittedAt = null;
      listing.adminNotes = `Edit rejected: ${reason.trim()}`;
    } else {
      listing.status = requestChanges ? LISTING_STATUS.CHANGES_REQUESTED : LISTING_STATUS.REJECTED;
      listing.rejectedReason = reason.trim();
    }

    await listing.save();

    await logAudit({
      actorId: adminId,
      actorType: 'ADMIN',
      action: requestChanges ? 'SERVICE_LISTING_CHANGES_REQUESTED' : 'SERVICE_LISTING_REJECTED',
      entity: 'ServiceListing',
      entityId: listing._id,
      previousValue: { status: previousStatus },
      newValue: { status: listing.status, reason: reason.trim() },
      req
    });

    // Notify vendor
    try {
      await createNotification({
        recipientId: listing.vendorId,
        recipientType: 'Vendor',
        title: requestChanges ? 'Changes Required' : 'Service Listing Rejected',
        message: requestChanges
          ? `Your "${listing.title}" service needs changes: ${reason.trim()}`
          : `Your "${listing.title}" service listing was rejected: ${reason.trim()}`,
        type: requestChanges ? 'SERVICE_CHANGES_REQUESTED' : 'SERVICE_REJECTED',
        data: { serviceListingId: listing._id, reason: reason.trim() }
      });
    } catch (notifErr) {
      console.error('Failed to send rejection notification:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: requestChanges
        ? `Changes requested for "${listing.title}"`
        : `Service listing "${listing.title}" rejected`,
      listing
    });
  } catch (error) {
    console.error('Reject service listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject service listing' });
  }
};

/**
 * Suspend a service listing
 * PATCH /api/admin/service-listings/:id/suspend
 */
const suspendServiceListing = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    const listing = await ServiceListing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    listing.status = LISTING_STATUS.SUSPENDED;
    listing.adminNotes = reason || 'Suspended by admin';
    await listing.save();

    await logAudit({
      actorId: adminId,
      actorType: 'ADMIN',
      action: 'SERVICE_LISTING_SUSPENDED',
      entity: 'ServiceListing',
      entityId: listing._id,
      newValue: { status: LISTING_STATUS.SUSPENDED, reason },
      req
    });

    res.status(200).json({
      success: true,
      message: `Service listing "${listing.title}" suspended`,
      listing
    });
  } catch (error) {
    console.error('Suspend service listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to suspend service listing' });
  }
};

module.exports = {
  getServiceListingsForReview,
  getServiceListingDetail,
  approveServiceListing,
  rejectServiceListing,
  suspendServiceListing
};
