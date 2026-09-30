const VendorAdPlan = require('../../models/VendorAdPlan');
const VendorSubscription = require('../../models/VendorSubscription');
const Vendor = require('../../models/Vendor');
const { createOrder, verifyPayment } = require('../../services/razorpayService');
const { calculateEndDate } = require('../adminControllers/vendorAdPlanController');

/**
 * GET /api/vendors/subscription/plans
 * Get all active vendor advertisement plans (vendor view)
 */
const getAvailablePlans = async (req, res) => {
  try {
    const plans = await VendorAdPlan.find({ isActive: true })
      .select('-totalRevenue')
      .sort({ displayOrder: 1, price: 1 });

    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching available plans:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
};

/**
 * GET /api/vendors/subscription/my
 * Get vendor's current subscription status and history
 */
const getMySubscription = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Get current active subscription
    const activeSubscription = await VendorSubscription.findOne({
      vendorId,
      status: 'ACTIVE',
      endDate: { $gt: new Date() }
    })
      .populate('planId', 'name price durationType durationValue features badge')
      .lean();

    // If found but expired, mark it as expired
    if (activeSubscription && new Date() > new Date(activeSubscription.endDate)) {
      await VendorSubscription.findByIdAndUpdate(activeSubscription._id, { status: 'EXPIRED' });
    }

    // Get subscription history (last 10)
    const history = await VendorSubscription.find({
      vendorId,
      status: { $in: ['ACTIVE', 'EXPIRED', 'CANCELLED'] }
    })
      .populate('planId', 'name price durationType')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate remaining days for active sub
    let remainingDays = 0;
    let remainingHours = 0;
    if (activeSubscription && activeSubscription.status === 'ACTIVE') {
      const now = new Date();
      const end = new Date(activeSubscription.endDate);
      const diffMs = end - now;
      remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      remainingHours = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    }

    res.status(200).json({
      success: true,
      data: {
        hasActiveSubscription: !!activeSubscription && activeSubscription.status === 'ACTIVE',
        activeSubscription: activeSubscription || null,
        remainingDays,
        remainingHours,
        history
      }
    });
  } catch (error) {
    console.error('Error fetching vendor subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
};

/**
 * POST /api/vendors/subscription/create-order
 * Create a Razorpay order for subscription purchase
 */
const createSubscriptionOrder = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'planId is required' });
    }

    // Find the plan
    const plan = await VendorAdPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, message: 'Plan not found or not available' });
    }

    // Get vendor info
    const vendor = await Vendor.findById(vendorId).select('name email phone businessName');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Calculate amounts
    const basePrice = plan.price;
    const gstPercentage = 18;
    const gstAmount = parseFloat(((basePrice * gstPercentage) / 100).toFixed(2));
    const totalAmount = parseFloat((basePrice + gstAmount).toFixed(2));

    // Create Razorpay order
    const receiptId = `vsub_${vendorId}_${Date.now()}`;
    const orderResult = await createOrder(
      totalAmount,
      'INR',
      receiptId,
      {
        vendorId: vendorId.toString(),
        planId: plan._id.toString(),
        planName: plan.name,
        type: 'vendor_subscription'
      }
    );

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: orderResult.error
      });
    }

    // Create a PENDING subscription record
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, plan.durationType, plan.durationValue);

    const subscription = new VendorSubscription({
      vendorId,
      planId: plan._id,
      planSnapshot: {
        name: plan.name,
        price: plan.price,
        durationType: plan.durationType,
        durationValue: plan.durationValue,
        features: plan.features
      },
      startDate,
      endDate,
      status: 'PENDING_PAYMENT',
      amountPaid: basePrice,
      gstAmount,
      totalAmount,
      razorpayOrderId: orderResult.orderId,
      paymentMethod: 'razorpay',
      receiptNumber: receiptId
    });

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        subscriptionId: subscription._id,
        orderId: orderResult.orderId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        planName: plan.name,
        vendorName: vendor.businessName || vendor.name,
        vendorEmail: vendor.email,
        vendorPhone: vendor.phone,
        breakdown: {
          basePrice,
          gstPercentage,
          gstAmount,
          totalAmount
        }
      }
    });
  } catch (error) {
    console.error('Error creating subscription order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

/**
 * POST /api/vendors/subscription/verify-payment
 * Verify Razorpay payment and activate subscription
 */
const verifySubscriptionPayment = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscriptionId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification details are required' });
    }

    // Verify signature
    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      // Mark subscription as failed
      if (subscriptionId) {
        await VendorSubscription.findByIdAndUpdate(subscriptionId, { status: 'CANCELLED', cancelReason: 'Payment verification failed', cancelledBy: 'system', cancelledAt: new Date() });
      }
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Find the pending subscription
    const subscription = await VendorSubscription.findOne({
      razorpayOrderId: razorpay_order_id,
      vendorId,
      status: 'PENDING_PAYMENT'
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found or already processed' });
    }

    // Cancel any other active subscriptions for this vendor
    await VendorSubscription.updateMany(
      { vendorId, status: 'ACTIVE', _id: { $ne: subscription._id } },
      { status: 'EXPIRED', cancelReason: 'Replaced by new subscription', cancelledBy: 'system', cancelledAt: new Date() }
    );

    // Activate the subscription — set fresh start and end dates from NOW
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, subscription.planSnapshot.durationType, subscription.planSnapshot.durationValue);

    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.status = 'ACTIVE';
    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.razorpaySignature = razorpay_signature;
    await subscription.save();

    // Update plan stats
    await VendorAdPlan.findByIdAndUpdate(subscription.planId, {
      $inc: { totalPurchases: 1, totalRevenue: subscription.totalAmount }
    });

    res.status(200).json({
      success: true,
      message: '🎉 Subscription activated successfully! Your shop is now advertised on Apna Market.',
      data: {
        subscription: {
          _id: subscription._id,
          planName: subscription.planSnapshot.name,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          amountPaid: subscription.amountPaid,
          gstAmount: subscription.gstAmount,
          totalAmount: subscription.totalAmount,
          receiptNumber: subscription.receiptNumber,
          paymentId: razorpay_payment_id,
          status: 'ACTIVE'
        }
      }
    });
  } catch (error) {
    console.error('Error verifying subscription payment:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

module.exports = {
  getAvailablePlans,
  getMySubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment
};
