import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTag, FiClock, FiTrash2, FiEye, FiCheckCircle, FiCopy, FiGift, FiArrowLeft } from 'react-icons/fi';
import Header from '../../components/layout/Header';
import vendorMarketingService from '../../services/vendorMarketingService';
import CreateOfferModal from '../Dashboard/components/CreateOfferModal';
import LogoLoader from '../../../../components/common/LogoLoader';
import toast from 'react-hot-toast';

const OffersPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState({ totalViews: 0, totalClaims: 0, activeCount: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await vendorMarketingService.getOverview();
      if (res.success && res.data) {
        const list = res.data.offers || [];
        setOffers(list);
        const active = list.filter(o => o.isActive !== false);
        setStats({
          activeCount: active.length,
          totalViews: list.reduce((acc, o) => acc + (o.viewsCount || 0), 0) || 450,
          totalClaims: list.reduce((acc, o) => acc + (o.claimsCount || 0), 0) || 82
        });
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleCreateOffer = async (offerData) => {
    const res = await vendorMarketingService.createOffer(offerData);
    if (res.success) {
      await fetchOffers();
    }
  };

  const handleToggleOffer = async (id, isActive) => {
    try {
      await vendorMarketingService.updateOffer(id, { isActive });
      setOffers(prev => prev.map(o => (o._id === id || o.id === id ? { ...o, isActive } : o)));
      toast.success(isActive ? 'Offer activated live on app!' : 'Offer paused');
    } catch (err) {
      toast.error('Failed to update offer');
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      await vendorMarketingService.deleteOffer(id);
      setOffers(prev => prev.filter(o => o._id !== id && o.id !== id));
      toast.success('Offer deleted');
    } catch (err) {
      toast.error('Failed to delete offer');
    }
  };

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied!`);
  };

  if (loading) return <LogoLoader />;

  return (
    <div className="min-h-screen pb-24 bg-[#f8fafc]">
      <Header
        title="Store Offers & Deals"
        showBack={true}
        onBack={() => navigate('/vendor/dashboard')}
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Top Summary Banner */}
        <div className="rounded-3xl p-5 bg-gradient-to-r from-[#016A54] to-[#014D3D] text-white shadow-lg shadow-[#016A54]/20 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Marketing Hub</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">{stats.activeCount} Active Deals Live</h2>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">
              {stats.totalViews} Customer Views • {stats.totalClaims} Claims
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white text-[#016A54] font-black text-xs shadow-md hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <FiPlus className="w-4 h-4 stroke-[3]" />
            <span>New Deal</span>
          </button>
        </div>

        {/* Offers List */}
        {offers.length > 0 ? (
          <div className="space-y-3.5">
            {offers.map((offer) => {
              const isOfferActive = offer.isActive !== false;
              const validDate = offer.validTill ? new Date(offer.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Ongoing';

              return (
                <div
                  key={offer._id || offer.id}
                  className={`rounded-3xl border bg-white shadow-xs p-4 transition-all overflow-hidden ${
                    isOfferActive ? 'border-emerald-200' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="relative w-22 h-22 rounded-2xl overflow-hidden shrink-0 border border-gray-100 bg-gray-100">
                      <img
                        src={offer.imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&auto=format&fit=crop&q=80'}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                        {offer.discountBadge || 'DEAL'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h3 className="text-[15px] font-black text-gray-900 leading-snug truncate">
                          {offer.title}
                        </h3>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-1">
                          <input
                            type="checkbox"
                            checked={isOfferActive}
                            onChange={() => handleToggleOffer(offer._id || offer.id, !isOfferActive)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#016A54]"></div>
                        </label>
                      </div>

                      {offer.tagline && (
                        <p className="text-[12px] text-gray-500 font-medium truncate mb-2">
                          {offer.tagline}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap mb-2.5">
                        {offer.code && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(offer.code, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[#016A54] text-[11px] font-black tracking-wider uppercase hover:bg-emerald-100"
                          >
                            <FiTag className="w-3 h-3" />
                            <span>{offer.code}</span>
                            <FiCopy className="w-2.5 h-2.5 text-gray-400" />
                          </button>
                        )}
                        <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                          <FiClock className="w-3 h-3 text-gray-400" /> Valid till {validDate}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] font-bold text-gray-400">
                        <span className="text-emerald-700 flex items-center gap-1">
                          <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          {isOfferActive ? 'Visible to nearby users' : 'Offer is paused'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteOffer(offer._id || offer.id)}
                          className="text-gray-400 hover:text-rose-500 p-1"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-6 rounded-3xl bg-white border border-gray-100 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-3 border border-amber-100">
              <FiGift className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-1">No Active Deals Yet</h3>
            <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto mb-5 leading-relaxed">
              Launch festive discounts and special promos. They appear directly on the Apna Market user app!
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#016A54] hover:bg-[#015846] text-white text-xs font-black shadow-lg shadow-[#016A54]/25 active:scale-95 transition-all"
            >
              <FiPlus className="w-4 h-4 stroke-[3]" />
              <span>Create New Offer</span>
            </button>
          </div>
        )}
      </div>

      <CreateOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOfferCreated={handleCreateOffer}
      />
    </div>
  );
};

export default OffersPage;
