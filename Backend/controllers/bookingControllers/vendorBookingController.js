const mongoose = require('mongoose');
const Booking = require('../../models/Booking');
const ServiceListing = require('../../models/ServiceListing');
const Settings = require('../../models/Settings');

const { validationResult } = require('express-validator');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const {
  getNotificationCopy,
  isLiveTrackingStatus
} = require('../../utils/bookingStatusLabels');
const {
  trackingTypeOf,
  skipsJourney,
  usesPresence,
  usesLiveLocation,
  allowedVendorStatusTransitions
} = require('../../utils/trackingType');
const {
  assertCanStartService,
  assertCanCompleteBooking,
  assertCanTransitionTo
} = require('../../utils/bookingPaymentGuard');
const { createNotification } = require('../notificationControllers/notificationController');
const { sendNotificationToUser, sendNotificationToVendor, sendNotificationToWorker } = require('../../services/firebaseAdmin');

const PENDING_ACCEPT_STATUSES = [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING];

const INSTANT_BOOKING_MATCH = {
  $or: [
    { bookingType: 'instant' },
    { scheduledTime: { $regex: /^ASAP$/i } }
  ]
};

const SCHEDULED_BOOKING_MATCH = {
  $and: [
    { bookingType: { $ne: 'instant' } },
    { scheduledTime: { $not: { $regex: /^ASAP$/i } } }
  ]
};

const buildVendorRequestsQuery = (vendorId, vendorCategories) => {
  const vId = new mongoose.Types.ObjectId(vendorId);
  return {
    $or: [
      {
        vendorId: null,
        status: { $in: PENDING_ACCEPT_STATUSES },
        serviceCategory: { $in: vendorCategories },
        'potentialVendors.vendorId': vId
      },
      {
        vendorId: null,
        serviceListingId: { $ne: null },
        status: { $in: PENDING_ACCEPT_STATUSES },
        'potentialVendors.vendorId': vId
      }
    ]
  };
};

const maskCustomerContactForVendor = (booking) => {
  const pending = PENDING_ACCEPT_STATUSES.includes(booking.status) && !booking.vendorId;
  if (!pending) return booking;

  if (booking.userId?.phone) {
    booking.userId = { ...booking.userId, phone: null };
  }
  booking.customerPhoneHidden = true;
  return booking;
};

/**
 * Get vendor bookings with filters
 */
const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status, q, page = 1, limit = 20 } = req.query;

    // ── Get vendor categories from req.user (set in auth middleware) ──
    let vendorCategories = req.user.categories || req.user.service || [];
    if (!vendorCategories.length) {
      const Vendor = require('../../models/Vendor');
      const v = await Vendor.findById(vendorId, 'service').lean();
      vendorCategories = v?.service || [];
    }

    const vId = new mongoose.Types.ObjectId(vendorId);

    let query;

    if (status === 'requests' || status === 'requests_instant' || status === 'requests_scheduled') {
      const requestsBase = buildVendorRequestsQuery(vendorId, vendorCategories);
      if (status === 'requests_instant') {
        query = { $and: [requestsBase, INSTANT_BOOKING_MATCH] };
      } else if (status === 'requests_scheduled') {
        query = { $and: [requestsBase, SCHEDULED_BOOKING_MATCH] };
      } else {
        query = requestsBase;
      }
    } else if (status === 'awaiting_payment') {
      query = {
        vendorId: vId,
        status: BOOKING_STATUS.AWAITING_PAYMENT
      };
    } else {
      query = {
        $or: [
          { vendorId: vId, status: { $ne: BOOKING_STATUS.AWAITING_PAYMENT } },
          {
            vendorId: null,
            status: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING] },
            serviceCategory: { $in: vendorCategories },
            'potentialVendors.vendorId': vId
          },
          {
            vendorId: null,
            serviceListingId: { $ne: null },
            status: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING] },
            'potentialVendors.vendorId': vId
          }
        ]
      };
    }

    // ── Apply Status Group Filters ──
    if (status && status !== 'all' && !['requests', 'requests_instant', 'requests_scheduled', 'awaiting_payment'].includes(status)) {
      if (status === 'in_progress') {
        query.status = {
          $in: [
            BOOKING_STATUS.ACCEPTED,
            BOOKING_STATUS.ASSIGNED,
            BOOKING_STATUS.CONFIRMED,
            BOOKING_STATUS.JOURNEY_STARTED,
            BOOKING_STATUS.VISITED,
            BOOKING_STATUS.IN_PROGRESS,
            BOOKING_STATUS.WORK_DONE,
            'started', 'reached', 'on_the_way' // Supporting minor variants if they exist
          ]
        };
      } else if (status === 'completed') {
        query.status = {
          $in: [
            BOOKING_STATUS.COMPLETED,
            'worker_paid', 'settlement_pending', 'paid', 'closed'
          ]
        };
      } else if (status === 'assigned') {
        query.status = { $in: [BOOKING_STATUS.ASSIGNED, 'worker_accepted'] };
      } else {
        query.status = status;
      }
    }

    // ── Apply Search Filter (Simple regex on serviceName or bookingNumber) ──
    if (q) {
      const searchClause = {
        $or: [
          { serviceName: { $regex: q, $options: 'i' } },
          { bookingNumber: { $regex: q, $options: 'i' } }
        ]
      };
      if (query.$and) {
        query.$and.push(searchClause);
      } else {
        query.$and = [searchClause];
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ── Single DB round-trip: list + total via $facet ──
    const [result] = await Booking.aggregate([
      { $match: query },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
              $project: {
                _id: 1,
                bookingNumber: 1,
                status: 1,
                paymentMethod: 1,
                finalAmount: 1,
                scheduledDate: 1,
                scheduledTime: 1,
                serviceName: 1,
                serviceCategory: 1,
                categoryIcon: 1,
                createdAt: 1,
                'address.addressLine1': 1,
                'address.city': 1,
                userId: 1,
                workerId: 1,
                serviceId: 1,
                serviceListingId: 1,
                bookingType: 1,
                serviceFulfillmentType: 1,
                advanceAmount: 1,
                balanceAmount: 1,
                paymentPhase: 1,
                acceptedAt: 1,
                assignedAt: 1,
                brandName: 1,
                brandIcon: 1,
                expiresAt: 1
              }
            }
          ],
          total: [{ $count: 'n' }]
        }
      }
    ]);

    const bookings = result.data || [];
    const total = result.total?.[0]?.n || 0;

    // ── Populate only required fields ──
    await Booking.populate(bookings, [
      { path: 'userId', select: 'name phone', options: { lean: true } },
      { path: 'workerId', select: 'name', options: { lean: true } },
      {
        path: 'serviceId',
        select: 'title iconUrl categoryId',
        populate: { path: 'categoryId', select: 'title' },
        options: { lean: true }
      },
      { path: 'serviceListingId', select: 'title categoryName', options: { lean: true } }
    ]);

    const maskedBookings = bookings.map(maskCustomerContactForVendor);

    res.status(200).json({
      success: true,
      data: maskedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vendor bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings. Please try again.'
    });
  }
};


/**
 * Get booking details by ID
 */
const getBookingById = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findOne({
      _id: id,
      $or: [
        { vendorId },
        { vendorId: null, status: { $in: ['requested', 'searching'] } }
      ]
    })
      .populate('userId', 'name phone email profilePhoto')
      .populate('vendorId', 'name businessName phone email')
      .populate('serviceId', 'title description iconUrl images')
      .populate('serviceListingId', 'title categoryName status pricing pricingModel')
      .populate('categoryId', 'title slug');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.serviceListingId) {
      const listing = await ServiceListing.findById(
        booking.serviceListingId._id || booking.serviceListingId
      ).select('vendorId');
      if (!listing || listing.vendorId.toString() !== vendorId.toString()) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
    }

    const payload = maskCustomerContactForVendor(
      booking.toObject ? booking.toObject() : booking
    );

    res.status(200).json({
      success: true,
      data: payload
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking. Please try again.'
    });
  }
};

/**
 * Accept booking
 */
const acceptBooking = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const existingBooking = await Booking.findById(id).select('serviceListingId vendorId status notifiedVendors potentialVendors');
    if (existingBooking?.serviceListingId) {
      const listing = await ServiceListing.findById(existingBooking.serviceListingId).select('vendorId');
      if (!listing || listing.vendorId.toString() !== vendorId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'This booking is assigned to another provider\'s listing.'
        });
      }
    }

    // Direct / notified requests: only vendors already notified may accept
    const notified = existingBooking?.notifiedVendors || [];
    if (notified.length > 0) {
      const allowed = notified.some((id) => id.toString() === vendorId.toString());
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'This booking was sent to another provider.'
        });
      }
    }

    // ATOMIC UPDATE: Check status and vendorId in query to prevent race conditions
    // Only accept if status is REQUESTED/SEARCHING and NO vendor is assigned yet
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: id,
        status: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING] },
        vendorId: null // Crucial: Ensures another request didn't just take it
      },
      {
        $set: {
          vendorId: vendorId,
          acceptedAt: new Date()
        }
      },
      { new: true } // Return updated doc
    );

    if (!updatedBooking) {
      // If update failed, check why (likely already taken)
      const existing = await Booking.findById(id);
      if (existing && existing.vendorId) {
        return res.status(409).json({ // 409 Conflict
          success: false,
          message: 'Sorry, this job has already been accepted by another vendor.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Booking is no longer available.'
      });
    }

    // Load payment settings — use per-booking advance config (category/listing/item)
    const settingsDoc = await Settings.findOne({ type: 'global' }).lean();
    const total = Number(updatedBooking.finalAmount) || 0;
    const requiresAdvance = updatedBooking.requireAdvancePayment === true
      && (updatedBooking.advanceAmount > 0 || updatedBooking.advancePaymentPercent > 0);

    let advanceAmount = updatedBooking.advanceAmount || 0;
    let balanceAmount = updatedBooking.balanceAmount || total;

    if (requiresAdvance && !advanceAmount) {
      const pct = updatedBooking.advancePaymentPercent
        || settingsDoc?.advancePaymentPercent
        || 30;
      advanceAmount = Math.round((total * pct) / 100);
      balanceAmount = Math.max(0, total - advanceAmount);
    }

    if (!requiresAdvance) {
      advanceAmount = 0;
      balanceAmount = total;
    }

    const nextStatus = requiresAdvance ? BOOKING_STATUS.AWAITING_PAYMENT : BOOKING_STATUS.CONFIRMED;
    const nextPhase = requiresAdvance ? 'advance_pending' : 'advance_paid';

    const booking = await Booking.findByIdAndUpdate(
      updatedBooking._id,
      {
        $set: {
          advanceAmount,
          balanceAmount,
          requireAdvancePayment: requiresAdvance,
          paymentPhase: nextPhase,
          status: nextStatus,
          // ZEVYGO: vendor fulfills the job — no separate worker assignment step
          workerId: null,
          assignedAt: new Date()
        }
      },
      { new: true }
    );

    // Update vendor availability to ON_JOB
    const Vendor = require('../../models/Vendor');
    await Vendor.findByIdAndUpdate(vendorId, { availability: 'ON_JOB' });

    // Update BookingRequest statuses
    const BookingRequest = require('../../models/BookingRequest');

    // Mark this vendor's request as ACCEPTED
    await BookingRequest.findOneAndUpdate(
      { bookingId: id, vendorId },
      { status: 'ACCEPTED', respondedAt: new Date() }
    );

    // Mark all other vendors' requests as EXPIRED/CANCELLED
    await BookingRequest.updateMany(
      { bookingId: id, vendorId: { $ne: vendorId } },
      { status: 'EXPIRED', respondedAt: new Date() }
    );

    // Check payment status correction (if needed, though we set CONFIRMED above)
    if (booking.paymentMethod === 'plan_benefit' && booking.paymentStatus === PAYMENT_STATUS.SUCCESS) {
      // already good
    }

    // NOTIFY OTHER VENDORS to remove this job
    // Use the stored notifiedVendors list
    const io = req.app.get('io');
    if (io && booking.notifiedVendors && booking.notifiedVendors.length > 0) {
      console.log(`[AcceptBooking] Notifying ${booking.notifiedVendors.length} other vendors that job ${booking._id} was taken`);
      booking.notifiedVendors.forEach(otherVendorId => {
        // Skip the current vendor
        if (otherVendorId.toString() !== vendorId.toString()) {
          const room = `vendor_${otherVendorId.toString()}`;
          console.log(`[AcceptBooking] Emitting booking_taken to room: ${room}`);
          io.to(room).emit('booking_taken', {
            bookingId: booking._id.toString(), // Ensure string for frontend comparison
            message: 'This job has been accepted by someone else.'
          });
        }
      });
    } else {
      console.log('[AcceptBooking] No other vendors to notify or io not available');
    }

    // Emit real-time updates to USER
    if (io) {
      const message = requiresAdvance
        ? 'Vendor accepted! Pay advance to confirm your booking.'
        : 'Vendor has accepted your request. Your booking is confirmed!';

      io.to(`user_${booking.userId}`).emit('booking_accepted', {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        requiresAdvancePayment: requiresAdvance,
        advanceAmount,
        balanceAmount,
        vendor: {
          id: vendorId,
          name: req.user.name,
          businessName: req.user.businessName
        },
        message
      });

      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: booking.status,
        paymentPhase: booking.paymentPhase,
        message: requiresAdvance ? 'Pay advance to start service' : 'Vendor has accepted your request'
      });
    }

    // Send notification to user
    const notificationMessage = requiresAdvance
      ? `Your provider accepted! Pay advance ₹${advanceAmount} to confirm booking ${booking.bookingNumber}.`
      : `Your booking ${booking.bookingNumber} is confirmed! ${req.user.businessName || req.user.name} will arrive at scheduled time.`;

    await createNotification({
      userId: booking.userId,
      type: 'booking_accepted',
      title: requiresAdvance ? 'Pay Advance to Confirm' : 'Booking Confirmed!',
      message: notificationMessage,
      relatedId: booking._id,
      relatedType: 'booking',
      pushData: {
        type: 'booking_accepted',
        bookingId: booking._id.toString(),
        link: requiresAdvance
          ? `/user/booking-confirmation/${booking._id}`
          : `/user/booking/${booking._id}`
      }
    });

    // Send Push Notification to user (handled by createNotification)

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      data: booking
    });
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept booking. Please try again.'
    });
  }
};

/**
 * Reject booking
 * IMPORTANT: This only marks the vendor's rejection, NOT the booking itself.
 * Booking stays SEARCHING so other vendors can accept.
 */
const rejectBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    // Find booking
    const booking = await Booking.findOne({
      _id: id,
      $or: [
        { notifiedVendors: vendorId },
        { vendorId: null, status: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING] } }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not available for rejection'
      });
    }

    const validStatuses = [BOOKING_STATUS.PENDING, BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING];
    if (!validStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject booking with status: ${booking.status}`
      });
    }

    // Update BookingRequest for this vendor
    const BookingRequest = require('../../models/BookingRequest');
    await BookingRequest.findOneAndUpdate(
      { bookingId: id, vendorId },
      {
        status: 'REJECTED',
        respondedAt: new Date(),
        rejectReason: reason || 'Rejected by vendor'
      }
    );

    // Remove vendor from notifiedVendors (they've responded)
    booking.notifiedVendors = booking.notifiedVendors.filter(
      v => v.toString() !== vendorId.toString()
    );

    // Remove from potentialVendors too
    booking.potentialVendors = booking.potentialVendors.filter(
      v => v.vendorId?.toString() !== vendorId.toString()
    );

    // Check if ALL vendors have rejected
    const pendingRequests = await BookingRequest.countDocuments({
      bookingId: id,
      status: { $in: ['PENDING', 'VIEWED'] }
    });

    const remainingPotential = booking.potentialVendors.length;

    if (pendingRequests === 0 && remainingPotential === 0) {
      // No vendors left - mark booking as rejected/failed
      booking.status = BOOKING_STATUS.REJECTED;
      booking.cancelledAt = new Date();
      booking.cancelledBy = 'system';
      booking.cancellationReason = 'No vendors available';

      // Notify user that no vendors are available
      await createNotification({
        userId: booking.userId,
        type: 'booking_rejected',
        title: 'No Vendors Available',
        message: `Sorry, no vendors are available for booking ${booking.bookingNumber}. Please try again later.`,
        relatedId: booking._id,
        relatedType: 'booking',
        pushData: {
          type: 'booking_rejected',
          bookingId: booking._id.toString(),
          link: `/user/booking/${booking._id}`
        }
      });
    }
    // Otherwise, booking stays SEARCHING for other vendors

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: { bookingId: id }
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking. Please try again.'
    });
  }
};

/**
 * Assign worker to booking
 */
const assignWorker = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.user.id;
    const { id } = req.params;
    const { workerId } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // ZEVYGO: no Worker role — only vendor self-assignment is allowed
    if (workerId === 'SELF' || !workerId || String(workerId) === String(vendorId)) {
      const startCheck = assertCanStartService(booking);
      if (!startCheck.ok) {
        return res.status(402).json({ success: false, message: startCheck.message, code: startCheck.code });
      }

      booking.workerId = null;
      booking.assignedAt = new Date();

      if (booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.ACCEPTED) {
        booking.status = BOOKING_STATUS.ASSIGNED;
      }

      await booking.save();

      await createNotification({
        userId: booking.userId,
        type: 'worker_assigned',
        title: 'Service Provider Assigned',
        message: `Vendor ${req.user.businessName || req.user.name} will handle your booking ${booking.bookingNumber} personally.`,
        relatedId: booking._id,
        relatedType: 'booking',
        pushData: {
          type: 'worker_assigned',
          bookingId: booking._id.toString(),
          link: `/user/booking/${booking._id}`
        }
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${booking.userId}`).emit('booking_updated', {
          bookingId: booking._id,
          status: booking.status,
          message: 'Professional assigned to your booking'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Assigned to yourself successfully',
        data: booking
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Separate workers are not supported. Assign the job to yourself.'
    });
  } catch (error) {
    console.error('Assign worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign. Please try again.'
    });
  }
};

/**
 * Update booking status
 */
const updateBookingStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.user.id;
    const { id } = req.params;
    const { status, workerPaymentStatus, finalSettlementStatus } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Validate status transition if status is changing
    if (status && status !== booking.status) {
      const validTransitions = allowedVendorStatusTransitions(trackingTypeOf(booking));

      if (!validTransitions[booking.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${booking.status} to ${status}`
        });
      }

      const paymentCheck = assertCanTransitionTo(booking, status);
      if (!paymentCheck.ok) {
        return res.status(402).json({
          success: false,
          message: paymentCheck.message,
          code: paymentCheck.code
        });
      }

      // Update booking status
      booking.status = status;

      if (status === BOOKING_STATUS.IN_PROGRESS && !booking.startedAt) {
        booking.startedAt = new Date();
      }

      if (status === BOOKING_STATUS.WORK_DONE && !booking.completedAt) {
        // Work done timestamp? Maybe reuse/add field? For now leave it.
      }

      if (status === BOOKING_STATUS.COMPLETED) {
        booking.completedAt = new Date();
      }
    }

    // Update other fields
    if (workerPaymentStatus) {
      booking.workerPaymentStatus = workerPaymentStatus;
      if (workerPaymentStatus === 'PAID' || workerPaymentStatus === 'SUCCESS') {
        booking.isWorkerPaid = true;
        booking.workerPaidAt = booking.workerPaidAt || new Date();
      }
    }
    if (finalSettlementStatus) booking.finalSettlementStatus = finalSettlementStatus;

    await booking.save();

    // Send notification
    if (status === BOOKING_STATUS.COMPLETED) {
      await createNotification({
        userId: booking.userId,
        type: 'booking_completed',
        title: 'Booking Completed',
        message: `Your booking ${booking.bookingNumber} has been completed. Please rate your experience.`,
        relatedId: booking._id,
        relatedType: 'booking',
        pushData: {
          type: 'booking_completed',
          bookingId: booking._id.toString(),
          link: `/user/booking/${booking._id}`
        }
      });

      // Send FCM push notification to user
      // Manual push removed - auto handled by createNotification
      // sendNotificationToUser(booking.userId, { ... });

      // SEND INVOICE EMAILS
      try {
        const { sendBookingCompletionEmails } = require('../../services/emailService');
        const fullBooking = await Booking.findById(booking._id)
          .populate('userId')
          .populate('vendorId')
          .populate('serviceId');

        sendBookingCompletionEmails(fullBooking).catch(err => console.error(err));
      } catch (emailErr) {
        console.error('Failed to send completion emails:', emailErr);
      }
    }

    // Emit socket event for real-time UI refresh
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: booking.status,
        message: `Booking status updated to ${booking.status}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status. Please try again.'
    });
  }
};

/**
 * Add vendor notes to booking
 */
const addVendorNotes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.user.id;
    const { id } = req.params;
    const { notes } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking
    booking.vendorNotes = notes;

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Notes added successfully',
      data: booking
    });
  } catch (error) {
    console.error('Add vendor notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add notes. Please try again.'
    });
  }
};

const ensureTrackingSubdoc = (booking) => {
  const type = trackingTypeOf(booking);
  if (!booking.tracking) booking.tracking = {};
  booking.tracking.type = type;
  booking.trackingType = type;
  if (usesLiveLocation(type) && !booking.tracking.live) {
    booking.tracking.live = { lat: null, lng: null, heading: 0, lastUpdatedAt: null };
  }
  if (usesPresence(type) && !booking.tracking.presence) {
    booking.tracking.presence = { checkedInAt: null, checkedOutAt: null, notes: null };
  }
  return type;
};

const emitBookingUpdated = (req, booking, extra = {}) => {
  const io = req.app.get('io');
  if (!io) return;
  const type = trackingTypeOf(booking);
  io.to(`user_${booking.userId}`).emit('booking_updated', {
    bookingId: booking._id,
    status: booking.status,
    trackingType: type,
    serviceFulfillmentType: booking.serviceFulfillmentType || 'ON_SITE',
    liveTracking: isLiveTrackingStatus(booking.status, type),
    tracking: booking.tracking,
    ...extra
  });
};

/**
 * Start Self Job (Vendor performing job)
 * live/hybrid → journey_started + OTP
 * status_only → check-in (visited) without journey
 */
const startSelfJob = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure no worker is assigned (or self-assigned flag?) implementation assumes workerId null means unassigned or self?
    // User says: "if vendor didn't assignes to worker and do himself"
    // Usually means workerId is null.
    if (booking.workerId) {
      return res.status(400).json({ success: false, message: 'Worker is assigned to this booking. You cannot start it yourself unless you unassign worker.' });
    }

    const startCheck = assertCanStartService(booking);
    if (!startCheck.ok) {
      return res.status(402).json({ success: false, message: startCheck.message, code: startCheck.code });
    }

    const allowed = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ACCEPTED];
    if (!allowed.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot start service while booking is ${booking.status}.`
      });
    }

    const type = ensureTrackingSubdoc(booking);
    booking.assignedAt = booking.assignedAt || new Date();
    const fulfillment = booking.serviceFulfillmentType || 'ON_SITE';

    if (skipsJourney(type)) {
      const now = new Date();
      booking.status = BOOKING_STATUS.VISITED;
      booking.visitedAt = now;
      booking.startedAt = now;
      booking.tracking.presence.checkedInAt = now;

      await booking.save();

      await createNotification({
        userId: booking.userId,
        type: 'visit_verified',
        title: 'Provider checked in',
        message: 'Your service provider has checked in.',
        relatedId: booking._id,
        relatedType: 'booking',
        priority: 'high',
        pushData: {
          type: 'checked_in',
          bookingId: booking._id.toString(),
          link: `/user/booking/${booking._id}`
        }
      });

      emitBookingUpdated(req, booking, { message: 'Provider checked in' });
      return res.status(200).json({
        success: true,
        message: 'Checked in',
        data: booking
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    booking.status = BOOKING_STATUS.JOURNEY_STARTED;
    booking.journeyStartedAt = new Date();
    booking.visitOtp = otp;

    await booking.save();

    const journeyMsg = getNotificationCopy('journeyStarted', fulfillment);

    await createNotification({
      userId: booking.userId,
      type: 'worker_started',
      title: fulfillment === 'DELIVERY' ? 'Out for Delivery' : 'Provider On the Way',
      message: `${journeyMsg} OTP for verification: ${otp}.`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'journey_started',
        bookingId: booking._id.toString(),
        visitOtp: otp,
        link: `/user/booking/${booking._id}`
      }
    });

    emitBookingUpdated(req, booking, { visitOtp: otp, liveTracking: true });

    res.status(200).json({ success: true, message: 'Journey started, OTP sent', data: booking });
  } catch (error) {
    console.error('Start self job error:', error);
    res.status(500).json({ success: false, message: 'Failed to start job' });
  }
};

/**
 * Vendor Reached Location
 * Notify user to share OTP
 */
const vendorReachedLocation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    // Need visitOtp to resend it
    const booking = await Booking.findOne({ _id: id, vendorId }).select('+visitOtp');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (skipsJourney(trackingTypeOf(booking))) {
      return res.status(400).json({ success: false, message: 'This service uses check-in, not live arrival.' });
    }

    if (booking.status !== BOOKING_STATUS.JOURNEY_STARTED) {
      return res.status(400).json({ success: false, message: 'Journey not started yet' });
    }

    const otp = booking.visitOtp;
    const fulfillment = booking.serviceFulfillmentType || 'ON_SITE';

    // Notify user
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      userId: booking.userId,
      type: 'vendor_reached',
      title: fulfillment === 'DELIVERY' ? 'Delivery Partner Arrived' : 'Provider Has Arrived',
      message: `${getNotificationCopy('vendorReached', fulfillment)} OTP: ${otp}`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'vendor_reached',
        bookingId: booking._id.toString(),
        visitOtp: otp,
        link: `/user/booking/${booking._id}`
      }
    });

    // Socket notification removed - createNotification already handles this

    res.status(200).json({ success: true, message: 'User notified that vendor reached' });
  } catch (error) {
    console.error('Vendor reached location error:', error);
    res.status(500).json({ success: false, message: 'Failed to notify user' });
  }
};

/**
 * Verify Self Visit
 */
const verifySelfVisit = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { otp, location } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId }).select('+visitOtp');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (skipsJourney(trackingTypeOf(booking))) {
      return res.status(400).json({ success: false, message: 'Use check-in for this service. Visit OTP is not required.' });
    }
    if (booking.status !== BOOKING_STATUS.JOURNEY_STARTED) return res.status(400).json({ success: false, message: 'Journey not started' });

    const startCheck = assertCanStartService(booking);
    if (!startCheck.ok) {
      return res.status(402).json({ success: false, message: startCheck.message, code: startCheck.code });
    }

    if (booking.visitOtp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    const type = ensureTrackingSubdoc(booking);
    booking.status = BOOKING_STATUS.VISITED;
    booking.visitedAt = new Date();
    booking.startedAt = new Date();
    booking.visitOtp = undefined;
    if (location) {
      booking.visitLocation = { ...location, verifiedAt: new Date() };
    }

    await booking.save();

    const fulfillment = booking.serviceFulfillmentType || 'ON_SITE';

    // Notify user
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      userId: booking.userId,
      type: 'visit_verified',
      title: fulfillment === 'DELIVERY' ? 'Order Handover Verified' : 'Visit Verified',
      message: getNotificationCopy('visitVerified', fulfillment),
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high', // Ensure high priority
      pushData: {
        type: 'visit_verified',
        bookingId: booking._id.toString(),
        link: `/user/booking/${booking._id}`
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: BOOKING_STATUS.VISITED,
        trackingType: trackingTypeOf(booking),
        serviceFulfillmentType: fulfillment,
        liveTracking: isLiveTrackingStatus(BOOKING_STATUS.VISITED, trackingTypeOf(booking)),
        message: 'Visit verified successful'
      });
    }

    res.status(200).json({ success: true, message: 'Visit verified', data: booking });
  } catch (error) {
    console.error('Verify self visit error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify visit' });
  }
};

const checkInBooking = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { notes } = req.body || {};

    const booking = await Booking.findOne({ _id: id, vendorId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const type = ensureTrackingSubdoc(booking);
    if (!usesPresence(type)) {
      return res.status(400).json({ success: false, message: 'This service uses live tracking, not check-in.' });
    }

    const startCheck = assertCanStartService(booking);
    if (!startCheck.ok) {
      return res.status(402).json({ success: false, message: startCheck.message, code: startCheck.code });
    }

    if (booking.tracking.presence?.checkedInAt && !booking.tracking.presence?.checkedOutAt) {
      return res.status(400).json({ success: false, message: 'Already checked in' });
    }

    if (skipsJourney(type)) {
      const allowed = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ACCEPTED];
      if (!allowed.includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot check in while booking is ${booking.status}.`
        });
      }
      const now = new Date();
      booking.status = BOOKING_STATUS.VISITED;
      booking.visitedAt = now;
      booking.startedAt = now;
      booking.assignedAt = booking.assignedAt || now;
    } else {
      const allowed = [BOOKING_STATUS.VISITED, BOOKING_STATUS.IN_PROGRESS];
      if (!allowed.includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: 'Verify arrival (OTP) before check-in on hybrid tracking.'
        });
      }
    }

    const now = new Date();
    booking.tracking.presence.checkedInAt = now;
    booking.tracking.presence.checkedOutAt = null;
    if (notes != null) booking.tracking.presence.notes = String(notes).trim();
    await booking.save();

    await createNotification({
      userId: booking.userId,
      type: 'visit_verified',
      title: 'Provider checked in',
      message: 'Your service provider has checked in.',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'checked_in',
        bookingId: booking._id.toString(),
        link: `/user/booking/${booking._id}`
      }
    });

    emitBookingUpdated(req, booking, { message: 'Checked in' });
    res.status(200).json({ success: true, message: 'Checked in', data: booking });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Failed to check in' });
  }
};

const checkOutBooking = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { notes } = req.body || {};

    const booking = await Booking.findOne({ _id: id, vendorId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const type = ensureTrackingSubdoc(booking);
    if (!usesPresence(type)) {
      return res.status(400).json({ success: false, message: 'This service does not use check-out.' });
    }
    if (!booking.tracking.presence?.checkedInAt) {
      return res.status(400).json({ success: false, message: 'Check in before check-out.' });
    }
    if (booking.tracking.presence?.checkedOutAt) {
      return res.status(400).json({ success: false, message: 'Already checked out' });
    }

    const allowed = [BOOKING_STATUS.VISITED, BOOKING_STATUS.IN_PROGRESS];
    if (!allowed.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot check out while booking is ${booking.status}.`
      });
    }

    booking.tracking.presence.checkedOutAt = new Date();
    if (notes != null) booking.tracking.presence.notes = String(notes).trim();
    await booking.save();

    await createNotification({
      userId: booking.userId,
      type: 'booking_updated',
      title: 'Provider checked out',
      message: 'Your service provider has checked out.',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'medium',
      pushData: {
        type: 'checked_out',
        bookingId: booking._id.toString(),
        link: `/user/booking/${booking._id}`
      }
    });

    emitBookingUpdated(req, booking, { message: 'Checked out' });
    res.status(200).json({ success: true, message: 'Checked out', data: booking });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Failed to check out' });
  }
};

const updatePresenceNotes = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { notes } = req.body || {};

    const booking = await Booking.findOne({ _id: id, vendorId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const type = ensureTrackingSubdoc(booking);
    if (!usesPresence(type)) {
      return res.status(400).json({ success: false, message: 'This service does not use presence notes.' });
    }

    booking.tracking.presence.notes = notes != null ? String(notes).trim() : null;
    await booking.save();

    emitBookingUpdated(req, booking);
    res.status(200).json({ success: true, message: 'Presence notes updated', data: booking });
  } catch (error) {
    console.error('Presence notes error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notes' });
  }
};

/**
 * Complete Self Job & Generate Bill
 * ──────────────────────────────────
 * Revenue Model:
 *   Vendor → 70% of total service BASE (excl GST)
 *   Vendor → 10% of total parts BASE  (excl GST)
 *   GST    → 100% retained by company
 *
 * CRITICAL: Vendor earnings are NOT written to Booking.
 *           VendorBill is the single source of truth.
 *           Earnings are only credited to wallet AFTER payment.
 */
const completeSelfJob = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { workPhotos, workDoneDetails, billDetails } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Status guard
    if (booking.status !== BOOKING_STATUS.VISITED && booking.status !== BOOKING_STATUS.IN_PROGRESS) {
      return res.status(400).json({ success: false, message: 'Cannot complete from current status' });
    }

    // Prevent duplicate bills
    const VendorBill = require('../../models/VendorBill');
    const existingBill = await VendorBill.findOne({ bookingId: booking._id });
    if (existingBill) {
      return res.status(400).json({ success: false, message: 'Bill already generated for this booking' });
    }

    // ── Fetch Settings (frozen snapshot for this bill) ──
    const Settings = require('../../models/Settings');
    const settings = await Settings.findOne({ type: 'global' });
    const serviceSplitPct = settings?.servicePayoutPercentage ?? 70;
    const partsSplitPct = settings?.partsPayoutPercentage ?? 10;
    const serviceGstPct = settings?.serviceGstPercentage ?? 18;
    const partsGstPct = settings?.partsGstPercentage ?? 18;

    // ═══════════════════════════════════════════
    // STEP 1: BUILD LINE ITEMS
    // ═══════════════════════════════════════════

    // -- Original booking service (from basePrice) --
    const originalBase = Number(booking.basePrice) || 0;
    const originalGST = parseFloat(((originalBase * serviceGstPct) / 100).toFixed(2));

    // -- Vendor-added services --
    const billServices = (billDetails?.services || []).map(svc => {
      const price = Number(svc.price) || 0;
      const qty = Number(svc.quantity) || 1;
      const base = price * qty;
      const gst = parseFloat(((base * serviceGstPct) / 100).toFixed(2));
      return {
        catalogId: svc.catalogId || undefined,
        name: svc.name || 'Service',
        price,
        gstPercentage: serviceGstPct,
        quantity: qty,
        gstAmount: gst,
        total: parseFloat((base + gst).toFixed(2)),
        isOriginal: false
      };
    });

    // -- Parts --
    const billParts = (billDetails?.parts || []).map(part => {
      const price = Number(part.price) || 0;
      const qty = Number(part.quantity) || 1;
      const pGstPct = (part.gstPercentage != null) ? Number(part.gstPercentage) : partsGstPct;
      const base = price * qty;
      const gst = parseFloat(((base * pGstPct) / 100).toFixed(2));
      return {
        catalogId: part.catalogId || undefined,
        name: part.name || 'Part',
        price,
        gstPercentage: pGstPct,
        quantity: qty,
        gstAmount: gst,
        total: parseFloat((base + gst).toFixed(2))
      };
    });

    // ═══════════════════════════════════════════
    // STEP 2: CALCULATE BASE TOTALS
    // ═══════════════════════════════════════════

    const vendorServiceBase = billServices.reduce((s, sv) => s + (sv.price * sv.quantity), 0);
    const totalServiceBase = parseFloat((originalBase + vendorServiceBase).toFixed(2));
    const totalPartsBase = parseFloat(billParts.reduce((s, p) => s + (p.price * p.quantity), 0).toFixed(2));

    // ═══════════════════════════════════════════
    // STEP 3: CALCULATE GST TOTALS
    // ═══════════════════════════════════════════

    const vendorServiceGST = parseFloat(billServices.reduce((s, sv) => s + sv.gstAmount, 0).toFixed(2));
    const partsGST = parseFloat(billParts.reduce((s, p) => s + p.gstAmount, 0).toFixed(2));
    const totalGST = parseFloat((originalGST + vendorServiceGST + partsGST).toFixed(2));

    // ═══════════════════════════════════════════
    // STEP 4: FINAL BILL (what user pays)
    // ═══════════════════════════════════════════

    const visitingCharges = Number(booking.visitingCharges) || 0;
    const grandTotal = parseFloat((totalServiceBase + totalPartsBase + totalGST + visitingCharges).toFixed(2));

    // ═══════════════════════════════════════════
    // STEP 5: REVENUE SPLIT (internal only)
    // ═══════════════════════════════════════════
    // Vendor % is applied ONLY on base — never on GST

    const vendorServiceEarning = parseFloat(((totalServiceBase * serviceSplitPct) / 100).toFixed(2));
    const vendorPartsEarning = parseFloat(((totalPartsBase * partsSplitPct) / 100).toFixed(2));
    const vendorTotalEarning = parseFloat((vendorServiceEarning + vendorPartsEarning).toFixed(2));
    const companyRevenue = parseFloat((grandTotal - vendorTotalEarning).toFixed(2));

    // ═══════════════════════════════════════════
    // STEP 6: PERSIST BILL
    // ═══════════════════════════════════════════

    // Include original service as line item for completeness
    const allServices = [
      {
        name: booking.serviceName || 'Original Service',
        price: originalBase,
        gstPercentage: serviceGstPct,
        quantity: 1,
        gstAmount: originalGST,
        total: parseFloat((originalBase + originalGST).toFixed(2)),
        isOriginal: true
      },
      ...billServices
    ];

    const bill = await VendorBill.create({
      bookingId: booking._id,
      vendorId,

      // Line items
      services: allServices,
      parts: billParts,

      // Base totals
      originalServiceBase: originalBase,
      vendorServiceBase,
      totalServiceBase,
      totalPartsBase,
      visitingCharges,

      // GST totals
      originalGST,
      vendorServiceGST,
      partsGST,
      totalGST,

      // Bill total
      grandTotal,

      // Payout config snapshot
      payoutConfig: {
        serviceSplitPercentage: serviceSplitPct,
        partsSplitPercentage: partsSplitPct,
        serviceGstPercentage: serviceGstPct,
        partsGstPercentage: partsGstPct
      },

      // Revenue split
      vendorServiceEarning,
      vendorPartsEarning,
      vendorTotalEarning,
      companyRevenue,

      status: 'generated',
      generatedAt: new Date()
    });

    // ═══════════════════════════════════════════
    // STEP 7: UPDATE BOOKING (no earnings!)
    // ═══════════════════════════════════════════

    booking.status = BOOKING_STATUS.WORK_DONE;
    booking.finalAmount = grandTotal;
    const advancePaid = booking.paymentPhase === 'advance_paid' && (booking.advanceAmount || 0) > 0;
    const balanceDue = advancePaid
      ? Math.max(0, grandTotal - booking.advanceAmount)
      : grandTotal;
    booking.balanceAmount = balanceDue;
    booking.userPayableAmount = balanceDue;
    booking.paymentPhase = balanceDue > 0 ? 'final_pending' : 'fully_paid';
    if (balanceDue === 0) {
      booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
    }
    booking.vendorBillId = bill._id;

    // Reuse existing Payment OTP for cash collection or generate new one
    const payOtp = booking.paymentOtp || Math.floor(1000 + Math.random() * 9000).toString();
    booking.paymentOtp = payOtp;

    if (workPhotos) booking.workPhotos = workPhotos;

    // Store bill summary in workDoneDetails for frontend display
    booking.workDoneDetails = {
      ...(typeof workDoneDetails === 'object' ? workDoneDetails : {}),
      billId: bill._id.toString(),
      items: [
        ...allServices.map(s => ({ title: s.name, qty: s.quantity, price: s.total })),
        ...billParts.map(p => ({ title: p.name, qty: p.quantity, price: p.total }))
      ]
    };
    booking.markModified('workDoneDetails');

    await booking.save();

    // ── Notify user ──
    const { createNotification } = require('../notificationControllers/notificationController');
    
    // 1. Notify user that work is completed
    await createNotification({
      userId: booking.userId,
      type: 'work_completed',
      title: 'Work Completed',
      message: `Work finished! Your bill is being prepared.`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'work_completed',
        bookingId: booking._id.toString(),
        link: `/user/booking/${booking._id}`
      }
    });

    // 2. Notify user with Final Bill and OTP (The missing piece)
    await createNotification({
      userId: booking.userId,
      type: 'work_done',
      title: 'Billing Ready',
      message: `Bill Generated: ₹${grandTotal}. Your verification OTP is ${payOtp}. Please share this with the professional to complete.`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'work_done',
        bookingId: booking._id.toString(),
        paymentOtp: payOtp,
        link: `/user/booking/${booking._id}`
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: BOOKING_STATUS.WORK_DONE,
        finalAmount: grandTotal
      });
    }

    // Response: bill totals only, NO vendor earnings exposed
    res.status(200).json({
      success: true,
      message: 'Work done, bill generated',
      data: {
        booking,
        bill: {
          id: bill._id,
          grandTotal,
          totalGST,
          totalServiceBase,
          totalPartsBase
        }
      }
    });
  } catch (error) {
    console.error('Complete self job error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete job' });
  }
};

/**
 * Collect Self Cash
 * ─────────────────
 * Called after user confirms OTP for cash payment.
 *
 * Wallet logic:
 *   dues     += grandTotal          (vendor physically holds this cash)
 *   earnings += vendorTotalEarning  (vendor's rightful share)
 *   Net owed to platform = dues − earnings
 *
 * VendorBill is the ONLY source of truth for earnings.
 */
const collectSelfCash = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { otp } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId }).select('+paymentOtp');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== BOOKING_STATUS.WORK_DONE) return res.status(400).json({ success: false, message: 'Work not done yet' });
    if (booking.paymentOtp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    // ── Fetch the VendorBill (single source of truth) ──
    const VendorBill = require('../../models/VendorBill');
    const bill = await VendorBill.findOne({ bookingId: booking._id });
    if (!bill) return res.status(500).json({ success: false, message: 'Bill not found — cannot process payment' });

    const grandTotal = Number(bill.grandTotal) || 0;
    const vendorEarning = Number(bill.vendorTotalEarning) || 0;

    // ── Update Booking status ──
    booking.status = BOOKING_STATUS.COMPLETED;
    booking.paymentPhase = 'fully_paid';
    booking.paymentMethod = 'cash collected'; // Standardized label
    booking.paymentStatus = PAYMENT_STATUS.COLLECTED_BY_VENDOR;
    booking.cashCollected = true;
    booking.cashCollectedBy = 'vendor';
    booking.cashCollectorId = vendorId;
    booking.cashCollectedAt = new Date();
    booking.completedAt = new Date();
    booking.paymentOtp = undefined;
    await booking.save();

    // ── Update VendorBill status ──
    bill.status = 'paid';
    bill.paidAt = new Date();
    await bill.save();

    // ── Update Vendor Wallet (Atomic with $inc) ──
    const Vendor = require('../../models/Vendor');
    const vendorDoc = await Vendor.findById(vendorId).select('wallet');

    if (vendorDoc) {
      const currentDues = (vendorDoc.wallet.dues || 0) + grandTotal;
      const cashLimit = vendorDoc.wallet.cashLimit || 10000;
      // Net owed = dues − earnings (vendor keeps their share from cash)
      const netOwed = currentDues - ((vendorDoc.wallet.earnings || 0) + vendorEarning);
      const isBlocked = netOwed > cashLimit;

      const updateQuery = {
        $inc: {
          'wallet.dues': grandTotal,
          'wallet.earnings': vendorEarning,
          'wallet.totalCashCollected': grandTotal
        }
      };

      if (isBlocked) {
        updateQuery.$set = {
          'wallet.isBlocked': true,
          'wallet.blockedAt': new Date(),
          'wallet.blockReason': `Cash limit exceeded. Net owed: ₹${netOwed.toFixed(2)}, Limit: ₹${cashLimit}`
        };
      }

      await Vendor.findByIdAndUpdate(vendorId, updateQuery);

      // ── Create Transaction Records ──
      const Transaction = require('../../models/Transaction');

      // Transaction 1: Cash Collected (Platform is owed this amount)
      await Transaction.create({
        vendorId,
        bookingId: booking._id,
        type: 'cash_collected',
        amount: grandTotal,
        status: 'completed',
        paymentMethod: 'cash collected', // Standardized label
        description: `Cash ₹${grandTotal} collected for booking #${booking.bookingNumber}. Dues increased.`,
        metadata: {
          type: 'dues_increase',
          collectedBy: 'vendor',
          billId: bill._id.toString(),
          grandTotal,
          vendorEarning,
          companyRevenue: bill.companyRevenue
        }
      });

      // Transaction 2: Earnings Credit (Vendor's rightful share)
      if (vendorEarning > 0) {
        await Transaction.create({
          vendorId,
          bookingId: booking._id,
          type: 'earnings_credit',
          amount: vendorEarning,
          status: 'completed',
          paymentMethod: 'wallet',
          description: `Earnings ₹${vendorEarning} credited for booking #${booking.bookingNumber} (70% service + 10% parts)`,
          metadata: {
            type: 'earnings_increase',
            billId: bill._id.toString(),
            serviceEarning: bill.vendorServiceEarning,
            partsEarning: bill.vendorPartsEarning
          }
        });
      }
    }

    const { sendBookingPaymentNotifications } = require('../../utils/sendBookingPaymentNotifications');
    await sendBookingPaymentNotifications(booking, {
      amount: grandTotal,
      paymentMethod: 'cash',
      eventType: 'payment_received',
      isFinalPayment: true,
    });

    res.status(200).json({ success: true, message: 'Cash collected, job completed', data: booking });
  } catch (error) {
    console.error('Collect self cash error:', error);
    res.status(500).json({ success: false, message: 'Failed to process cash payment' });
  }
};

/**
 * Pay Worker (Manual Settlement)
 */
const payWorker = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.workerId) {
      // Vendor self jobs: mark settlement flag without legacy Worker model
      booking.isWorkerPaid = true;
      booking.workerPaymentStatus = 'SUCCESS';
      booking.workerPaidAt = new Date();
      await booking.save();
      return res.status(200).json({
        success: true,
        message: 'Self-job settlement marked',
        data: booking
      });
    }

    if (booking.isWorkerPaid) {
      return res.status(400).json({ success: false, message: 'Already marked as paid' });
    }

    booking.isWorkerPaid = true;
    booking.workerPaymentStatus = 'SUCCESS';
    booking.workerPaidAt = new Date();
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Payment marked successfully',
      data: booking
    });
  } catch (error) {
    console.error('Pay worker error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark payment' });
  }
};

/**
 * Get vendor ratings and reviews
 */
const getVendorRatings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch bookings where rating is not null
    const bookings = await Booking.find({ vendorId, rating: { $ne: null } })
      .populate('userId', 'name profilePhoto')
      .populate('serviceId', 'title iconUrl')
      .sort({ reviewedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments({ vendorId, rating: { $ne: null } });

    // Calculate average rating
    const stats = await Booking.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), rating: { $ne: null } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      stats: stats[0] || { averageRating: 0, totalReviews: 0, star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vendor ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings'
    });
  }
};

/**
 * Get pending booking requests for vendor (for reconnection)
 * Called when vendor app reconnects to fetch any missed alerts
 */
const getPendingBookings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const BookingRequest = require('../../models/BookingRequest');

    // Get all pending booking requests for this vendor
    const pendingRequests = await BookingRequest.find({
      vendorId,
      status: { $in: ['PENDING', 'VIEWED'] }
    })
      .populate({
        path: 'bookingId',
        match: { status: BOOKING_STATUS.SEARCHING, vendorId: null },
        populate: [
          { path: 'userId', select: 'name phone' },
          {
            path: 'serviceId',
            select: 'title iconUrl categoryId',
            populate: { path: 'categoryId', select: 'title' }
          }
        ]
      })
      .sort({ sentAt: -1 })
      .limit(20);

    // Filter out null bookings (already accepted by others)
    const validRequests = pendingRequests.filter(r => r.bookingId !== null);

    // Format response
    const bookings = validRequests.map(req => ({
      requestId: req._id,
      bookingId: req.bookingId._id,
      bookingNumber: req.bookingId.bookingNumber,
      serviceName: req.bookingId.serviceId?.title || req.bookingId.serviceName,
      customerName: req.bookingId.userId?.name,
      customerPhone: req.bookingId.userId?.phone,
      scheduledDate: req.bookingId.scheduledDate,
      scheduledTime: req.bookingId.scheduledTime,
      address: req.bookingId.address,
      price: req.bookingId.finalAmount,
      distance: req.distance,
      wave: req.wave,
      sentAt: req.sentAt,
      status: req.status,
      serviceCategory: req.bookingId.serviceCategory,
      brandName: req.bookingId.brandName,
      brandIcon: req.bookingId.brandIcon,
      categoryIcon: req.bookingId.categoryIcon,
      createdAt: req.bookingId.createdAt,
      expiresAt: req.bookingId.expiresAt
    }));

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending bookings'
    });
  }
};

module.exports = {
  getVendorBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  assignWorker,
  updateBookingStatus,
  addVendorNotes,
  startSelfJob,
  vendorReachedLocation,
  verifySelfVisit,
  checkInBooking,
  checkOutBooking,
  updatePresenceNotes,
  completeSelfJob,
  collectSelfCash,
  payWorker,
  getVendorRatings,
  getPendingBookings
};
