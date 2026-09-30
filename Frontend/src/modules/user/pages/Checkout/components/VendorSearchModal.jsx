import React, { useEffect, useState } from 'react';
import { FiMapPin, FiCheck, FiAlertCircle, FiLoader, FiStar } from 'react-icons/fi';

const toPhotoUrl = (url) => {
  if (!url) return '';
  const clean = String(url).replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

/**
 * Catalog checkout: load nearby vendors → customer picks one → request sent only to that vendor.
 */
const VendorSearchModal = ({
  isOpen,
  onClose,
  currentStep,
  acceptedVendor,
  vendors = [],
  loadingVendors = false,
  sendingRequest = false,
  onSelectVendor,
  onRetry
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (isOpen && currentStep === 'waiting') {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : `${prev}.`));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a1128]/80 backdrop-blur-md transition-all duration-500">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden relative max-h-[90vh] flex flex-col">

        <button
          type="button"
          onClick={onClose}
          disabled={sendingRequest}
          className="absolute top-4 right-4 z-30 p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Pick vendor from nearby list */}
        {currentStep === 'searching' && (
          <div className="flex flex-col pt-12 pb-6 px-5 min-h-[420px] max-h-[85vh]">
            <div className="text-center mb-5 shrink-0">
              <h3 className="text-[20px] font-black text-gray-900 tracking-tight">Choose a provider</h3>
              <p className="text-[13px] font-medium text-gray-500 mt-1">
                Nearby experts within ~10km — request goes only to who you pick
              </p>
            </div>

            {loadingVendors ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
                <FiLoader className="w-8 h-8 text-[#016A54] animate-spin" />
                <p className="text-sm font-semibold text-gray-500">Finding nearby providers…</p>
              </div>
            ) : vendors.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-10">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <FiAlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="font-black text-gray-900 mb-1">No providers nearby</h4>
                <p className="text-sm text-gray-500 mb-6">Try another address or come back later.</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="w-full text-white py-3.5 rounded-2xl font-bold text-sm bg-[#016A54]"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 -mr-0.5">
                {vendors.map((v) => {
                  const name = v.businessName || v.name || 'Provider';
                  const photo = toPhotoUrl(v.profilePhoto);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={sendingRequest}
                      onClick={() => onSelectVendor?.(v)}
                      className="w-full text-left flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 bg-gray-50/80 hover:border-[#016A54]/40 hover:bg-[#016A54]/5 transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 font-black text-[#016A54]">
                        {photo ? (
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[15px] text-gray-900 truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-semibold text-gray-500">
                          {(v.rating != null && Number(v.rating) > 0) && (
                            <span className="inline-flex items-center gap-0.5">
                              <FiStar className="w-3 h-3 text-amber-400 fill-amber-400" />
                              {Number(v.rating).toFixed(1)}
                            </span>
                          )}
                          {v.distance != null && (
                            <span className="inline-flex items-center gap-0.5 text-[#016A54]">
                              <FiMapPin className="w-3 h-3" />
                              {v.distance} km
                            </span>
                          )}
                          {v.isOnline && (
                            <span className="text-green-600">Online</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#016A54] shrink-0">
                        {sendingRequest ? '…' : 'Send →'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Waiting for selected provider to accept */}
        {currentStep === 'waiting' && (
          <div className="flex flex-col items-center justify-center pt-14 pb-12 px-6 min-h-[420px]">
            <div className="w-16 h-16 rounded-full bg-[#016A54]/10 flex items-center justify-center mb-5">
              <FiLoader className="w-7 h-7 text-[#016A54] animate-spin" />
            </div>
            <h3 className="text-[20px] font-black text-gray-900 mb-2 text-center">Request sent</h3>
            <p className="text-[14px] text-gray-500 font-medium text-center mb-2">
              Waiting for {acceptedVendor?.businessName || acceptedVendor?.name || 'provider'} to accept{dots}
            </p>
            <p className="text-[12px] text-gray-400 text-center">
              You can close this and track status on the confirmation screen.
            </p>
          </div>
        )}

        {currentStep === 'accepted' && acceptedVendor && (
          <div className="flex flex-col items-center justify-center pt-12 pb-10 px-6 bg-white w-full min-h-[420px]">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(34,197,94,0.3)]">
                <FiCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-[24px] font-black text-gray-900 mb-2 tracking-tight">Request Accepted!</h3>
            <p className="text-[14px] text-gray-500 font-medium text-center mb-8">
              Your provider is ready to serve you.
            </p>
            <div className="w-full bg-gray-50 rounded-[24px] p-5 border border-gray-100 mb-8 flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-[16px] shadow-sm flex items-center justify-center font-black text-xl text-[#016A54] border border-gray-100">
                {acceptedVendor.businessName?.charAt(0) || acceptedVendor.name?.charAt(0) || 'P'}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-[16px] text-gray-900 mb-1">
                  {acceptedVendor.businessName || acceptedVendor.name || 'Professional'}
                </h4>
                <div className="flex items-center gap-3 text-[12px] font-bold text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-400 text-sm">★</span> {acceptedVendor.rating || '—'}
                  </span>
                  {acceptedVendor.distance != null && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-green-600">{acceptedVendor.distance} km</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-white py-4 rounded-[16px] font-bold text-[15px] shadow-lg shadow-[#016A54]/25 active:scale-95 transition-all bg-[#016A54] hover:bg-[#122652]"
            >
              Continue
            </button>
          </div>
        )}

        {currentStep === 'failed' && (
          <div className="flex flex-col items-center justify-center pt-12 pb-10 px-6 min-h-[420px]">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <FiAlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-[22px] font-black text-gray-900 mb-2">Couldn&apos;t send request</h3>
            <p className="text-[14px] text-gray-500 font-medium text-center mb-8 px-2">
              Please try again or pick another provider.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="w-full text-white py-4 rounded-[16px] font-bold text-[15px] bg-[#016A54] mb-3"
            >
              Show providers again
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-gray-500 py-3 rounded-[16px] font-bold text-[14px] hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorSearchModal;
