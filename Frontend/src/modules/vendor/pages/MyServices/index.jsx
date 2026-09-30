import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiPlus, FiEdit2, FiPauseCircle, FiPlayCircle, FiTrash2,
  FiCheckCircle, FiClock, FiAlertCircle, FiXCircle, FiLayers, FiDollarSign,
  FiMapPin, FiStar, FiFileText, FiLoader
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import { colors } from '../../../../theme';
import Header from '../../components/layout/Header';

const STATUS_CONFIG = {
  APPROVED: { label: 'Live', icon: FiCheckCircle, bg: colors.success[50], fg: colors.success[700], border: colors.success[100] },
  PENDING_REVIEW: { label: 'Under Review', icon: FiClock, bg: colors.warning[50], fg: colors.warning[700], border: colors.warning[100] },
  DRAFT: { label: 'Draft', icon: FiFileText, bg: colors.neutral[100], fg: colors.neutral[600], border: colors.neutral[200] },
  PAUSED: { label: 'Paused', icon: FiPauseCircle, bg: colors.neutral[100], fg: colors.neutral[700], border: colors.neutral[200] },
  REJECTED: { label: 'Rejected', icon: FiXCircle, bg: colors.error[50], fg: colors.error[700], border: colors.error[100] },
  CHANGES_REQUESTED: { label: 'Changes Needed', icon: FiAlertCircle, bg: colors.warning[50], fg: colors.warning[700], border: colors.warning[100] },
  SUSPENDED: { label: 'Suspended', icon: FiXCircle, bg: colors.error[50], fg: colors.error[700], border: colors.error[100] },
};

const MyServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors/services', { cacheTtl: 20 });
      if (res.data?.data) {
        setServices(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      toast.error('Failed to load your services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggle = async (serviceId) => {
    try {
      const res = await api.patch(`/vendors/services/${serviceId}/toggle`);
      if (res.data?.success) {
        toast.success(res.data.message);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Delete this service listing? Customers will no longer see it.')) return;
    try {
      const res = await api.delete(`/vendors/services/${serviceId}`);
      if (res.data?.success) {
        toast.success('Service deleted');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete service');
    }
  };

  const filteredServices = activeFilter === 'ALL' ? services : services.filter((s) => s.status === activeFilter);

  const statusCounts = services.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const getPrice = (item) => {
    const activeItems = (item.catalogItems || []).filter((i) => i.isActive !== false && i.title);
    if (activeItems.length) {
      const prices = activeItems.map((i) => Number(i.price) || 0).filter((p) => p > 0);
      if (prices.length) return Math.min(...prices);
    }
    const p = item.pricing || {};
    return p.basePrice || p.hourlyRate || p.dailyRate || p.monthlyRent || p.perGuardRate || p.packagePrice || 0;
  };

  const getBlockCount = (item) => (item.catalogItems || []).filter((i) => i.isActive !== false && i.title).length;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <Header
        title="My Services"
        onBack={() => navigate('/vendor/dashboard')}
        rightAction={
          <button
            onClick={() => navigate('/vendor/add-service')}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-white/10"
          >
            <FiPlus className="w-3.5 h-3.5" /><span>Add</span>
          </button>
        }
      />

      <main className="p-4 max-w-xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-3.5 shadow-sm">
          <p className="text-[11px] font-black text-neutral-800 uppercase tracking-wide">How it works</p>
          <ol className="mt-2 space-y-1.5 text-[11px] text-neutral-600">
            <li><span className="font-bold text-primary-700">1.</span> Pick any service category you provide</li>
            <li><span className="font-bold text-primary-700">2.</span> Fill company / about details once</li>
            <li><span className="font-bold text-primary-700">3.</span> Add packages under that service</li>
            <li><span className="font-bold text-primary-700">4.</span> Edit details or add packages anytime — user panel pe sirf admin approve ke baad dikhega</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] text-gray-500 font-bold tracking-wide uppercase px-1">
            {services.length} service{services.length !== 1 ? 's' : ''} total
          </p>

          {services.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[['ALL', 'All', services.length], ...Object.entries(STATUS_CONFIG).filter(([k]) => statusCounts[k]).map(([k, v]) => [k, v.label, statusCounts[k]])].map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all shrink-0 ${
                    activeFilter === key
                      ? 'bg-[#016A54] text-white border-[#016A54] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200 shadow-sm space-y-4">
            <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <FiLayers />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900">
                {activeFilter === 'ALL' ? 'No Services Yet' : `No ${STATUS_CONFIG[activeFilter]?.label || ''} Services`}
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Select a category, add your company details, then create packages customers can book.
              </p>
            </div>
            <button
              onClick={() => navigate('/vendor/add-service')}
              className="bg-primary-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md hover:bg-primary-700 active:scale-95 transition-all"
            >
              <FiPlus /><span>Create Service</span>
            </button>
          </div>
        ) : (
          filteredServices.map((item) => {
            const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusInfo.icon;
            const reason = item.rejectedReason || item.adminNotes;
            const blockCount = getBlockCount(item);

            return (
              <div key={item._id} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] mb-4">
                <div className="p-4 relative">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: statusInfo.bg, color: statusInfo.fg, border: `1px solid ${statusInfo.border}` }}
                        >
                          <StatusIcon className="w-2.5 h-2.5" /> {statusInfo.label}
                        </span>
                        <span className="inline-block text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          • {item.categoryName || 'Service'}
                        </span>
                        {item.hasPendingEdits && (
                          <span
                            className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                            style={{ backgroundColor: colors.warning[100], color: colors.warning[700] }}
                          >
                            Update Pending Approval
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-black text-gray-900 truncate tracking-tight leading-tight">{item.title}</h3>
                    </div>
                    {(item.portfolioPhotos?.[0] || item.categoryId?.homeIconUrl) && (
                      <div className="w-[68px] h-[68px] shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                        <img
                          src={item.portfolioPhotos?.[0] ? item.portfolioPhotos[0].replace('/api/upload', `${(import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000')}/upload`) : item.categoryId.homeIconUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {item.hasPendingEdits && (
                    <div className="rounded-lg p-2.5 mb-3 border border-amber-100 bg-amber-50">
                      <p className="text-[10px] font-bold text-amber-800">
                        Your edits are with admin. Customers still see the last approved packages until approval.
                      </p>
                    </div>
                  )}

                  {item.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{item.description}</p>
                  )}

                  {(item.status === 'REJECTED' || item.status === 'CHANGES_REQUESTED') && reason && (
                    <div
                      className="rounded-lg p-2.5 mb-3 border"
                      style={{ backgroundColor: colors.error[50], borderColor: colors.error[100] }}
                    >
                      <p className="text-[10px] font-bold mb-0.5" style={{ color: colors.error[800] || colors.error[700] }}>
                        {item.status === 'CHANGES_REQUESTED' ? 'Changes required' : 'Rejected'}
                      </p>
                      <p className="text-[10px]" style={{ color: colors.error[700] }}>{reason}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-3 flex-wrap">
                    <span className="flex items-center gap-1 font-black text-gray-800 bg-gray-50 px-2 py-0.5 rounded">
                      <FiDollarSign className="w-3 h-3 text-gray-400" />
                      {blockCount > 0 ? `From ₹${getPrice(item)}` : `₹${getPrice(item)}`}
                    </span>
                    {blockCount > 0 && (
                      <span className="flex items-center gap-1 font-medium">
                        <FiLayers className="w-3 h-3 text-gray-400" />
                        {blockCount} package{blockCount === 1 ? '' : 's'}
                      </span>
                    )}
                    {item.serviceArea?.city && (
                      <span className="flex items-center gap-1 font-medium">
                        <FiMapPin className="w-3 h-3 text-gray-400" /> {item.serviceArea.city}
                      </span>
                    )}
                    {item.experience > 0 && (
                      <span className="flex items-center gap-1 font-medium">
                        <FiStar className="w-3 h-3 text-amber-400" /> {item.experience} yrs
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        onClick={() => navigate(`/vendor/edit-service/${item._id}?mode=packages`)}
                        className="text-[12px] font-bold text-white bg-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-700 flex items-center gap-1.5 transition-colors active:scale-95"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        Packages
                      </button>
                      <button
                        onClick={() => navigate(`/vendor/edit-service/${item._id}`)}
                        className="text-[12px] font-bold text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 flex items-center gap-1.5 transition-colors active:scale-95"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                        {item.status === 'CHANGES_REQUESTED' ? 'Edit & Resubmit' : 'Edit Details'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(item.status === 'APPROVED' || item.status === 'PAUSED') && (
                        <button
                          onClick={() => handleToggle(item._id)}
                          className="text-[12px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors active:scale-95"
                        >
                          {item.status === 'APPROVED' ? <><FiPauseCircle className="w-3.5 h-3.5" /> Pause</> : <><FiPlayCircle className="w-3.5 h-3.5" /> Resume</>}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50 active:scale-95"
                        style={{ color: colors.error[500] }}
                        title="Delete service"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default MyServices;
