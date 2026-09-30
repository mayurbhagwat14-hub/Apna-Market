const VendorAdPlan = require('../../models/VendorAdPlan');
const VendorSubscription = require('../../models/VendorSubscription');

/**
 * GET /api/admin/vendor-plans
 * Get all vendor advertisement plans (admin view — includes inactive)
 */
const getAllVendorAdPlans = async (req, res) => {
  try {
    const filter = {};
    if (req.query.activeOnly === 'true') {
      filter.isActive = true;
    }

    const plans = await VendorAdPlan.find(filter).sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching vendor ad plans:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch plans' });
  }
};

/**
 * GET /api/admin/vendor-plans/:id
 * Get single vendor ad plan
 */
const getVendorAdPlanById = async (req, res) => {
  try {
    const plan = await VendorAdPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/vendor-plans
 * Create a new vendor advertisement plan
 */
const createVendorAdPlan = async (req, res) => {
  try {
    const { name, tagline, description, price, durationType, durationValue, features, badge, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Plan name is required' });
    }
    if (price === undefined || price < 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }

    // Check for duplicate name
    const existing = await VendorAdPlan.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A plan with this name already exists' });
    }

    const plan = new VendorAdPlan({
      name: name.trim(),
      tagline: tagline?.trim() || '',
      description: description?.trim() || '',
      price: Number(price),
      durationType: durationType || 'monthly',
      durationValue: Number(durationValue) || 1,
      features: Array.isArray(features) ? features.filter(f => f.trim()) : [],
      badge: badge?.trim() || '',
      displayOrder: Number(displayOrder) || 0
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Vendor advertisement plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error creating vendor ad plan:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create plan' });
  }
};

/**
 * PUT /api/admin/vendor-plans/:id
 * Update a vendor advertisement plan
 */
const updateVendorAdPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const plan = await VendorAdPlan.findById(id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Check for duplicate name if name is being changed
    if (updates.name && updates.name.trim() !== plan.name) {
      const existing = await VendorAdPlan.findOne({ name: updates.name.trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'A plan with this name already exists' });
      }
      plan.name = updates.name.trim();
    }

    if (updates.tagline !== undefined) plan.tagline = updates.tagline.trim();
    if (updates.description !== undefined) plan.description = updates.description.trim();
    if (updates.price !== undefined) plan.price = Number(updates.price);
    if (updates.durationType !== undefined) plan.durationType = updates.durationType;
    if (updates.durationValue !== undefined) plan.durationValue = Number(updates.durationValue);
    if (updates.features !== undefined) plan.features = Array.isArray(updates.features) ? updates.features.filter(f => f.trim()) : [];
    if (updates.badge !== undefined) plan.badge = updates.badge.trim();
    if (updates.displayOrder !== undefined) plan.displayOrder = Number(updates.displayOrder);
    if (updates.isActive !== undefined) plan.isActive = Boolean(updates.isActive);

    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error updating vendor ad plan:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update plan' });
  }
};

/**
 * DELETE /api/admin/vendor-plans/:id
 * Delete a vendor advertisement plan
 * (Only if no active subscriptions exist for this plan)
 */
const deleteVendorAdPlan = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any active subscriptions use this plan
    const activeSubCount = await VendorSubscription.countDocuments({ planId: id, status: 'ACTIVE' });
    if (activeSubCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete this plan — ${activeSubCount} vendor(s) have active subscriptions. Deactivate the plan instead.`
      });
    }

    const plan = await VendorAdPlan.findByIdAndDelete(id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    res.status(200).json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor ad plan:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete plan' });
  }
};

/**
 * PATCH /api/admin/vendor-plans/:id/toggle
 * Toggle plan active/inactive
 */
const toggleVendorAdPlan = async (req, res) => {
  try {
    const plan = await VendorAdPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    plan.isActive = !plan.isActive;
    await plan.save();

    res.status(200).json({
      success: true,
      message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
      data: plan
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/vendor-subscriptions
 * Get all vendor subscriptions with filters
 */
const getAllVendorSubscriptions = async (req, res) => {
  try {
    const { status, vendorId, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (vendorId) filter.vendorId = vendorId;

    const skip = (Number(page) - 1) * Number(limit);

    const [subscriptions, total] = await Promise.all([
      VendorSubscription.find(filter)
        .populate('vendorId', 'name email phone businessName profilePhoto')
        .populate('planId', 'name price durationType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      VendorSubscription.countDocuments(filter)
    ]);

    // Calculate stats
    const [activeCount, totalRevenue] = await Promise.all([
      VendorSubscription.countDocuments({ status: 'ACTIVE' }),
      VendorSubscription.aggregate([
        { $match: { status: { $in: ['ACTIVE', 'EXPIRED'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      stats: {
        activeSubscriptions: activeCount,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalSubscriptions: total
      }
    });
  } catch (error) {
    console.error('Error fetching vendor subscriptions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/vendor-subscriptions/grant
 * Admin can manually grant a subscription to a vendor (free or discounted)
 */
const grantVendorSubscription = async (req, res) => {
  try {
    const { vendorId, planId, note } = req.body;

    if (!vendorId || !planId) {
      return res.status(400).json({ success: false, message: 'vendorId and planId are required' });
    }

    const plan = await VendorAdPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Cancel any existing active subscription for this vendor
    await VendorSubscription.updateMany(
      { vendorId, status: 'ACTIVE' },
      { status: 'CANCELLED', cancelledBy: 'admin', cancelReason: 'Replaced by admin-granted subscription', cancelledAt: new Date() }
    );

    // Calculate end date
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
      status: 'ACTIVE',
      amountPaid: 0,
      gstAmount: 0,
      totalAmount: 0,
      paymentMethod: 'admin_granted',
      receiptNumber: `ADM-${Date.now()}`,
      adminNote: note || 'Granted by admin'
    });

    await subscription.save();

    // Update plan stats
    plan.totalPurchases += 1;
    await plan.save();

    res.status(201).json({
      success: true,
      message: `Subscription granted to vendor successfully (valid until ${endDate.toLocaleDateString('en-IN')})`,
      data: subscription
    });
  } catch (error) {
    console.error('Error granting subscription:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Helper: Calculate end date based on duration type
 */
function calculateEndDate(startDate, durationType, durationValue) {
  const end = new Date(startDate);
  switch (durationType) {
    case 'daily':
      end.setDate(end.getDate() + durationValue);
      break;
    case 'weekly':
      end.setDate(end.getDate() + (durationValue * 7));
      break;
    case 'monthly':
      end.setMonth(end.getMonth() + durationValue);
      break;
    case 'yearly':
      end.setFullYear(end.getFullYear() + durationValue);
      break;
    default:
      end.setMonth(end.getMonth() + 1);
  }
  return end;
}

module.exports = {
  getAllVendorAdPlans,
  getVendorAdPlanById,
  createVendorAdPlan,
  updateVendorAdPlan,
  deleteVendorAdPlan,
  toggleVendorAdPlan,
  getAllVendorSubscriptions,
  grantVendorSubscription,
  calculateEndDate
};
