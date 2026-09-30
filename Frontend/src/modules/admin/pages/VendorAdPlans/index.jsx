import React, { useState, useEffect, useCallback } from 'react';
import {
  getVendorAdPlans,
  createVendorAdPlan,
  updateVendorAdPlan,
  deleteVendorAdPlan,
  toggleVendorAdPlan,
  getVendorSubscriptions
} from '../../services/vendorAdPlanService';
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiPackage, FiDollarSign, FiClock, FiUsers, FiTrendingUp,
  FiX, FiCheck, FiStar, FiChevronDown, FiChevronUp, FiEye,
  FiCalendar, FiCreditCard, FiSearch, FiFilter
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// ─── DURATION LABEL HELPER ───
const durationLabel = (type, value) => {
  const labels = {
    daily: value === 1 ? '1 Day' : `${value} Days`,
    weekly: value === 1 ? '1 Week' : `${value} Weeks`,
    monthly: value === 1 ? '1 Month' : `${value} Months`,
    yearly: value === 1 ? '1 Year' : `${value} Years`
  };
  return labels[type] || `${value} ${type}`;
};

// ─── TAB BUTTONS ───
const TabButton = ({ active, label, icon: Icon, count, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
      active
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
    }`}
  >
    <Icon size={16} />
    {label}
    {count !== undefined && (
      <span className={`px-2 py-0.5 rounded-full text-xs ${
        active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// ─── MAIN COMPONENT ───
const VendorAdPlans = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subStats, setSubStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subFilter, setSubFilter] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    price: '',
    durationType: 'monthly',
    durationValue: 1,
    features: [''],
    badge: '',
    displayOrder: 0
  });

  // ─── FETCH DATA ───
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getVendorAdPlans();
      if (res.success) setPlans(res.data || []);
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const params = {};
      if (subFilter) params.status = subFilter;
      const res = await getVendorSubscriptions(params);
      if (res.success) {
        setSubscriptions(res.data || []);
        setSubStats(res.stats || {});
      }
    } catch (err) {
      toast.error('Failed to load subscriptions');
    }
  }, [subFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (activeTab === 'subscriptions') fetchSubscriptions();
  }, [activeTab, fetchSubscriptions]);

  // ─── HANDLERS ───
  const openCreateModal = () => {
    setCurrentPlan(null);
    setFormData({
      name: '', tagline: '', description: '', price: '',
      durationType: 'monthly', durationValue: 1,
      features: [''], badge: '', displayOrder: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setCurrentPlan(plan);
    setFormData({
      name: plan.name,
      tagline: plan.tagline || '',
      description: plan.description || '',
      price: plan.price,
      durationType: plan.durationType,
      durationValue: plan.durationValue,
      features: plan.features?.length > 0 ? [...plan.features] : [''],
      badge: plan.badge || '',
      displayOrder: plan.displayOrder || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        durationValue: Number(formData.durationValue),
        displayOrder: Number(formData.displayOrder),
        features: formData.features.filter(f => f.trim())
      };

      if (currentPlan) {
        const res = await updateVendorAdPlan(currentPlan._id, payload);
        if (res.success) {
          toast.success('Plan updated successfully');
          fetchPlans();
        }
      } else {
        const res = await createVendorAdPlan(payload);
        if (res.success) {
          toast.success('Plan created successfully');
          fetchPlans();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await deleteVendorAdPlan(planId);
      if (res.success) {
        toast.success('Plan deleted');
        fetchPlans();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleToggle = async (planId) => {
    try {
      const res = await toggleVendorAdPlan(planId);
      if (res.success) {
        toast.success(res.message);
        fetchPlans();
      }
    } catch (err) {
      toast.error('Failed to toggle plan status');
    }
  };

  const addFeature = () => setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  const removeFeature = (idx) => setFormData(prev => ({
    ...prev,
    features: prev.features.filter((_, i) => i !== idx)
  }));
  const updateFeature = (idx, val) => setFormData(prev => ({
    ...prev,
    features: prev.features.map((f, i) => i === idx ? val : f)
  }));

  // ─── FILTERED SUBSCRIPTIONS ───
  const filteredSubs = subscriptions.filter(sub => {
    if (!subSearch) return true;
    const q = subSearch.toLowerCase();
    const vendorName = sub.vendorId?.name?.toLowerCase() || '';
    const vendorEmail = sub.vendorId?.email?.toLowerCase() || '';
    const planName = sub.planSnapshot?.name?.toLowerCase() || '';
    return vendorName.includes(q) || vendorEmail.includes(q) || planName.includes(q);
  });

  // ─── RENDER: PLANS TAB ───
  const renderPlansTab = () => (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Vendor Advertisement Plans</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage subscription plans for vendor shop advertisements</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <FiPlus size={16} /> Create New Plan
        </button>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FiPackage size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No Plans Created Yet</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first vendor advertisement plan</p>
          <button onClick={openCreateModal} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            <FiPlus className="inline mr-1" /> Create Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan._id} className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${plan.isActive ? 'border-gray-200' : 'border-red-200 opacity-75'}`}>
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                  {plan.badge}
                </div>
              )}
              {!plan.isActive && (
                <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  INACTIVE
                </div>
              )}

              {/* Plan Header */}
              <div className="p-6 pb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                {plan.tagline && <p className="text-sm text-gray-500 mt-1">{plan.tagline}</p>}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-indigo-600">₹{plan.price.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-gray-400">/ {durationLabel(plan.durationType, plan.durationValue)}</span>
                </div>
              </div>

              {/* Features */}
              <div className="px-6 pb-4">
                {plan.features?.length > 0 && (
                  <div className="space-y-2">
                    {plan.features.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="px-6 pb-4 flex gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><FiUsers size={12} /> {plan.totalPurchases} purchases</span>
                <span className="flex items-center gap-1"><FiDollarSign size={12} /> ₹{(plan.totalRevenue || 0).toLocaleString('en-IN')}</span>
              </div>

              {/* Actions */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggle(plan._id)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    plan.isActive ? 'text-green-600 hover:text-green-700' : 'text-red-500 hover:text-red-600'
                  }`}
                >
                  {plan.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                  {plan.isActive ? 'Active' : 'Inactive'}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(plan)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <FiEdit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(plan._id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── RENDER: SUBSCRIPTIONS TAB ───
  const renderSubscriptionsTab = () => (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FiUsers className="text-green-600" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{subStats.activeSubscriptions || 0}</p>
              <p className="text-xs text-gray-500">Active Subscriptions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FiTrendingUp className="text-indigo-600" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">₹{(subStats.totalRevenue || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiCreditCard className="text-purple-600" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{subStats.totalSubscriptions || 0}</p>
              <p className="text-xs text-gray-500">Total Subscriptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by vendor name, email, or plan..."
            value={subSearch}
            onChange={(e) => setSubSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Vendor</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Plan</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Duration</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Expiry</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No subscriptions found</td></tr>
              ) : filteredSubs.map(sub => {
                const isActive = sub.status === 'ACTIVE';
                const isExpired = sub.status === 'EXPIRED';
                const daysLeft = isActive ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

                return (
                  <tr key={sub._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {(sub.vendorId?.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{sub.vendorId?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{sub.vendorId?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-700">{sub.planSnapshot?.name || 'N/A'}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-800">₹{(sub.totalAmount || 0).toLocaleString('en-IN')}</span>
                      {sub.gstAmount > 0 && <p className="text-xs text-gray-400">incl. ₹{sub.gstAmount} GST</p>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {durationLabel(sub.planSnapshot?.durationType, sub.planSnapshot?.durationValue)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isActive ? 'bg-green-100 text-green-700' :
                        isExpired ? 'bg-red-100 text-red-700' :
                        sub.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {isActive ? (
                        <span className="text-green-600 font-medium">{daysLeft}d left</span>
                      ) : (
                        new Date(sub.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {sub.paymentMethod === 'admin_granted' ? (
                        <span className="text-purple-600 font-medium">Admin Granted</span>
                      ) : (
                        sub.razorpayPaymentId ? sub.razorpayPaymentId.slice(0, 14) + '...' : '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ─── RENDER: CREATE/EDIT MODAL ───
  const renderModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-gray-800">
            {currentPlan ? 'Edit Plan' : 'Create New Plan'}
          </h3>
          <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Plan Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Starter, Gold Store, Platinum"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="e.g. Best for new vendors"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Price + Duration Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="499"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration Type *</label>
              <select
                value={formData.durationType}
                onChange={(e) => setFormData(prev => ({ ...prev, durationType: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="daily">Per Day</option>
                <option value="weekly">Per Week</option>
                <option value="monthly">Per Month</option>
                <option value="yearly">Per Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration Value *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.durationValue}
                onChange={(e) => setFormData(prev => ({ ...prev, durationValue: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this plan offers..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Features</label>
            <div className="space-y-2">
              {formData.features.map((f, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={f}
                    onChange={(e) => updateFeature(idx, e.target.value)}
                    placeholder={`Feature ${idx + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  {formData.features.length > 1 && (
                    <button type="button" onClick={() => removeFeature(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <FiX size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addFeature} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                <FiPlus size={14} /> Add Feature
              </button>
            </div>
          </div>

          {/* Badge + Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Badge Label</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                placeholder="e.g. POPULAR, BEST VALUE"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Order</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200">
              {currentPlan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Vendor Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">Manage advertisement plans and vendor subscriptions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        <TabButton active={activeTab === 'plans'} label="Plans" icon={FiPackage} count={plans.length} onClick={() => setActiveTab('plans')} />
        <TabButton active={activeTab === 'subscriptions'} label="Subscriptions" icon={FiUsers} count={subStats.activeSubscriptions} onClick={() => setActiveTab('subscriptions')} />
      </div>

      {/* Tab Content */}
      {activeTab === 'plans' ? renderPlansTab() : renderSubscriptionsTab()}

      {/* Modal */}
      {isModalOpen && renderModal()}
    </div>
  );
};

export default VendorAdPlans;
