import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiEye, FiSearch, FiFilter, FiDownload, FiLoader, FiPower, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import CardShell from '../UserCategories/components/CardShell';
import Modal from '../UserCategories/components/Modal';
import adminVendorService from '../../../../services/adminVendorService';

const AllVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Load vendors from backend
  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await adminVendorService.getAllVendors();
      if (response.success) {
        setVendors(response.data || []);
      } else {
        toast.error(response.message || 'Failed to load vendors');
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast.error('Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      const vId = vendor._id || vendor.id;
      const serviceString = Array.isArray(vendor.service)
        ? vendor.service.join(' ')
        : (vendor.service || '');

      const matchesStatus = filterStatus === 'all' || vendor.approvalStatus === filterStatus;

      const matchesSearch =
        (vendor.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vendor.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vendor.phone || '').includes(searchQuery) ||
        serviceString.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vendor.businessName && vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [vendors, filterStatus, searchQuery]);

  const handleApprove = async (vendorId) => {
    try {
      const response = await adminVendorService.approveVendor(vendorId);
      if (response.success) {
        setVendors(prev => prev.map(v =>
          (v._id === vendorId || v.id === vendorId) ? { ...v, approvalStatus: 'approved' } : v
        ));
        toast.success('Vendor approved successfully!');
      } else {
        toast.error(response.message || 'Failed to approve vendor');
      }
    } catch (error) {
      console.error('Error approving vendor:', error);
      toast.error('Failed to approve vendor. Please try again.');
    }
  };

  const handleReject = async (vendorId) => {
    try {
      const response = await adminVendorService.rejectVendor(vendorId);
      if (response.success) {
        setVendors(prev => prev.map(v =>
          (v._id === vendorId || v.id === vendorId) ? { ...v, approvalStatus: 'rejected' } : v
        ));
        toast.success('Vendor rejected successfully.');
      } else {
        toast.error(response.message || 'Failed to reject vendor');
      }
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      toast.error('Failed to reject vendor. Please try again.');
    }
  };

  const handleToggleStatus = async (vendorId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await adminVendorService.toggleStatus(vendorId, newStatus);
      if (response.success) {
        setVendors(prev => prev.map(v =>
          (v._id === vendorId || v.id === vendorId) ? { ...v, isActive: newStatus } : v
        ));
        toast.success(`Vendor ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.error(response.message || 'Failed to update vendor status');
      }
    } catch (error) {
      console.error('Error toggling vendor status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminVendorService.deleteVendor(vendorId);
      if (response.success) {
        setVendors(prev => prev.filter(v => (v._id !== vendorId && v.id !== vendorId)));
        toast.success('Vendor deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete vendor');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
    }
  };

  const handleViewDetails = (vendor) => {
    setSelectedVendor(vendor);
    setIsViewModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };

    const st = status || 'pending';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[st] || styles.pending}`}>
        {st.charAt(0).toUpperCase() + st.slice(1)}
      </span>
    );
  };

  const pendingCount = vendors.filter(v => v.approvalStatus === 'pending').length;
  const approvedCount = vendors.filter(v => v.approvalStatus === 'approved').length;
  const rejectedCount = vendors.filter(v => v.approvalStatus === 'rejected').length;

  return (
    <div className="space-y-4">
      <CardShell
        icon={FiFilter}
        title="Vendor Management"
        subtitle="Manage and verify platform vendors"
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <div className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-1">Pending</div>
            <div className="text-xl font-bold text-yellow-900">{pendingCount}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">Approved</div>
            <div className="text-xl font-bold text-green-900">{approvedCount}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Rejected</div>
            <div className="text-xl font-bold text-red-900">{rejectedCount}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-xs"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${filterStatus === status
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vendor Details</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Business Info</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-xs text-gray-500">Loading vendors...</td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-xs text-gray-500">No vendors found</td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => {
                    const vId = vendor._id || vendor.id;
                    return (
                      <tr key={vId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{vendor.name}</p>
                            <p className="text-[10px] text-gray-500">{vendor.phone}</p>
                            <p className="text-[10px] text-gray-400">{vendor.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-bold text-gray-800 text-xs">{vendor.businessName || 'N/A'}</p>
                            <p className="text-[10px] text-primary-500 font-medium">
                              {Array.isArray(vendor.service) ? vendor.service.join(', ') : (vendor.service || 'No service')}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${vendor.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                            vendor.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                              'bg-yellow-50 text-yellow-700 border-yellow-100'
                            }`}>
                            {vendor.approvalStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {/* View Details */}
                            <button
                              onClick={() => handleViewDetails(vendor)}
                              className="p-1.5 text-primary-400 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Active Status */}
                            <button
                              onClick={() => handleToggleStatus(vId, vendor.isActive)}
                              className={`p-1.5 rounded-lg transition-colors ${vendor.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                              title={vendor.isActive ? "Disable Login" : "Enable Login"}
                            >
                              <FiPower className={`w-3.5 h-3.5 ${vendor.isActive ? 'fill-current' : ''}`} />
                            </button>

                            {/* Approve/Reject (Only for pending) */}
                            {vendor.approvalStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(vId)}
                                  className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Approve"
                                >
                                  <FiCheck className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleReject(vId)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <FiX className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Delete Vendor */}
                            <button
                              onClick={() => handleDelete(vId)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Vendor"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardShell >

      {/* View Vendor Details Modal */}
      < Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedVendor(null);
        }}
        title={`Vendor Details: ${selectedVendor?.name || ''}`}
        size="lg"
      >
        {selectedVendor && (
          <div className="space-y-6">
            {/* 1. Basic Overview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Owner Name</span>
                  <span className="font-bold text-slate-900">{selectedVendor.name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Business Name</span>
                  <span className="font-bold text-slate-900">{selectedVendor.businessName || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Phone</span>
                  <span className="font-bold text-slate-900">{selectedVendor.phone}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Email</span>
                  <span className="font-bold text-slate-900 truncate block">{selectedVendor.email}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Selected Services</span>
                  <span className="font-bold text-primary-600">
                    {Array.isArray(selectedVendor.service) ? selectedVendor.service.join(', ') : (selectedVendor.service || 'N/A')}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Approval Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedVendor.approvalStatus)}</div>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Registered Date</span>
                  <span className="font-semibold text-slate-700">
                    {selectedVendor.createdAt ? new Date(selectedVendor.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Account Status</span>
                  <span className={`font-bold ${selectedVendor.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedVendor.isActive ? 'Active (Can Login)' : 'Inactive (Blocked)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Location & Address */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Location & Address</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Full Address</span>
                  <span className="font-semibold text-slate-900">{selectedVendor.address?.fullAddress || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">City</span>
                  <span className="font-semibold text-slate-900">{selectedVendor.address?.city || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">State / Pincode</span>
                  <span className="font-semibold text-slate-900">
                    {selectedVendor.address?.state || ''} {selectedVendor.address?.pincode ? `(${selectedVendor.address.pincode})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Custom Category Form Specs & Vendor Answers */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Vendor Form Specs & Custom Answers</span>
                <span className="text-[10px] text-primary-500 font-bold">Category Specs</span>
              </h3>
              {(!selectedVendor.serviceDetails || Object.keys(selectedVendor.serviceDetails).length === 0) ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed">No custom form details submitted by vendor.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(selectedVendor.serviceDetails).map(([catTitle, details]) => (
                    <div key={catTitle} className="p-3 bg-primary-50/50 border border-primary-100 rounded-xl space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-primary-200/50">
                        <span className="text-xs font-black text-blue-900">{catTitle}</span>
                        <span className="text-[10px] font-bold bg-primary-500 text-white px-2 py-0.5 rounded-full">Form Answers</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {Object.entries(details || {}).map(([key, val]) => {
                          if (val === undefined || val === null || val === '') return null;
                          const formattedKey = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (str) => str.toUpperCase());
                          const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
                          return (
                            <div key={key} className="bg-white p-2 rounded-lg border border-slate-200">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{formattedKey}</span>
                              <span className="font-bold text-slate-800 break-words">{displayVal}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Bank Account & Payout Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Bank & Payout Setup</h3>
              {(!selectedVendor.bankDetails?.accountNumber && !selectedVendor.bankDetails?.upiId) ? (
                <p className="text-xs text-slate-400 italic">Vendor skipped bank details during signup.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Account Holder</span>
                    <span className="font-bold text-slate-900">{selectedVendor.bankDetails?.accountHolderName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Account Number</span>
                    <span className="font-bold text-slate-900">{selectedVendor.bankDetails?.accountNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">IFSC Code / Bank</span>
                    <span className="font-bold text-slate-900">
                      {selectedVendor.bankDetails?.ifscCode || ''} {selectedVendor.bankDetails?.bankName ? `(${selectedVendor.bankDetails.bankName})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">UPI ID</span>
                    <span className="font-bold text-slate-900">{selectedVendor.bankDetails?.upiId || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Verification Documents */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Identity Numbers & Verification Documents</h3>
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Aadhaar Number</span>
                  <span className="font-black text-slate-900">{selectedVendor.aadhar?.number || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">PAN Card Number</span>
                  <span className="font-black text-slate-900">{selectedVendor.pan?.number || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {selectedVendor.aadhar?.document && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Aadhaar Front</label>
                    <img
                      src={selectedVendor.aadhar.document}
                      alt="Aadhaar Front"
                      className="w-full h-40 object-cover rounded-lg border border-slate-200 bg-white"
                    />
                    <a
                      href={selectedVendor.aadhar.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:text-primary-600"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      View / Download
                    </a>
                  </div>
                )}
                {selectedVendor.aadhar?.backDocument && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Aadhaar Back</label>
                    <img
                      src={selectedVendor.aadhar.backDocument}
                      alt="Aadhaar Back"
                      className="w-full h-40 object-cover rounded-lg border border-slate-200 bg-white"
                    />
                    <a
                      href={selectedVendor.aadhar.backDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:text-primary-600"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      View / Download
                    </a>
                  </div>
                )}
                {selectedVendor.pan?.document && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">PAN Card</label>
                    <img
                      src={selectedVendor.pan.document}
                      alt="PAN Card"
                      className="w-full h-40 object-cover rounded-lg border border-slate-200 bg-white"
                    />
                    <a
                      href={selectedVendor.pan.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:text-primary-600"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      View / Download
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Actions for Pending Vendor */}
            {selectedVendor.approvalStatus === 'pending' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={async () => {
                    const vId = selectedVendor._id || selectedVendor.id;
                    await handleApprove(vId);
                    setIsViewModalOpen(false);
                    setSelectedVendor(null);
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-xs shadow-md"
                >
                  <FiCheck className="w-4 h-4" />
                  Approve Vendor
                </button>
                <button
                  onClick={async () => {
                    const vId = selectedVendor._id || selectedVendor.id;
                    await handleReject(vId);
                    setIsViewModalOpen(false);
                    setSelectedVendor(null);
                  }}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 text-xs shadow-md"
                >
                  <FiX className="w-4 h-4" />
                  Reject Vendor
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllVendors;
