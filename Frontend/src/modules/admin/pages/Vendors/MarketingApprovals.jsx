import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiRefreshCw,
  FiImage,
  FiTag,
  FiCheck,
  FiX,
  FiInfo,
  FiCalendar,
  FiPercent,
  FiPhone,
  FiMaximize2,
  FiFileText
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';

const MarketingApprovals = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [rejectModal, setRejectModal] = useState({ open: false, vendorId: null, itemId: null, itemType: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/vendors/marketing-approvals', { params: { status: statusFilter } });
      if (res.data?.success) {
        setItems(res.data.data || []);
        if (res.data.counts) setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to load marketing approvals:', err);
      toast.error('Failed to load marketing approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleApprove = async (vendorId, itemType, itemId) => {
    if (!window.confirm('Approve this item? It will go live immediately on the customer app.')) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/admin/vendors/${vendorId}/marketing/${itemType}/${itemId}/approve`);
      if (res.data?.success) {
        toast.success('Approved successfully! It is now live on customer app.');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.post(`/admin/vendors/${rejectModal.vendorId}/marketing/${rejectModal.itemType}/${rejectModal.itemId}/reject`, {
        reason: rejectReason.trim()
      });
      if (res.data?.success) {
        toast.success('Item rejected');
        setRejectModal({ open: false, vendorId: null, itemId: null, itemType: null });
        setRejectReason('');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject item');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            Marketing Approvals
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Review original vendor banner photos, offers, and form details before they appear in the customer app.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 pb-3">
        {['pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all capitalize flex items-center gap-1.5 cursor-pointer ${
              statusFilter === status
                ? 'bg-[#016A54] text-white border-[#016A54] shadow-xs'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-[#016A54]/40'
            }`}
          >
            <span>{status}</span>
            {counts[status] !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                statusFilter === status ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'
              }`}>
                {counts[status]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="text-center py-20 text-neutral-400 text-xs font-medium">
          Loading marketing items...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-xs">
          <FiInfo className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="text-base font-black text-neutral-800">No items found</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            There are currently no items in "{statusFilter}" status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((entry) => {
            const { type, vendor, item } = entry;
            const imageUrl = type === 'photo' ? item.url : item.imageUrl;
            const validTillFormatted = item.validTill ? new Date(item.validTill).toLocaleDateString() : null;
            const submittedDate = entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString() : 'Recent';

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden flex flex-col hover:border-[#016A54]/30 hover:shadow-md transition-all"
              >
                {/* 1. Crystal Clear Original Photo Banner */}
                <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden group">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.title || 'Marketing item'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                      onClick={() => setPreviewImage({ url: imageUrl, title: item.title || 'Full Photo' })}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">
                      No Photo Provided
                    </div>
                  )}

                  {/* Top Overlay Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-black/60 text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
                      {type === 'photo' ? <FiImage className="w-3 h-3" /> : <FiTag className="w-3 h-3" />}
                      <span>{type === 'photo' ? 'Shop Photo' : 'Offer Banner'}</span>
                    </span>

                    {type === 'offer' && item.discountBadge && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-600 text-white shadow-xs">
                        {item.discountBadge}
                      </span>
                    )}
                  </div>

                  {/* Click to Expand Action */}
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ url: imageUrl, title: item.title || 'Full Photo' })}
                      className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-sm"
                      title="View Full Resolution"
                    >
                      <FiMaximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 2. Proper Form Data Section */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Vendor Shop Info */}
                    <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                      <div>
                        <div className="text-xs font-bold text-neutral-900 line-clamp-1">
                          {vendor.businessName || vendor.name}
                        </div>
                        {vendor.phone && (
                          <div className="text-[11px] text-neutral-500 font-medium flex items-center gap-1 mt-0.5">
                            <FiPhone className="w-3 h-3 text-neutral-400" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-medium text-right shrink-0">
                        {submittedDate}
                      </div>
                    </div>

                    {/* Offer Title & Tagline */}
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-neutral-900 leading-snug">
                        {item.title || item.caption || 'Store Promotion'}
                      </h3>
                      {item.tagline && (
                        <p className="text-xs text-neutral-600 font-medium mt-0.5 italic">
                          "{item.tagline}"
                        </p>
                      )}
                    </div>

                    {/* Offer Details Grid */}
                    {type === 'offer' && (
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        {item.code && (
                          <div className="bg-neutral-50 rounded-xl p-2 border border-neutral-150">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                              Coupon Code
                            </span>
                            <span className="font-black text-[#016A54] uppercase tracking-wide">
                              {item.code}
                            </span>
                          </div>
                        )}

                        {validTillFormatted && (
                          <div className="bg-neutral-50 rounded-xl p-2 border border-neutral-150">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                              Valid Till
                            </span>
                            <span className="font-bold text-neutral-800 flex items-center gap-1">
                              <FiCalendar className="w-3 h-3 text-neutral-400" />
                              {validTillFormatted}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Terms & Conditions */}
                    {item.terms && (
                      <div className="text-[11px] text-neutral-500 bg-neutral-50 rounded-xl p-2.5 border border-neutral-150 flex items-start gap-1.5">
                        <FiFileText className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{item.terms}</span>
                      </div>
                    )}
                  </div>

                  {/* 3. Action Buttons / Status */}
                  <div className="pt-3 border-t border-neutral-100">
                    {statusFilter === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(vendor._id, type, item._id)}
                          disabled={actionLoading}
                          className="flex-1 py-2.5 bg-[#016A54] hover:bg-[#015B48] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <FiCheck className="w-4 h-4" /> Approve & Make Live
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectModal({ open: true, vendorId: vendor._id, itemId: item._id, itemType: type })}
                          disabled={actionLoading}
                          className="px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-rose-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <FiX className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    ) : statusFilter === 'approved' ? (
                      <div className="w-full py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                        <FiCheck className="w-4 h-4" /> Live on Customer App
                      </div>
                    ) : (
                      <div className="w-full py-2 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5">
                        <FiX className="w-4 h-4" /> Rejected {item.rejectedReason ? `• "${item.rejectedReason}"` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-Screen High-Resolution Image Preview Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl max-h-[90vh] bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 bg-neutral-950 flex items-center justify-between text-white text-xs font-bold">
                <span>{previewImage.title}</span>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh]">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectModal.open && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-neutral-150 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-neutral-900">Reject Marketing Item</h3>
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, vendorId: null, itemId: null, itemType: null })}
                  className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                Provide a reason why this item is being rejected. The vendor will receive this notification.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Inappropriate banner, blurry photo, misleading offer..."
                rows={3}
                className="w-full p-3 rounded-2xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, vendorId: null, itemId: null, itemType: null })}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MarketingApprovals;
