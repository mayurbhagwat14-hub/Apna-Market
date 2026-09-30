const Category = require('../models/Category');
const { BOOKING_STATUS } = require('./constants');
const { buildPaymentNotifications } = require('./serviceNotificationTemplates');
const { createNotification } = require('../controllers/notificationControllers/notificationController');

/**
 * Send service-specific payment push notifications to user, vendor, and worker.
 */
const sendBookingPaymentNotifications = async (booking, options = {}) => {
  if (!booking) return;

  const {
    amount = booking.finalAmount ?? booking.userPayableAmount ?? booking.balanceAmount ?? 0,
    paymentMethod = 'online',
    eventType = 'payment_success',
    isFinalPayment = booking.status === BOOKING_STATUS.COMPLETED || booking.paymentPhase === 'fully_paid',
  } = options;

  let category = null;
  if (booking.categoryId) {
    category = await Category.findById(booking.categoryId).select('title slug').lean();
  }

  const copy = buildPaymentNotifications({
    booking,
    category,
    amount,
    paymentMethod,
    isFinalPayment,
  });

  const userLink = `/user/booking/${booking._id}`;
  const vendorLink = `/vendor/bookings/${booking._id}`;

  const basePushData = {
    type: eventType,
    bookingId: String(booking._id),
    serviceSlug: copy.serviceSlug,
    serviceKey: copy.serviceKey,
    categoryTitle: copy.categoryTitle,
    serviceName: booking.serviceName || copy.categoryTitle,
  };

  if (booking.userId) {
    await createNotification({
      userId: booking.userId,
      type: eventType,
      title: copy.user.title,
      message: copy.user.message,
      relatedId: booking._id,
      relatedType: 'payment',
      priority: 'high',
      pushData: { ...basePushData, link: userLink },
      data: {
        serviceSlug: copy.serviceSlug,
        serviceKey: copy.serviceKey,
        categoryTitle: copy.categoryTitle,
      },
    });
  }

  if (booking.vendorId) {
    await createNotification({
      vendorId: booking.vendorId,
      type: eventType,
      title: copy.vendor.title,
      message: copy.vendor.message,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: { ...basePushData, link: vendorLink },
      data: {
        serviceSlug: copy.serviceSlug,
        serviceKey: copy.serviceKey,
      },
    });
  }

  if (booking.workerId) {
    await createNotification({
      workerId: booking.workerId,
      type: eventType,
      title: copy.vendor.title,
      message: copy.vendor.message,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: { ...basePushData, link: vendorLink },
      data: {
        serviceSlug: copy.serviceSlug,
        serviceKey: copy.serviceKey,
      },
    });
  }

  return copy;
};

module.exports = { sendBookingPaymentNotifications };
