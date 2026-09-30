import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEye, FiSearch, FiRefreshCw,
  FiUser, FiMapPin, FiDollarSign, FiFileText, FiCheck, FiX
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import ListingBlockPreview from '../../components/ListingBlockPreview';
import { colors } from '../../../../theme';

const STATUS_BADGES = {
  PENDING_REVIEW: { label: 'Pending Review', bg: colors.warning[50], fg: colors.warning[700] },
  APPROVED: { label: 'Approved', bg: colors.success[50], fg: colors.success[700] },
  REJECTED: { label: 'Rejected', bg: colors.error[50], fg: colors.error[700] },
  CHANGES_REQUESTED: { label: 'Changes Requested', bg: colors.warning[100], fg: colors.warning[700] },
  PAUSED: { label: 'Paused', bg: colors.neutral[100], fg: colors.neutral[700] },
  SUSPENDED: { label: 'Suspended', bg: colors.error[50], fg: colors.error[700] },
  DRAFT: { label: 'Draft', bg: colors.neutral[100], fg: colors.neutral[600] },
};

const ServiceListingsReview = () => {
  const [listings, setListings] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [vendorFormSchema, setVendorFormSchema] = useState([]);
  const [rejectModal, setRejectModal] = useState({ open: false, listingId: null, isChangeRequest: false });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/service-listings', { params });
      if (res.data?.success) {
        setListings(res.data.data || []);
        setStatusCounts(res.data.statusCounts || {});
      }
    } catch (err) {
      console.error('Failed to load listing blocks:', err);
      toast.error('Failed to load listing blocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  const openDetail = async (item) => {
    setSelectedListing(item);
    setVendorFormSchema([]);
    try {
      const res = await api.get(`/admin/service-listings/${item._id}`);
      if (res.data?.success) {
        setSelectedListing(res.data.listing);
        setVendorFormSchema(res.data.vendorFormSchema || []);
      }
    } catch {
      /* list payload is enough for a basic preview */
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this listing block? It will go live for customers immediately.')) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/admin/service-listings/${id}/approve`);
      if (res.data?.success) {
        toast.success('Listing block approved');
        setSelectedListing(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
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
      const res = await api.patch(`/admin/service-listings/${rejectModal.listingId}/reject`, {
        reason: rejectReason.trim(),
        requestChanges: rejectModal.isChangeRequest
      });
      if (res.data?.success) {
        toast.success(rejectModal.isChangeRequest ? 'Changes requested from vendor' : 'Listing block rejected');
        setRejectModal({ open: false, listingId: null, isChangeRequest: false });
        setRejectReason('');
        setSelectedListing(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (id) => {
    const reason = window.prompt('Enter suspension reason:');
    if (reason === null) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/admin/service-listings/${id}/suspend`, { reason });
      if (res.data?.success) {
        toast.success('Listing block suspended');
        setSelectedListing(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to suspend');
    } finally {
      setActionLoading(false);
    }
  };

  const priceOf = (item) =>
    item.pricing?.basePrice || item.pricing?.hourlyRate || item.pricing?.dailyRate || item.pricing?.monthlyRent || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Listing Block Review</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Approve, reject, or request changes — independent of vendor account approval</p>
        </div>
        <button onClick={loadData} className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 flex items-center gap-2 self-start sm:self-auto shadow-sm">
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        {[
          ['PENDING_REVIEW', 'Pending Review', statusCounts.PENDING_REVIEW || 0],
          ['APPROVED', 'Approved', statusCounts.APPROVED || 0],
          ['CHANGES_REQUESTED', 'Changes Requested', statusCounts.CHANGES_REQUESTED || 0],
          ['REJECTED', 'Rejected', statusCounts.REJECTED || 0],
          ['PAUSED', 'Paused', statusCounts.PAUSED || 0],
          ['SUSPENDED', 'Suspended', statusCounts.SUSPENDED || 0],
          ['ALL', 'All', Object.values(statusCounts).reduce((a, b) => a + b, 0)],
        ].map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              statusFilter === key
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
            }`}
          >
            <span>{label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === key ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-600'}`}>{count}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 max-w-md shadow-sm">
        <FiSearch className="w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadData()}
          placeholder="Search by title, category, vendor..."
          className="w-full text-xs font-medium outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-400 text-xs font-medium">Loading listing blocks...</div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200 shadow-sm">
          <FiFileText className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="text-sm font-black text-neutral-800">No listing blocks found</h3>
          <p className="text-xs text-neutral-400 mt-1">Nothing matches “{statusFilter}”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((item) => {
            const badge = STATUS_BADGES[item.status] || STATUS_BADGES.DRAFT;
            const vendor = item.vendorId || {};
            const cover = item.portfolioPhotos?.[0];

            return (
              <div key={item._id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
                <div className="h-28 bg-neutral-100 relative">
                  {cover ? (
                    <img src={cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-400">No photo</div>
                  )}
                  <span
                    className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: badge.bg, color: badge.fg }}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-[10px] font-black text-primary-600 uppercase tracking-wider truncate">
                    {item.categoryName || 'Service'}
                  </span>
                  <h3 className="text-sm font-black text-neutral-900 mt-1 line-clamp-1">{item.title}</h3>
                  {item.hasPendingEdits && (
                    <p className="text-[10px] font-bold mt-1" style={{ color: colors.warning[700] }}>
                      Re-review — live snapshot still public
                    </p>
                  )}

                  <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-xl my-3 border border-neutral-100">
                    {vendor.profilePhoto ? (
                      <img src={vendor.profilePhoto} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center text-xs shrink-0"><FiUser /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-neutral-800 truncate">{vendor.name || 'Vendor'}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{vendor.phone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-neutral-600 mb-3">
                    <span className="flex items-center gap-1"><FiDollarSign className="w-3.5 h-3.5" /> ₹{priceOf(item)}</span>
                    <span className="flex items-center gap-1"><FiMapPin className="w-3.5 h-3.5" /> {item.serviceArea?.city || 'Any city'}</span>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 mt-auto flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openDetail(item)}
                      className="flex-1 min-w-[88px] py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                    >
                      <FiEye className="w-3.5 h-3.5" /> Preview
                    </button>
                    {item.status === 'PENDING_REVIEW' && (
                      <>
                        <button
                          onClick={() => handleApprove(item._id)}
                          disabled={actionLoading}
                          className="py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                        >
                          <FiCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, listingId: item._id, isChangeRequest: true })}
                          disabled={actionLoading}
                          className="py-2 px-2.5 text-xs font-bold rounded-xl border border-neutral-200 text-neutral-700"
                        >
                          Changes
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Customer preview</p>
                  <h2 className="text-base font-black text-neutral-900">Listing block review</h2>
                </div>
                <button onClick={() => setSelectedListing(null)} className="p-1 rounded-lg hover:bg-white text-neutral-400">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <ListingBlockPreview listing={selectedListing} vendorFormSchema={vendorFormSchema} />

              {selectedListing.documents?.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider">Documents (admin only)</h4>
                  {selectedListing.documents.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 text-xs font-bold text-primary-700 hover:underline">
                      <FiFileText /> {doc.label}
                    </a>
                  ))}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                {selectedListing.status === 'PENDING_REVIEW' && (
                  <>
                    <button
                      onClick={() => setRejectModal({ open: true, listingId: selectedListing._id, isChangeRequest: true })}
                      className="px-4 py-2 bg-white border border-neutral-200 text-neutral-800 text-xs font-bold rounded-xl"
                    >
                      Request changes
                    </button>
                    <button
                      onClick={() => setRejectModal({ open: true, listingId: selectedListing._id, isChangeRequest: false })}
                      className="px-4 py-2 text-white text-xs font-bold rounded-xl"
                      style={{ backgroundColor: colors.error[600] }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedListing._id)}
                      className="px-5 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700"
                    >
                      Approve
                    </button>
                  </>
                )}
                {selectedListing.status === 'APPROVED' && (
                  <button
                    onClick={() => handleSuspend(selectedListing._id)}
                    className="px-4 py-2 text-white text-xs font-bold rounded-xl"
                    style={{ backgroundColor: colors.error[600] }}
                  >
                    Suspend
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rejectModal.open && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-black text-neutral-900">
                {rejectModal.isChangeRequest ? 'Request changes' : 'Reject listing block'}
              </h3>
              <p className="text-xs text-neutral-500">
                {rejectModal.isChangeRequest
                  ? 'Tell the vendor what to fix. If this is a re-review, the live approved snapshot stays public until you approve the edit.'
                  : 'The vendor will see this reason. If this was an edit of a live listing, the previous approved version stays live.'}
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter a clear reason..."
                className="w-full p-3 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => { setRejectModal({ open: false, listingId: null, isChangeRequest: false }); setRejectReason(''); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700"
                >
                  {actionLoading ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ServiceListingsReview;
