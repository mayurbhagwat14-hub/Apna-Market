import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import vendorSubscriptionService from '../../services/vendorSubscriptionService';
import { toast } from 'react-hot-toast';
import {
  FiCheck, FiClock, FiCreditCard, FiShield, FiStar, FiTrendingUp,
  FiArrowLeft, FiCalendar, FiAlertCircle, FiZap, FiAward, FiRefreshCw
} from 'react-icons/fi';

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
      bg: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600',
      text: 'text-white',
      subtext: 'text-white/70',
      border: 'border-transparent',
      checkBg: 'bg-white/20',
      checkText: 'text-white',
      btnBg: 'bg-white',
      btnText: 'text-indigo-700',
      shadow: 'shadow-2xl shadow-indigo-300/50',
      ring: 'ring-2 ring-indigo-400/30'
    };
  }
  const styles = [
    {
      bg: 'bg-white',
      text: 'text-gray-900',
      subtext: 'text-gray-500',
      border: 'border-gray-200',
      checkBg: 'bg-indigo-100',
      checkText: 'text-indigo-600',
      btnBg: 'bg-indigo-600',
      btnText: 'text-white',
      shadow: 'shadow-lg',
      ring: ''
    },
    {
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      text: 'text-amber-900',
      subtext: 'text-amber-700/70',
      border: 'border-amber-200',
      checkBg: 'bg-amber-200/50',
      checkText: 'text-amber-700',
      btnBg: 'bg-amber-600',
      btnText: 'text-white',
      shadow: 'shadow-lg shadow-amber-200/50',
      ring: ''
    },
    {
      bg: 'bg-gradient-to-br from-slate-800 to-slate-900',
      text: 'text-white',
      subtext: 'text-slate-400',
      border: 'border-slate-700',
      checkBg: 'bg-white/10',
      checkText: 'text-white',
      btnBg: 'bg-white',
      btnText: 'text-slate-900',
      shadow: 'shadow-2xl shadow-slate-500/30',
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

      const { orderId, amount, currency, keyId, vendorName, vendorEmail, vendorPhone, subscriptionId, breakdown } = orderRes.data;

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
          color: '#4F46E5'
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
              toast.success('🎉 Subscription activated! Your shop is now advertised.');
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

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Shop Subscription</h1>
            <p className="text-xs text-gray-500">Advertise your shop on Apna Market</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ─── ACTIVE SUBSCRIPTION CARD ─── */}
        {hasActive && subscription && (
          <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-xl shadow-green-200/40">
            <div className="flex items-center gap-2 mb-3">
              <FiShield size={20} />
              <span className="font-bold text-sm">Active Subscription</span>
              <span className="ml-auto px-3 py-1 bg-white/20 rounded-full text-xs font-bold">LIVE</span>
            </div>

            <h3 className="text-xl font-extrabold mb-1">{subscription.planSnapshot?.name}</h3>
            <p className="text-white/70 text-sm mb-4">Your shop is being advertised on Apna Market</p>

            {/* Time Remaining */}
            <div className="bg-white/10 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm">Time Remaining</span>
                <span className="font-bold">
                  {remainingDays > 0 ? `${remainingDays} Days` : ''}{remainingDays > 0 && remainingHours > 0 ? ' ' : ''}{remainingHours > 0 ? `${remainingHours}h` : ''}
                  {remainingDays === 0 && remainingHours === 0 ? 'Expiring soon' : ''}
                </span>
              </div>
              {/* Progress Bar */}
              {(() => {
                const totalMs = new Date(subscription.endDate) - new Date(subscription.startDate);
                const elapsedMs = new Date() - new Date(subscription.startDate);
                const percent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
                return (
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white rounded-full h-2 transition-all duration-500" style={{ width: `${100 - percent}%` }}></div>
                  </div>
                );
              })()}
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1"><FiCalendar size={12} /> Started: {new Date(subscription.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <span className="flex items-center gap-1"><FiClock size={12} /> Expires: {new Date(subscription.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <span className="flex items-center gap-1"><FiCreditCard size={12} /> Paid: ₹{subscription.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* ─── NO SUBSCRIPTION WARNING ─── */}
        {!hasActive && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiAlertCircle className="text-amber-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">Your shop is not being advertised</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Subscribe to a plan below to advertise your shop on Apna Market and get more customers!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── PLANS SECTION ─── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FiZap className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">
              {hasActive ? 'Upgrade or Renew' : 'Choose a Plan'}
            </h2>
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <FiAlertCircle size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No subscription plans available right now.</p>
              <p className="text-sm text-gray-400 mt-1">Please check back later.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan, idx) => {
                const style = getPlanStyle(idx, plan.badge);
                const isCurrentPlan = hasActive && subscription?.planId === plan._id;
                const gstAmount = parseFloat(((plan.price * 18) / 100).toFixed(2));
                const totalAmount = parseFloat((plan.price + gstAmount).toFixed(2));

                return (
                  <div
                    key={plan._id}
                    className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${style.bg} ${style.border} ${style.shadow} ${style.ring}`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg uppercase tracking-wider">
                        ⭐ {plan.badge}
                      </div>
                    )}

                    <div className="p-5">
                      {/* Plan Name & Tagline */}
                      <h3 className={`text-xl font-extrabold ${style.text}`}>{plan.name}</h3>
                      {plan.tagline && <p className={`text-sm mt-0.5 ${style.subtext}`}>{plan.tagline}</p>}

                      {/* Price */}
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className={`text-3xl font-extrabold ${style.text}`}>₹{plan.price.toLocaleString('en-IN')}</span>
                        <span className={`text-sm ${style.subtext}`}>/ {durationLabel(plan.durationType, plan.durationValue)}</span>
                      </div>
                      <p className={`text-xs mt-1 ${style.subtext}`}>
                        + 18% GST = ₹{totalAmount.toLocaleString('en-IN')} total
                      </p>

                      {/* Features */}
                      {plan.features?.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {plan.features.map((f, fidx) => (
                            <div key={fidx} className="flex items-start gap-2.5">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${style.checkBg}`}>
                                <FiCheck size={11} className={style.checkText} />
                              </div>
                              <span className={`text-sm ${style.text} opacity-90`}>{f}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Purchase Button */}
                      <button
                        onClick={() => handlePurchase(plan)}
                        disabled={purchasing === plan._id}
                        className={`w-full mt-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${style.btnBg} ${style.btnText} ${
                          purchasing === plan._id ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98]'
                        }`}
                      >
                        {purchasing === plan._id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            Processing...
                          </span>
                        ) : isCurrentPlan ? (
                          <span className="flex items-center justify-center gap-2"><FiRefreshCw size={14} /> Renew Plan</span>
                        ) : (
                          <span className="flex items-center justify-center gap-2"><FiCreditCard size={14} /> Subscribe Now — ₹{totalAmount.toLocaleString('en-IN')}</span>
                        )}
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
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FiClock size={18} /> Subscription History
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {history.map((sub, idx) => {
                const isActive = sub.status === 'ACTIVE';
                return (
                  <div key={sub._id} className={`px-5 py-4 flex items-center justify-between ${idx < history.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-green-100' : sub.status === 'EXPIRED' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {isActive ? <FiShield className="text-green-600" size={16} /> :
                         sub.status === 'EXPIRED' ? <FiClock className="text-red-500" size={16} /> :
                         <FiAlertCircle className="text-gray-500" size={16} />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{sub.planSnapshot?.name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(sub.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {new Date(sub.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800 text-sm">₹{(sub.totalAmount || 0).toLocaleString('en-IN')}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-green-100 text-green-700' :
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

        {/* Footer Info */}
        <div className="text-center pb-8">
          <p className="text-xs text-gray-400">
            All payments are securely processed via Razorpay. GST @18% applicable.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Subscriptions are non-refundable. Contact support for any issues.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorSubscription;
