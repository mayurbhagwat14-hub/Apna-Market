import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiImage, FiTag, FiCheck, FiX, FiInfo } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import { colors } from '../../../../theme';

const MarketingApprovals = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [rejectModal, setRejectModal] = useState({ open: false, vendorId: null, itemId: null, itemType: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
    if (!window.confirm('Approve this item? It will go live immediately.')) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/admin/vendors/${vendorId}/marketing/${itemType}/${itemId}/approve`);
      if (res.data?.success) {
        toast.success('Item approved successfully');
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
      toast.error('Please enter a reason');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-neutral-900 tracking-tight">Marketing Approvals</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Review vendor offers and shop photos before they go live.</p>
        </div>
        <button onClick={loadData} className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 flex items-center gap-2 shadow-sm">
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 border-b border-neutral-200 pb-3">
        {['pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all capitalize flex items-center gap-1.5 ${
              statusFilter === status
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
            }`}
          >
            <span>{status}</span>
            {counts[status] !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                statusFilter === status ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-700'
              }`}>
                {counts[status]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-400 text-xs font-medium">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200 shadow-sm">
          <FiInfo className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="text-sm font-black text-neutral-800">No items found</h3>
          <p className="text-xs text-neutral-400 mt-1">Nothing in {statusFilter} status right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((entry) => {
            const { type, vendor, item } = entry;
            return (
              <div key={item._id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
                {type === 'photo' ? (
                  <div className="h-40 bg-neutral-100 relative">
                    {item.url ? (
                      <img src={item.url} alt="Shop photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-400">No photo</div>
                    )}
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                      <FiImage /> Photo
                    </span>
                  </div>
                ) : (
                  <div className="h-40 bg-neutral-50 p-4 relative flex flex-col justify-center items-center text-center border-b border-neutral-100">
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm z-10">
                      <FiTag /> Offer
                    </span>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                    )}
                    <div className="relative z-10">
                      <span className="inline-block px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-black rounded-lg mb-2">
                        {item.discountBadge || 'OFFER'}
                      </span>
                      <h3 className="text-lg font-black text-neutral-900">{item.title}</h3>
                      {item.code && (
                        <p className="text-xs font-bold text-neutral-500 mt-1 uppercase tracking-widest border border-dashed border-neutral-300 px-2 py-1 rounded inline-block">
                          {item.code}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="mb-4">
                    <p className="text-xs font-bold text-neutral-800 line-clamp-1">{vendor.businessName || vendor.name}</p>
                    <p className="text-[10px] text-neutral-400">
                      Submitted: {new Date(entry.submittedAt).toLocaleDateString()}
                    </p>
                    {type === 'photo' && item.caption && (
                      <p className="text-xs text-neutral-600 mt-2 line-clamp-2">"{item.caption}"</p>
                    )}
                    {type === 'offer' && item.tagline && (
                      <p className="text-xs text-neutral-600 mt-2 line-clamp-2">"{item.tagline}"</p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-neutral-100 mt-auto flex gap-2">
                    {statusFilter === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(vendor._id, type, item._id)}
                          disabled={actionLoading}
                          className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                        >
                          <FiCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, vendorId: vendor._id, itemId: item._id, itemType: type })}
                          disabled={actionLoading}
                          className="flex-1 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                        >
                          <FiX className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-1 text-xs font-bold text-neutral-500 capitalize">
                        Status: {item.reviewStatus}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {rejectModal.open && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-black text-neutral-900">Reject Item</h3>
              <p className="text-xs text-neutral-500">Provide a reason for rejection. This will be visible to the vendor.</p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => { setRejectModal({ open: false, vendorId: null, itemId: null, itemType: null }); setRejectReason(''); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700"
                >
                  {actionLoading ? 'Saving...' : 'Reject'}
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
