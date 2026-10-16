import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import vendorSubscriptionService from '../../services/vendorSubscriptionService';
import { toast } from 'react-hot-toast';
import {
  FiCheck, FiClock, FiCreditCard, FiShield, FiStar, FiTrendingUp,
  FiArrowLeft, FiCalendar, FiAlertCircle, FiZap, FiAward, FiRefreshCw,
  FiPhoneCall, FiEye, FiCheckCircle
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

// ─── DURATION LABEL ───
const durationLabel = (type, value) => {
  const labels = {
    daily: value === 1 ? '1 Day' : `${value} Days`,
    weekly: value === 1 ? '1 Week' : `${value} Weeks`,
    monthly: value === 1 ? '1 Month' : `${value} Months`,
    yearly: value === 1 ? '1 Year' : `${value} Years`
  };
  return labels[type] || `${value} ${type}`;
};

// ─── PLAN CARD GRADIENT STYLES ───
const getPlanStyle = (index, badge) => {
  const badgeLower = (badge || '').toLowerCase();
  if (badgeLower.includes('popular') || badgeLower.includes('best')) {
    return {
      bg: 'bg-gradient-to-br from-emerald-800 via-teal-800 to-[#016A54]',
      text: 'text-white',
      subtext: 'text-white/80',
      border: 'border-emerald-600/50',
      checkBg: 'bg-white/20',
      checkText: 'text-white',
      btnBg: 'bg-white',
      btnText: 'text-[#016A54]',
      shadow: 'shadow-2xl shadow-emerald-950/20',
      ring: 'ring-2 ring-emerald-400/40'
    };
  }
  const styles = [
    {
      bg: 'bg-white',
      text: 'text-gray-900',
      subtext: 'text-gray-500',
      border: 'border-gray-200',
      checkBg: 'bg-emerald-100',
      checkText: 'text-[#016A54]',
      btnBg: 'bg-[#016A54]',
      btnText: 'text-white',
      shadow: 'shadow-md',
      ring: ''
    },
    {
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      text: 'text-amber-950',
      subtext: 'text-amber-800/80',
      border: 'border-amber-200',
      checkBg: 'bg-amber-200/60',
      checkText: 'text-amber-800',
      btnBg: 'bg-amber-600',
      btnText: 'text-white',
      shadow: 'shadow-md shadow-amber-200/50',
      ring: ''
    },
    {
      bg: 'bg-gradient-to-br from-slate-900 to-slate-950',
      text: 'text-white',
      subtext: 'text-slate-400',
      border: 'border-slate-800',
      checkBg: 'bg-white/10',
      checkText: 'text-white',
      btnBg: 'bg-white',
      btnText: 'text-slate-950',
      shadow: 'shadow-xl shadow-slate-900/30',
      ring: ''
    }
  ];
  return styles[index % styles.length];
};

const VendorSubscription = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [hasActive, setHasActive] = useState(false);
  const [remainingDays, setRemainingDays] = useState(0);
  const [remainingHours, setRemainingHours] = useState(0);
  const [history, setHistory] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ─── FETCH DATA ───
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansRes, subRes] = await Promise.all([
        vendorSubscriptionService.getPlans(),
        vendorSubscriptionService.getMySubscription()
      ]);

      if (plansRes.success) setPlans(plansRes.data || []);
      if (subRes.success) {
        setHasActive(subRes.data.hasActiveSubscription);
        setSubscription(subRes.data.activeSubscription);
        setRemainingDays(subRes.data.remainingDays || 0);
        setRemainingHours(subRes.data.remainingHours || 0);
        setHistory(subRes.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── RAZORPAY PAYMENT HANDLER ───
  const handlePurchase = async (plan) => {
    try {
      setPurchasing(plan._id);

      // Step 1: Create Razorpay order
      const orderRes = await vendorSubscriptionService.createOrder(plan._id);
      if (!orderRes.success) {
        toast.error(orderRes.message || 'Failed to create order');
        setPurchasing(null);
        return;
      }

      const { orderId, amount, currency, keyId, vendorName, vendorEmail, vendorPhone, subscriptionId } = orderRes.data;

      // If keyId is not provided or razorpay script fails, offer quick test activation
      if (!keyId || keyId.includes('YOUR_') || keyId === '') {
        const confirmTest = window.confirm(
          `Razorpay Key ID is not configured on this server.\nWould you like to activate "${plan.name}" instantly in test mode?`
        );
        if (confirmTest) {
          await handleTestActivate(plan._id);
          return;
        }
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Apna Market',
        description: `${plan.name} - Shop Advertisement Plan`,
        order_id: orderId,
        prefill: {
          name: vendorName,
          email: vendorEmail,
          contact: vendorPhone
        },
        notes: {
          type: 'vendor_subscription',
          planName: plan.name,
          planId: plan._id
        },
        theme: {
          color: '#016A54'
        },
        handler: async (response) => {
          try {
            // Step 3: Verify payment
            const verifyRes = await vendorSubscriptionService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              subscriptionId
            });

            if (verifyRes.success) {
              toast.success('🎉 Subscription activated! Your shop is now promoted in User App.');
              fetchData();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            toast.error('Payment verification failed');
          } finally {
            setPurchasing(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPurchasing(null);
            toast('Payment cancelled', { icon: '⚠️' });
          }
        }
      };

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error('Purchase error:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setPurchasing(null);
    }
  };

  // ─── TEST MODE INSTANT ACTIVATION ───
  const handleTestActivate = async (planId) => {
    try {
      setPurchasing(planId);
      const res = await vendorSubscriptionService.activateTest(planId);
      if (res.success) {
        toast.success('🎉 Subscription activated! Your shop is now advertised.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate plan');
    } finally {
      setPurchasing(null);
    }
  };

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#016A54] mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading subscription marketing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-900">Marketing & Subscription</h1>
              <p className="text-xs text-gray-500">Promote your shop & get customer leads on Apna Market</p>
            </div>
          </div>
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#016A54] text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <FiEye size={14} /> Preview User App
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ─── ACTIVE SUBSCRIPTION CARD ─── */}
        {hasActive && subscription && (
          <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-[#016A54] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <FiShield size={20} className="text-emerald-300" />
              <span className="font-bold text-sm tracking-wide">ACTIVE PROMOTION PLAN</span>
              <span className="ml-auto px-3 py-0.5 bg-emerald-400/30 text-white border border-emerald-300/40 rounded-full text-xs font-black animate-pulse">
                LIVE ON APP
              </span>
            </div>

            <h3 className="text-2xl font-black mb-1">{subscription.planSnapshot?.name}</h3>
            <p className="text-white/80 text-sm mb-4">
              Your store is highlighted on the Apna Market User App with priority ranking and verified badge!
            </p>

            {/* Time Remaining Bar */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 mb-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-xs font-bold uppercase tracking-wider">Validity Countdown</span>
                <span className="font-black text-sm">
                  {remainingDays > 0 ? `${remainingDays} Days` : ''}{remainingDays > 0 && remainingHours > 0 ? ' ' : ''}{remainingHours > 0 ? `${remainingHours}h` : ''}
                  {remainingDays === 0 && remainingHours === 0 ? 'Expiring today' : ''} left
                </span>
              </div>
              {(() => {
                const totalMs = new Date(subscription.endDate) - new Date(subscription.startDate);
                const elapsedMs = new Date() - new Date(subscription.startDate);
                const percent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
                return (
                  <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-300 rounded-full h-2.5 transition-all duration-500" style={{ width: `${Math.max(5, 100 - percent)}%` }}></div>
                  </div>
                );
              })()}
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-white/80">
              <span className="flex items-center gap-1.5">
                <FiCalendar size={13} /> Started: {new Date(subscription.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <FiClock size={13} /> Expires: {new Date(subscription.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <FiCreditCard size={13} /> Plan Price: ₹{subscription.totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* ─── HOW THIS GROWS YOUR BUSINESS INFO BANNER ─── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">
            How Apna Market Subscription Helps Your Shop
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
              <p className="text-xs font-bold text-gray-900">Featured Placement</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Showcase on User App home screen carousel</p>
            </div>
            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
              <p className="text-xs font-bold text-gray-900">Search Rank Boost</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Appear #1 when customers search nearby shops</p>
            </div>
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
              <p className="text-xs font-bold text-gray-900">Verified Badge</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Instill trust with official partner badge</p>
            </div>
            <div className="bg-teal-50/60 p-3.5 rounded-xl border border-teal-100">
              <p className="text-xs font-bold text-gray-900">Direct Contact</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Customers can call and WhatsApp you directly</p>
            </div>
          </div>
        </div>

        {/* ─── PLANS SECTION ─── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900">
              {hasActive ? 'Upgrade or Renew Subscription' : 'Available Subscription Packages'}
            </h2>
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-xs">
              <FiAlertCircle size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No subscription plans available right now.</p>
              <p className="text-xs text-gray-400 mt-1">Please check back soon or contact support.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {plans.map((plan, idx) => {
                const style = getPlanStyle(idx, plan.badge);
                const isCurrentPlan = hasActive && subscription?.planId === plan._id;
                const gstAmount = parseFloat(((plan.price * 18) / 100).toFixed(2));
                const totalAmount = parseFloat((plan.price + gstAmount).toFixed(2));
                const perks = plan.perks || {
                  featuredOnHome: true,
                  priorityRanking: true,
                  verifiedBadge: true,
                  directContact: true
                };

                return (
                  <div
                    key={plan._id}
                    className={`relative rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col justify-between ${style.bg} ${style.border} ${style.shadow} ${style.ring}`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black rounded-full shadow-lg uppercase tracking-wider">
                        {plan.badge}
                      </div>
                    )}

                    <div className="p-6">
                      {/* Plan Name & Tagline */}
                      <h3 className={`text-xl font-black ${style.text}`}>{plan.name}</h3>
                      {plan.tagline && <p className={`text-xs mt-0.5 font-medium ${style.subtext}`}>{plan.tagline}</p>}

                      {/* Price */}
                      <div className="mt-4 flex items-baseline gap-1.5">
                        <span className={`text-3xl font-black ${style.text}`}>₹{plan.price.toLocaleString('en-IN')}</span>
                        <span className={`text-xs font-bold ${style.subtext}`}>/ {durationLabel(plan.durationType, plan.durationValue)}</span>
                      </div>
                      <p className={`text-[11px] mt-1 ${style.subtext}`}>
                        + 18% GST (₹{gstAmount}) = ₹{totalAmount.toLocaleString('en-IN')} total
                      </p>

                      {/* Marketing Perks Highlights */}
                      <div className="mt-4 pt-3 border-t border-black/10 space-y-1.5">
                        <p className={`text-[10px] font-black uppercase tracking-wider opacity-75 ${style.text}`}>
                          Included Marketing Benefits:
                        </p>
                        {perks.featuredOnHome && (
                          <div className={`text-xs font-semibold ${style.text}`}>
                            • Featured on User Home Page
                          </div>
                        )}
                        {perks.priorityRanking && (
                          <div className={`text-xs font-semibold ${style.text}`}>
                            • Priority Search Rank Boost
                          </div>
                        )}
                        {perks.verifiedBadge && (
                          <div className={`text-xs font-semibold ${style.text}`}>
                            • Verified Partner Badge
                          </div>
                        )}
                        {perks.directContact && (
                          <div className={`text-xs font-semibold ${style.text}`}>
                            • Direct Call & WhatsApp Lead Buttons
                          </div>
                        )}
                      </div>

                      {/* Extra Features */}
                      {plan.features?.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-black/10 space-y-1.5">
                          {plan.features.map((f, fidx) => (
                            <div key={fidx} className="flex items-start gap-2">
                              <FiCheck size={12} className={`mt-0.5 shrink-0 ${style.checkText}`} />
                              <span className={`text-xs ${style.text} opacity-90`}>{f}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Purchase Buttons */}
                    <div className="p-6 pt-0 space-y-2">
                      <button
                        type="button"
                        onClick={() => handlePurchase(plan)}
                        disabled={purchasing === plan._id}
                        className={`w-full py-3 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer shadow-md ${style.btnBg} ${style.btnText} ${
                          purchasing === plan._id ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-95 active:scale-[0.98]'
                        }`}
                      >
                        {purchasing === plan._id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            Processing...
                          </span>
                        ) : isCurrentPlan ? (
                          <span className="flex items-center justify-center gap-2">
                            <FiRefreshCw size={14} /> Renew Plan — ₹{totalAmount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <FiCreditCard size={14} /> Pay & Subscribe — ₹{totalAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </button>

                      {/* Fast Test Mode Button */}
                      <button
                        type="button"
                        onClick={() => handleTestActivate(plan._id)}
                        disabled={purchasing === plan._id}
                        className="w-full py-2 rounded-xl text-[11px] font-bold text-gray-500 hover:text-gray-900 bg-black/5 hover:bg-black/10 transition-colors cursor-pointer"
                      >
                        Instant Test Activate (Dev Mode)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── SUBSCRIPTION HISTORY ─── */}
        {history.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FiClock size={16} /> Past Invoices & History
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              {history.map((sub, idx) => {
                const isActive = sub.status === 'ACTIVE';
                return (
                  <div key={sub._id} className={`px-5 py-3.5 flex items-center justify-between ${idx < history.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-emerald-100 text-emerald-700' : sub.status === 'EXPIRED' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <FiShield size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-xs">{sub.planSnapshot?.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(sub.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {new Date(sub.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-xs">₹{(sub.totalAmount || 0).toLocaleString('en-IN')}</p>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-emerald-100 text-emerald-800' :
                        sub.status === 'EXPIRED' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ─── USER APP PREVIEW MODAL ─── */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-800 to-[#016A54] text-white p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Customer View in User App</h4>
                <p className="text-[11px] text-white/70">How your subscribed shop card looks</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-4 bg-neutral-100">
              {/* Mock Shop Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-2.5 shadow-md">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-200">
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80"
                    alt="Preview Shop"
                    className="w-full h-full object-cover"
                  />
                  {/* Featured Badge */}
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black shadow-md">
                    FEATURED STORE
                  </span>
                </div>

                <div className="pt-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-gray-900 truncate">Your Business Name</h3>
                    <FiCheckCircle className="text-emerald-600 shrink-0" size={14} title="Verified Partner" />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">Grocery & Daily Needs • 0.8 km</p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <FiStar size={12} className="fill-amber-400 text-amber-400" />
                      <span>4.9 (180+)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="p-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                        <FaWhatsapp size={14} />
                      </span>
                      <span className="p-1.5 rounded-full bg-teal-50 text-teal-700 font-bold text-xs">
                        <FiPhoneCall size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-white border border-neutral-200 text-center">
                <p className="text-xs text-emerald-800 font-bold">
                  ✓ Boosted to Position #1 in User Search
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Customers notice subscribed shops first, driving maximum calls and store walk-ins.
                </p>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-neutral-100 text-center">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-full py-2 bg-[#016A54] text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSubscription;
