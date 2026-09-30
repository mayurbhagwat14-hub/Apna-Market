const Booking = require('../../models/Booking');
const User = require('../../models/User');
const Settings = require('../../models/Settings');
const Plan = require('../../models/Plan');
const { validationResult } = require('express-validator');
const { PAYMENT_STATUS, BOOKING_STATUS } = require('../../utils/constants');
const { createOrder, verifyPayment, refundPayment } = require('../../services/razorpayService');
const { createNotification } = require('../notificationControllers/notificationController');
const { sendBookingPaymentNotifications } = require('../../utils/sendBookingPaymentNotifications');
const { recordBookingEarning } = require('../../services/earningTrackerService');
const { getDueChargeAmount } = require('../../utils/bookingPaymentGuard');

/**
 * Create Razorpay order for booking payment
 */
const createPaymentOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { bookingId } = req.body;

    // Get booking
    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if payment already done (fully paid)
    if (booking.paymentPhase === 'fully_paid' && booking.paymentStatus === PAYMENT_STATUS.SUCCESS) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking'
      });
    }

    // Determine charge amount: advance vs final balance
    const { amount: chargeAmount, type: paymentType } = getDueChargeAmount(booking);

    if (!chargeAmount || chargeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No payment due for this booking'
      });
    }

    // Create Razorpay order
    console.log(`Creating Razorpay order (${paymentType}) with amount:`, chargeAmount);
    const orderResult = await createOrder(
      chargeAmount,
      'INR',
      `${booking.bookingNumber}_${paymentType}`,
      {
        bookingId: booking._id.toString(),
        userId: userId.toString(),
        bookingNumber: booking.bookingNumber,
        paymentType
      }
    );

    console.log('Razorpay order result:', orderResult);

    if (!orderResult.success) {
      console.error('Razorpay order creation failed:', orderResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: orderResult.error || 'Unknown error'
      });
    }

    // Update booking with Razorpay order ID
    booking.razorpayOrderId = orderResult.orderId;
    booking.pendingPaymentType = paymentType;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: orderResult.orderId,
        amount: orderResult.amount / 100,
        paymentType,
        currency: orderResult.currency,
        key: process.env.RAZORPAY_KEY_ID,
        bookingId: booking._id
      }
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order. Please try again.',
      error: error.message
    });
  }
};

/**
 * Verify payment (webhook handler)
 */
const verifyPaymentWebhook = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Verify signature
    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find booking by Razorpay order ID
    const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const paymentType = booking.pendingPaymentType || 'full';

    if (paymentType === 'advance') {
      booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
      booking.paymentMethod = 'online';
      booking.paymentPhase = 'advance_paid';
      booking.advancePaidAt = new Date();
      booking.advancePaymentId = razorpay_payment_id;
      booking.status = BOOKING_STATUS.CONFIRMED;
      booking.balanceAmount = Math.max(0, (booking.finalAmount || 0) - (booking.advanceAmount || 0));
    } else if (paymentType === 'final') {
      booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
      booking.paymentMethod = booking.paymentMethod || 'online';
      booking.paymentPhase = 'fully_paid';
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.paymentId = razorpay_payment_id;
      booking.status = BOOKING_STATUS.COMPLETED;
      booking.completedAt = new Date();
    } else {
      booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
      booking.paymentMethod = 'online';
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.paymentId = razorpay_payment_id;

      if ([BOOKING_STATUS.PENDING, BOOKING_STATUS.SEARCHING, BOOKING_STATUS.AWAITING_PAYMENT].includes(booking.status)) {
        booking.status = BOOKING_STATUS.CONFIRMED;
        booking.paymentPhase = 'advance_paid';
      } else if (booking.status === BOOKING_STATUS.WORK_DONE) {
        booking.status = BOOKING_STATUS.COMPLETED;
        booking.paymentPhase = 'fully_paid';
        booking.completedAt = new Date();
      }
    }

    if (paymentType !== 'advance') {
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.paymentId = razorpay_payment_id;
    }

    booking.pendingPaymentType = null;

    await booking.save();

    // ── Credit Vendor Wallet from VendorBill (single source of truth) ──
    const Transaction = require('../../models/Transaction');
    const Vendor = require('../../models/Vendor');
    const VendorBill = require('../../models/VendorBill');

    // User payment transaction
    await Transaction.create({
      userId: booking.userId,
      bookingId: booking._id,
      amount: booking.finalAmount,
      type: 'payment',
      paymentMethod: 'razorpay',
      status: 'completed',
      description: `Online payment for booking ${booking.bookingNumber}`,
      referenceId: razorpay_payment_id
    });

    // Fetch VendorBill for earnings (only if bill exists = post-completion payment)
    const bill = await VendorBill.findOne({ bookingId: booking._id });

    if (bill && booking.vendorId) {
      const vendorEarning = bill.vendorTotalEarning;

      // Mark bill as paid
      bill.status = 'paid';
      bill.paidAt = new Date();
      await bill.save();

      // Online payment: only earnings increase, NO dues (platform holds the money)
      await Vendor.findByIdAndUpdate(booking.vendorId, {
        $inc: { 'wallet.earnings': vendorEarning }
      });

      // Earnings credit transaction
      if (vendorEarning > 0) {
        await Transaction.create({
          vendorId: booking.vendorId,
          bookingId: booking._id,
          amount: vendorEarning,
          type: 'earnings_credit',
          paymentMethod: 'system',
          status: 'completed',
          description: `Earnings ₹${vendorEarning} credited for booking ${booking.bookingNumber} (online payment)`,
          metadata: {
            type: 'earnings_increase',
            billId: bill._id.toString(),
            serviceEarning: bill.vendorServiceEarning,
            partsEarning: bill.vendorPartsEarning
          }
        });
      }

      console.log(`[Payment] Credited ₹${vendorEarning} to vendor ${booking.vendorId}`);
    }

    // Record stats in the Daily Earning Tracker (Async)
    recordBookingEarning({
      date: new Date(),
      totalRevenue: Number(bill ? bill.grandTotal : booking.finalAmount) || 0,
      platformCommission: Number(bill ? bill.companyRevenue : (booking.finalAmount * 0.2)) || 0,
      vendorEarnings: Number(bill ? bill.vendorTotalEarning : (booking.finalAmount * 0.8)) || 0,
      totalGST: Number(bill ? bill.totalGST : 0) || 0,
      totalTDS: 0 // Tracked in withdrawals
    }).catch(err => console.error('[Payment] Daily tracker failed:', err));

    // Service-specific payment notifications (user + vendor + worker)
    await sendBookingPaymentNotifications(booking, {
      amount: booking.finalAmount,
      paymentMethod: 'online',
      eventType: 'payment_success',
      isFinalPayment: booking.status === BOOKING_STATUS.COMPLETED,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

/**
 * Process wallet payment
 */
const processWalletPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { bookingId } = req.body;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get booking
    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if payment already done (fully paid)
    if (booking.paymentPhase === 'fully_paid' && booking.paymentStatus === PAYMENT_STATUS.SUCCESS) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking'
      });
    }

    const { amount: chargeAmount, type: paymentType } = getDueChargeAmount(booking);

    if (!chargeAmount || chargeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No payment due for this booking'
      });
    }

    // Check wallet balance
    if (user.wallet.balance < chargeAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Deduct from user wallet
    user.wallet.balance -= chargeAmount;
    await user.save();

    const Transaction = require('../../models/Transaction');
    await Transaction.create({
      userId,
      bookingId: booking._id,
      amount: chargeAmount,
      type: 'debit',
      paymentMethod: 'wallet',
      status: 'completed',
      description: `${paymentType === 'advance' ? 'Advance' : paymentType === 'final' ? 'Final' : ''} wallet payment for booking ${booking.bookingNumber}`.trim(),
      balanceAfter: user.wallet.balance
    });

    // Update booking payment status
    booking.paymentMethod = 'wallet';

    if (paymentType === 'advance') {
      booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
      booking.paymentPhase = 'advance_paid';
      booking.advancePaidAt = new Date();
      booking.status = BOOKING_STATUS.CONFIRMED;
      booking.balanceAmount = Math.max(0, (booking.finalAmount || 0) - (booking.advanceAmount || 0));
    } else if (paymentType === 'final') {
      booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
      booking.paymentPhase = 'fully_paid';
      booking.status = BOOKING_STATUS.COMPLETED;
      booking.completedAt = new Date();
      booking.paymentId = `WALLET_${Date.now()}`;
    } else {
      booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
      booking.paymentPhase = 'fully_paid';
      booking.paymentId = `WALLET_${Date.now()}`;
      if ([BOOKING_STATUS.PENDING, BOOKING_STATUS.SEARCHING, BOOKING_STATUS.AWAITING_PAYMENT].includes(booking.status)) {
        booking.status = BOOKING_STATUS.CONFIRMED;
      } else if (booking.status === BOOKING_STATUS.WORK_DONE) {
        booking.status = BOOKING_STATUS.COMPLETED;
        booking.completedAt = new Date();
      }
    }

    await booking.save();

    // ── Credit Vendor Wallet from VendorBill (single source of truth) ──
    const Vendor = require('../../models/Vendor');
    const VendorBill = require('../../models/VendorBill');

    const bill = await VendorBill.findOne({ bookingId: booking._id });

    if (bill && booking.vendorId) {
      const vendorEarning = bill.vendorTotalEarning;

      // Mark bill as paid
      bill.status = 'paid';
      bill.paidAt = new Date();
      await bill.save();

      // Wallet payment: only earnings increase, NO dues (platform holds the money)
      await Vendor.findByIdAndUpdate(booking.vendorId, {
        $inc: { 'wallet.earnings': vendorEarning }
      });

      if (vendorEarning > 0) {
        await Transaction.create({
          vendorId: booking.vendorId,
          bookingId: booking._id,
          amount: vendorEarning,
          type: 'earnings_credit',
          paymentMethod: 'system',
          status: 'completed',
          description: `Earnings ₹${vendorEarning} credited for booking ${booking.bookingNumber} (wallet payment)`,
          metadata: {
            type: 'earnings_increase',
            billId: bill._id.toString(),
            serviceEarning: bill.vendorServiceEarning,
            partsEarning: bill.vendorPartsEarning
          }
        });
      }

      console.log(`[Wallet Payment] Credited ₹${vendorEarning} to vendor ${booking.vendorId}`);
    }

    // Record stats in the Daily Earning Tracker (Async)
    recordBookingEarning({
      date: new Date(),
      totalRevenue: Number(bill ? bill.grandTotal : booking.finalAmount) || 0,
      platformCommission: Number(bill ? bill.companyRevenue : (booking.finalAmount * 0.2)) || 0,
      vendorEarnings: Number(bill ? bill.vendorTotalEarning : (booking.finalAmount * 0.8)) || 0,
      totalGST: Number(bill ? bill.totalGST : 0) || 0,
      totalTDS: 0 // Tracked in withdrawals
    }).catch(err => console.error('[Wallet Payment] Daily tracker failed:', err));

    await sendBookingPaymentNotifications(booking, {
      amount: booking.finalAmount,
      paymentMethod: 'wallet',
      eventType: 'payment_success',
      isFinalPayment: booking.status === BOOKING_STATUS.COMPLETED,
    });

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        bookingId: booking._id,
        amount: booking.finalAmount,
        remainingBalance: user.wallet.balance
      }
    });
  } catch (error) {
    console.error('Process wallet payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment. Please try again.'
    });
  }
};

/**
 * Process refund
 */
const processRefund = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { bookingId } = req.body;
    const { amount } = req.body; // Optional: partial refund

    // Get booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if payment was successful
    if (booking.paymentStatus !== PAYMENT_STATUS.SUCCESS) {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed for this booking'
      });
    }

    // Process refund based on payment method
    if (booking.paymentMethod === 'razorpay' && booking.razorpayPaymentId) {
      // Razorpay refund
      const refundResult = await refundPayment(
        booking.razorpayPaymentId,
        amount || booking.finalAmount,
        {
          bookingId: booking._id.toString(),
          reason: 'Booking cancellation'
        }
      );

      if (!refundResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process refund'
        });
      }

      // Update booking payment status
      booking.paymentStatus = PAYMENT_STATUS.REFUNDED;
    } else if (booking.paymentMethod === 'wallet') {
      // Wallet refund - add back to user wallet
      const user = await User.findById(booking.userId);
      if (user) {
        user.wallet.balance += (amount || booking.finalAmount);
        await user.save();
      }

      // Update booking payment status
      booking.paymentStatus = PAYMENT_STATUS.REFUNDED;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Refund not supported for this payment method'
      });
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        bookingId: booking._id,
        refundAmount: amount || booking.finalAmount
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund. Please try again.'
    });
  }
};

/**
 * Get payment history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bookings with successful payments
    const bookings = await Booking.find({
      userId,
      paymentStatus: PAYMENT_STATUS.SUCCESS
    })
      .populate('serviceId', 'title iconUrl')
      .populate('vendorId', 'name businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Booking.countDocuments({
      userId,
      paymentStatus: PAYMENT_STATUS.SUCCESS
    });

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history. Please try again.'
    });
  }
};

/**
 * Confirm Pay at Home option
 */
const confirmPayAtHome = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.paymentPhase === 'fully_paid' && booking.paymentStatus === PAYMENT_STATUS.SUCCESS) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking'
      });
    }

    // Advance must be paid online — cannot skip with pay-at-home
    if (
      booking.status === BOOKING_STATUS.AWAITING_PAYMENT
      && booking.paymentPhase === 'advance_pending'
      && booking.requireAdvancePayment
    ) {
      return res.status(402).json({
        success: false,
        message: 'Advance payment must be completed online before the booking can proceed.',
        code: 'ADVANCE_PENDING'
      });
    }

    // Customer opts to pay remaining balance at door after service
    if (
      booking.status === BOOKING_STATUS.WORK_DONE
      && booking.paymentPhase === 'final_pending'
    ) {
      booking.paymentMethod = 'pay_at_home';
      await booking.save();

      if (booking.vendorId) {
        await createNotification({
          vendorId: booking.vendorId,
          type: 'payment_pending',
          title: 'Pay at Home Selected',
          message: `Customer will pay the remaining ₹${booking.balanceAmount || booking.userPayableAmount || 0} at home for booking ${booking.bookingNumber}.`,
          relatedId: booking._id,
          relatedType: 'booking'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pay at home confirmed for remaining balance',
        data: booking
      });
    }

    // Pre-service pay-at-home (categories without advance requirement)
    booking.paymentMethod = 'pay_at_home';
    booking.paymentStatus = PAYMENT_STATUS.PENDING;
    if ([BOOKING_STATUS.PENDING, BOOKING_STATUS.SEARCHING, BOOKING_STATUS.AWAITING_PAYMENT].includes(booking.status)) {
      booking.status = BOOKING_STATUS.CONFIRMED;
      if (!booking.requireAdvancePayment) {
        booking.paymentPhase = 'advance_paid';
      }
    }

    await booking.save();

    // Notify Vendor that booking is confirmed
    await createNotification({
      vendorId: booking.vendorId,
      type: 'booking_confirmed',
      title: 'Booking Confirmed (Pay at Home)',
      message: `Booking ${booking.bookingNumber} has been confirmed. Payment method: Pay at Home.`,
      relatedId: booking._id,
      relatedType: 'booking'
    });

    res.status(200).json({
      success: true,
      message: 'Booking confirmed with Pay at Home option',
      data: booking
    });
  } catch (error) {
    console.error('Confirm Pay at Home error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking. Please try again.'
    });
  }
};

const calculateUpgradeAmount = (currentPlan, newPlanPrice) => {
  if (!currentPlan || !currentPlan.isActive) return { amount: newPlanPrice, credit: 0 };

  const now = new Date();
  const expiry = new Date(currentPlan.expiry);

  if (expiry <= now) return { amount: newPlanPrice, credit: 0 };

  const totalDuration = 30 * 24 * 60 * 60 * 1000;
  const remainingTime = expiry.getTime() - now.getTime();

  let remainingRatio = remainingTime / totalDuration;
  if (remainingRatio > 1) remainingRatio = 1;
  if (remainingRatio < 0) remainingRatio = 0;

  const credit = Math.floor((currentPlan.price || 0) * remainingRatio);

  if (credit <= 0) return { amount: newPlanPrice, credit: 0 };

  let finalAmount = newPlanPrice - credit;
  if (finalAmount < 0) finalAmount = 0;

  return { amount: Math.ceil(finalAmount), credit };
};

const getUpgradeDetails = async (req, res) => {
  try {
    const { planId } = req.query;
    if (!planId) return res.status(400).json({ success: false, message: 'Plan ID required' });

    const newPlan = await Plan.findById(planId);
    if (!newPlan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const user = await User.findById(req.user.id);
    const { amount, credit } = calculateUpgradeAmount(user.plans, newPlan.price);

    res.status(200).json({
      success: true,
      data: {
        originalPrice: newPlan.price,
        credit,
        finalAmount: amount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};






const createPlanOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const user = await User.findById(req.user.id);

    // Calculate dynamic pricing
    const { amount } = calculateUpgradeAmount(user.plans, plan.price);

    // Add 18% Tax
    const amountWithTax = Math.ceil(amount * 1.18);

    const orderResult = await createOrder(
      amountWithTax,
      'INR',
      `PLAN_${Date.now()}`,
      { type: 'plan', planId, userId: req.user.id }
    );
    if (!orderResult.success) {
      return res.status(500).json({ success: false, message: 'Order creation failed' });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: orderResult.orderId,
        amount: orderResult.amount / 100,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const verifyPlanPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    // Import verifyPayment if needed, but it's destructured at top
    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid signature' });

    const plan = await Plan.findById(planId);
    const user = await User.findById(req.user.id);

    const validityDays = plan.validityDays || 30;
    user.plans = {
      isActive: true,
      name: plan.name,
      expiry: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
      price: plan.price
    };

    await user.save();

    res.status(200).json({ success: true, message: 'Plan activated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPaymentWebhook,
  processWalletPayment,
  processRefund,
  getPaymentHistory,
  confirmPayAtHome,
  createPlanOrder,
  verifyPlanPayment,
  getUpgradeDetails
};

