import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiShield, FiPhone, FiMapPin, FiAward } from 'react-icons/fi';

const CancellationPolicy = () => {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-24 w-full max-w-lg mx-auto shadow-xs relative font-sans text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F0F2F1] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-[#F5F7F6] flex items-center justify-center text-neutral-800 hover:bg-[#EAEFEA] active:scale-95 transition-all"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-neutral-900">Marketplace Guidelines</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-5">
        {/* Key Highlights */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-2xs border border-neutral-150/80 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-[#EDF8F5] rounded-full flex items-center justify-center mb-2.5 text-[#016A54]">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-xs mb-0.5">100% Free to Use</h3>
            <p className="text-[11px] text-neutral-400 font-medium">No booking or checkout fees</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-2xs border border-neutral-150/80 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-[#EDF8F5] rounded-full flex items-center justify-center mb-2.5 text-[#016A54]">
              <FiShield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-900 text-xs mb-0.5">Verified Merchants</h3>
            <p className="text-[11px] text-neutral-400 font-medium">Local physical shops in Indore</p>
          </div>
        </div>

        {/* Discovery Model Explanation */}
        <div className="bg-white rounded-2xl p-5 shadow-2xs border border-neutral-150/80 space-y-4">
          <h2 className="text-sm font-bold text-neutral-900">How Apna Market Works</h2>

          <div className="space-y-4 text-xs text-neutral-600">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#EDF8F5] text-[#016A54] flex items-center justify-center font-bold shrink-0 text-xs">
                1
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 mb-0.5">Discover Nearby Businesses</h4>
                <p className="text-neutral-500 leading-relaxed">
                  Browse verified restaurants, clothing stores, electronics shops, and home services near you in Indore.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#EDF8F5] text-[#016A54] flex items-center justify-center font-bold shrink-0 text-xs">
                2
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 mb-0.5">Connect Directly</h4>
                <p className="text-neutral-500 leading-relaxed">
                  Call the store directly or get one-tap GPS directions to visit in person. There is no middleman or hidden platform fees.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#EDF8F5] text-[#016A54] flex items-center justify-center font-bold shrink-0 text-xs">
                3
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 mb-0.5">Avail In-Store Offers</h4>
                <p className="text-neutral-500 leading-relaxed">
                  Show active coupons or discounts displayed on Apna Market at checkout in the shop to enjoy savings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Merchant Support Info */}
        <div className="bg-gradient-to-br from-[#EDF8F5] to-emerald-50 rounded-2xl p-5 border border-[#ADE2D7]/50">
          <div className="flex items-center gap-2 text-[#014A3B] font-bold text-sm mb-1.5">
            <FiAward className="w-4 h-4" />
            <span>Support Local Merchants</span>
          </div>
          <p className="text-xs text-neutral-700 leading-relaxed font-medium mb-3">
            Apna Market is built to champion local businesses. Every visit, review, and inquiry helps Indore's local marketplace grow stronger.
          </p>
          <button
            type="button"
            onClick={() => navigate('/user')}
            className="w-full py-2.5 bg-[#016A54] hover:bg-[#015B48] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Explore Apna Market
          </button>
        </div>
      </main>
    </div>
  );
};

export default CancellationPolicy;
