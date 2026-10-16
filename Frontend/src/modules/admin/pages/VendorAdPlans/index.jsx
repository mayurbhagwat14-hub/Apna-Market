import React, { useState, useEffect, useCallback } from 'react';
import {
  getVendorAdPlans,
  createVendorAdPlan,
  updateVendorAdPlan,
  deleteVendorAdPlan,
  toggleVendorAdPlan,
  getVendorSubscriptions,
  grantVendorSubscription,
  cancelVendorSubscription,
  getVendorsListForAdmin
} from '../../services/vendorAdPlanService';
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiPackage, FiDollarSign, FiClock, FiUsers, FiTrendingUp,
  FiX, FiCheck, FiStar, FiChevronDown, FiChevronUp, FiEye,
  FiCalendar, FiCreditCard, FiSearch, FiFilter, FiAward,
  FiGift, FiSlash, FiZap, FiPhoneCall, FiBarChart2
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
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
      active
        ? 'bg-[#016A54] text-white shadow-lg shadow-[#016A54]/20'
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

const defaultPerks = {
  featuredOnHome: true,
  priorityRanking: true,
  verifiedBadge: true,
  directContact: true,
  analyticsAccess: true
};

const VendorAdPlans = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subStats, setSubStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Plan modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  // Grant modal
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [vendorsList, setVendorsList] = useState([]);
  const [grantFormData, setGrantFormData] = useState({
    vendorId: '',
    planId: '',
    note: ''
  });
  const [granting, setGranting] = useState(false);

  // Subscriptions search and filter
  const [subFilter, setSubFilter] = useState('');
  const [subSearch, setSubSearch] = useState('');

  // Plan Form State
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    price: '',
    durationType: 'monthly',
    durationValue: 1,
    features: [''],
    perks: { ...defaultPerks },
    badge: '',
    displayOrder: 0
  });

  // ─── FETCH PLANS ───
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

  // ─── FETCH SUBSCRIPTIONS ───
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

  // ─── FETCH VENDORS FOR GRANT MODAL ───
  const fetchVendorsList = useCallback(async () => {
    try {
      const res = await getVendorsListForAdmin();
      if (res.success) setVendorsList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (activeTab === 'subscriptions' || activeTab === 'insights') {
      fetchSubscriptions();
    }
  }, [activeTab, fetchSubscriptions]);

  // ─── MODAL HANDLERS ───
  const openCreateModal = () => {
    setCurrentPlan(null);
    setFormData({
      name: '',
      tagline: '',
      description: '',
      price: '',
      durationType: 'monthly',
      durationValue: 1,
      features: [
        'Top placement in User App Featured Stores',
        'Search & category ranking rank boost',
        'Official Verified Partner badge',
        'Direct WhatsApp & Call leads'
      ],
      perks: { ...defaultPerks },
      badge: 'POPULAR',
      displayOrder: 0
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
      perks: {
        featuredOnHome: plan.perks?.featuredOnHome ?? true,
        priorityRanking: plan.perks?.priorityRanking ?? true,
        verifiedBadge: plan.perks?.verifiedBadge ?? true,
        directContact: plan.perks?.directContact ?? true,
        analyticsAccess: plan.perks?.analyticsAccess ?? true
      },
      badge: plan.badge || '',
      displayOrder: plan.displayOrder || 0
    });
    setIsModalOpen(true);
  };

  const openGrantModal = () => {
    fetchVendorsList();
    setGrantFormData({
      vendorId: vendorsList[0]?._id || '',
      planId: plans[0]?._id || '',
      note: 'Complimentary trial granted by admin'
    });
    setIsGrantModalOpen(true);
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

  const handleGrantSubmit = async (e) => {
    e.preventDefault();
    if (!grantFormData.vendorId || !grantFormData.planId) {
      toast.error('Please select both a vendor and a plan');
      return;
    }
    try {
      setGranting(true);
      const res = await grantVendorSubscription(grantFormData);
      if (res.success) {
        toast.success(res.message || 'Subscription granted successfully');
        setIsGrantModalOpen(false);
        fetchSubscriptions();
        fetchPlans();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant subscription');
    } finally {
      setGranting(false);
    }
  };

  const handleCancelSub = async (subId) => {
    const reason = window.prompt('Enter reason for cancelling this subscription:', 'Admin cancellation');
    if (reason === null) return;
    try {
      const res = await cancelVendorSubscription(subId, reason);
      if (res.success) {
        toast.success('Subscription cancelled');
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel subscription');
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

  const togglePerk = (perkKey) => {
    setFormData(prev => ({
      ...prev,
      perks: {
        ...prev.perks,
        [perkKey]: !prev.perks[perkKey]
      }
    }));
  };

  // ─── FILTERED SUBSCRIPTIONS ───
  const filteredSubs = subscriptions.filter(sub => {
    if (!subSearch) return true;
    const q = subSearch.toLowerCase();
    const vendorName = sub.vendorId?.name?.toLowerCase() || '';
    const vendorBiz = sub.vendorId?.businessName?.toLowerCase() || '';
    const vendorEmail = sub.vendorId?.email?.toLowerCase() || '';
    const planName = sub.planSnapshot?.name?.toLowerCase() || '';
    return vendorName.includes(q) || vendorBiz.includes(q) || vendorEmail.includes(q) || planName.includes(q);
  });

  // ─── RENDER: PLANS TAB ───
  const renderPlansTab = () => (
    <div>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-[#016A54] rounded-2xl p-6 text-white mb-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
            Vendor Marketing Engine
          </div>
          <h2 className="text-2xl font-black">Shop Marketing & Promotion Plans</h2>
          <p className="text-white/80 text-sm mt-1">
            Create subscriptions that give vendors priority rankings, featured carousels, and verified badges on the Apna Market User App.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#016A54] rounded-xl text-sm font-bold hover:bg-neutral-100 transition-all shadow-md cursor-pointer"
          >
            <FiPlus size={16} /> Create Marketing Plan
          </button>
          <button
            onClick={openGrantModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold border border-white/20 transition-all cursor-pointer"
          >
            <FiGift size={16} /> Grant Complimentary Plan
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#016A54]"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <FiPackage size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No Marketing Plans Created Yet</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first vendor marketing plan to allow shops to promote in the User App</p>
          <button onClick={openCreateModal} className="mt-4 px-6 py-2.5 bg-[#016A54] text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 cursor-pointer">
            <FiPlus className="inline mr-1" /> Create Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map(plan => {
            const perks = plan.perks || defaultPerks;
            return (
              <div
                key={plan._id}
                className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col justify-between ${
                  plan.isActive ? 'border-gray-200' : 'border-red-200 opacity-75'
                }`}
              >
                {/* Top Badge */}
                {plan.badge && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-black rounded-full shadow-md">
                    {plan.badge}
                  </div>
                )}
                {!plan.isActive && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    INACTIVE
                  </div>
                )}

                {/* Plan Header */}
                <div className="p-6 pb-3">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {plan.tagline && <p className="text-xs text-gray-500 mt-0.5">{plan.tagline}</p>}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#016A54]">₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-sm font-semibold text-gray-400">/ {durationLabel(plan.durationType, plan.durationValue)}</span>
                  </div>
                  {plan.description && (
                    <p className="text-xs text-gray-600 mt-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                      {plan.description}
                    </p>
                  )}
                </div>

                {/* Marketing Perks Badge Row */}
                <div className="px-6 py-2 bg-emerald-50/60 border-y border-emerald-100 flex flex-wrap gap-1.5">
                  {perks.featuredOnHome && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Home Featured
                    </span>
                  )}
                  {perks.priorityRanking && (
                    <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                      Rank Boost
                    </span>
                  )}
                  {perks.verifiedBadge && (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Verified Badge
                    </span>
                  )}
                  {perks.directContact && (
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                      Direct Call/WA
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div className="px-6 py-4 space-y-2">
                  {plan.features?.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-medium text-gray-700">
                      <FiCheck className="text-emerald-600 mt-0.5 shrink-0" size={13} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Stats & Actions */}
                <div>
                  <div className="px-6 py-2 flex items-center justify-between text-xs text-gray-500 bg-gray-50/60 border-t border-gray-100">
                    <span className="flex items-center gap-1 font-semibold">
                      <FiUsers size={12} className="text-[#016A54]" /> {plan.totalPurchases || 0} Subscribed
                    </span>
                    <span className="flex items-center gap-1 font-bold text-gray-800">
                      <FiDollarSign size={12} className="text-emerald-600" /> ₹{(plan.totalRevenue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggle(plan._id)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        plan.isActive ? 'text-emerald-600 hover:text-emerald-700' : 'text-red-500 hover:text-red-600'
                      }`}
                    >
                      {plan.isActive ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                      {plan.isActive ? 'Active Plan' : 'Disabled'}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(plan)}
                        className="p-2 text-gray-600 hover:text-[#016A54] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Plan"
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(plan._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── RENDER: SUBSCRIPTIONS TAB ───
  const renderSubscriptionsTab = () => (
    <div>
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Active Vendor Subscriptions</h2>
          <p className="text-xs text-gray-500">Monitor active shop marketing subscriptions and grant complimentary plans</p>
        </div>
        <button
          onClick={openGrantModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#016A54] text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
        >
          <FiGift size={15} /> Grant Subscription to Vendor
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FiUsers className="text-emerald-700" size={18} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{subStats.activeSubscriptions || 0}</p>
              <p className="text-xs font-semibold text-gray-500">Active Advertised Vendors</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FiTrendingUp className="text-indigo-600" size={18} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">₹{(subStats.totalRevenue || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs font-semibold text-gray-500">Total Subscription Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiCreditCard className="text-purple-600" size={18} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{subStats.totalSubscriptions || 0}</p>
              <p className="text-xs font-semibold text-gray-500">All Time Subscriptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search vendor name, shop, email, or plan..."
            value={subSearch}
            onChange={(e) => setSubSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54] bg-white"
          />
        </div>
        <select
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54] bg-white font-medium"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase font-bold text-gray-600">
              <tr>
                <th className="px-5 py-3.5">Vendor / Shop</th>
                <th className="px-5 py-3.5">Marketing Plan</th>
                <th className="px-5 py-3.5">Paid Amount</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Validity</th>
                <th className="px-5 py-3.5">Payment Method</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 font-medium">
                    No subscriptions found
                  </td>
                </tr>
              ) : filteredSubs.map(sub => {
                const isActive = sub.status === 'ACTIVE';
                const isExpired = sub.status === 'EXPIRED';
                const daysLeft = isActive ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

                return (
                  <tr key={sub._id} className="hover:bg-neutral-50/80 transition-colors">
                    {/* Vendor Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#016A54] font-black flex items-center justify-center text-xs shrink-0">
                          {(sub.vendorId?.businessName || sub.vendorId?.name || 'V')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">
                            {sub.vendorId?.businessName || sub.vendorId?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-400">{sub.vendorId?.email || sub.vendorId?.phone || ''}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan Name */}
                    <td className="px-5 py-4">
                      <span className="font-bold text-gray-800">{sub.planSnapshot?.name || 'Standard'}</span>
                      {sub.planSnapshot?.badge && (
                        <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                          {sub.planSnapshot.badge}
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 font-bold text-gray-900">
                      ₹{(sub.totalAmount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Duration */}
                    <td className="px-5 py-4 text-xs font-semibold text-gray-600">
                      {durationLabel(sub.planSnapshot?.durationType, sub.planSnapshot?.durationValue)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        isActive ? 'bg-emerald-100 text-emerald-800' :
                        isExpired ? 'bg-red-100 text-red-700' :
                        sub.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {sub.status}
                      </span>
                    </td>

                    {/* Validity */}
                    <td className="px-5 py-4 text-xs">
                      {isActive ? (
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {daysLeft} days left
                        </span>
                      ) : (
                        <span className="text-gray-500">
                          {new Date(sub.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </td>

                    {/* Payment Method */}
                    <td className="px-5 py-4 text-xs font-semibold">
                      {sub.paymentMethod === 'admin_granted' ? (
                        <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Admin Granted
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          Razorpay
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => handleCancelSub(sub._id)}
                          className="text-xs text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
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

  // ─── RENDER: PLAN MODAL (CREATE / EDIT) ───
  const renderPlanModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-lg font-black text-gray-900">
              {currentPlan ? 'Edit Marketing Plan' : 'Create New Marketing Plan'}
            </h3>
            <p className="text-xs text-gray-500">Set pricing and User App promotional perks for vendors</p>
          </div>
          <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Plan Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Plan Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Gold Store Boost, Platinum Leader"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54]"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="e.g. 5x Your Daily Store Visibility & Walk-ins"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54]"
            />
          </div>

          {/* Price + Duration Type + Duration Value */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="499"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Duration Type *</label>
              <select
                value={formData.durationType}
                onChange={(e) => setFormData(prev => ({ ...prev, durationType: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54] bg-white font-medium"
              >
                <option value="daily">Per Day</option>
                <option value="weekly">Per Week</option>
                <option value="monthly">Per Month</option>
                <option value="yearly">Per Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Duration Value *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.durationValue}
                onChange={(e) => setFormData(prev => ({ ...prev, durationValue: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54]"
              />
            </div>
          </div>

          {/* Marketing Perks Section */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-3">
              User App Marketing Perks
            </h4>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.perks.featuredOnHome}
                  onChange={() => togglePerk('featuredOnHome')}
                  className="w-4 h-4 text-[#016A54] rounded focus:ring-[#016A54]"
                />
                <span className="text-xs font-bold text-gray-800">
                  Featured on User Home Page Carousel & Top Stores
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.perks.priorityRanking}
                  onChange={() => togglePerk('priorityRanking')}
                  className="w-4 h-4 text-[#016A54] rounded focus:ring-[#016A54]"
                />
                <span className="text-xs font-bold text-gray-800">
                  Priority Ranking in Search Results & Category Browsing
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.perks.verifiedBadge}
                  onChange={() => togglePerk('verifiedBadge')}
                  className="w-4 h-4 text-[#016A54] rounded focus:ring-[#016A54]"
                />
                <span className="text-xs font-bold text-gray-800">
                  Verified Partner Badge on Shop Card
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.perks.directContact}
                  onChange={() => togglePerk('directContact')}
                  className="w-4 h-4 text-[#016A54] rounded focus:ring-[#016A54]"
                />
                <span className="text-xs font-bold text-gray-800">
                  Direct WhatsApp & Quick Call Highlight in User App
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.perks.analyticsAccess}
                  onChange={() => togglePerk('analyticsAccess')}
                  className="w-4 h-4 text-[#016A54] rounded focus:ring-[#016A54]"
                />
                <span className="text-xs font-bold text-gray-800">
                  Store Impression & View Tracking Analytics
                </span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Explain how this plan helps the vendor grow..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54] resize-none"
            />
          </div>

          {/* Features Bullets */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Display Features (Bullets)</label>
            <div className="space-y-2">
              {formData.features.map((f, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={f}
                    onChange={(e) => updateFeature(idx, e.target.value)}
                    placeholder={`Bullet ${idx + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54]"
                  />
                  {formData.features.length > 1 && (
                    <button type="button" onClick={() => removeFeature(idx)} className="p-2 text-red-400 hover:text-red-600 rounded-lg cursor-pointer">
                      <FiX size={15} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-xs font-bold text-[#016A54] hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                <FiPlus size={14} /> Add Another Feature
              </button>
            </div>
          </div>

          {/* Badge & Display Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Badge Label</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                placeholder="e.g. POPULAR, BEST VALUE"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Display Order</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-2.5 bg-[#016A54] text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md cursor-pointer"
            >
              {currentPlan ? 'Update Plan' : 'Save & Publish Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── RENDER: GRANT MODAL ───
  const renderGrantModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900">Grant Subscription to Vendor</h3>
            <p className="text-xs text-gray-500">Provide complimentary marketing plan to any vendor</p>
          </div>
          <button type="button" onClick={() => setIsGrantModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleGrantSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Select Vendor *</label>
            <select
              required
              value={grantFormData.vendorId}
              onChange={(e) => setGrantFormData(prev => ({ ...prev, vendorId: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54] bg-white font-medium"
            >
              <option value="">-- Choose a vendor --</option>
              {vendorsList.map(v => (
                <option key={v._id} value={v._id}>
                  {v.businessName || v.name} ({v.phone || v.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Select Plan *</label>
            <select
              required
              value={grantFormData.planId}
              onChange={(e) => setGrantFormData(prev => ({ ...prev, planId: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54] bg-white font-medium"
            >
              <option value="">-- Choose a plan --</option>
              {plans.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} - ₹{p.price} ({durationLabel(p.durationType, p.durationValue)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Admin Note</label>
            <textarea
              value={grantFormData.note}
              onChange={(e) => setGrantFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="e.g. Free 30-day marketing trial offered by admin"
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#016A54] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsGrantModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={granting}
              className="flex-1 px-4 py-2.5 bg-[#016A54] text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md cursor-pointer disabled:opacity-50"
            >
              {granting ? 'Granting...' : 'Grant Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Vendor Marketing Subscriptions</h1>
          <p className="text-xs text-gray-500 mt-1">
            Build and manage promotional packages for local shops to get prominent visibility in the User App
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        <TabButton
          active={activeTab === 'plans'}
          label="Marketing Plans"
          icon={FiPackage}
          count={plans.length}
          onClick={() => setActiveTab('plans')}
        />
        <TabButton
          active={activeTab === 'subscriptions'}
          label="Active Subscriptions"
          icon={FiUsers}
          count={subStats.activeSubscriptions}
          onClick={() => setActiveTab('subscriptions')}
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'plans' ? renderPlansTab() : renderSubscriptionsTab()}

      {/* Modals */}
      {isModalOpen && renderPlanModal()}
      {isGrantModalOpen && renderGrantModal()}
    </div>
  );
};

export default VendorAdPlans;
