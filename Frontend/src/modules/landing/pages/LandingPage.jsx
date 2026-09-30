import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiMapPin } from 'react-icons/fi';
import { useBranding } from '../../../context/BrandingContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [imgError, setImgError] = useState(false);

  // Dynamic branding name set by admin
  const fullAppName = (branding?.appName || 'Apna Market').trim();
  const nameParts = fullAppName.split(/\s+/);
  const firstWord = nameParts[0] || 'Apna';
  const restWords = nameParts.slice(1).join(' ');

  // Admin configured logo URL
  const adminLogo = branding?.appLogo;

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#FBFBFA] flex flex-col justify-between relative overflow-hidden font-sans select-none sm:py-6">
      {/* Container - Full-width on mobile (<640px), neatly centered on tablet/desktop */}
      <div className="w-full sm:max-w-md mx-auto min-h-screen min-h-[100dvh] sm:min-h-[820px] sm:max-h-[880px] bg-[#FBFBFA] flex flex-col justify-between relative overflow-hidden sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-neutral-200/70">
        
        {/* ─────────────────────────────────────────────────────────────
            ORGANIC PALE-GREEN ABSTRACT DECORATIVE SHAPES
        ───────────────────────────────────────────────────────────── */}
        <div 
          className="absolute -top-12 -left-12 w-48 h-48 bg-[#E6F3EE] rounded-full blur-2xl opacity-80 pointer-events-none"
          style={{ borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%' }}
        />
        <div 
          className="absolute -top-8 -right-8 w-44 h-44 bg-[#EAF5EF] rounded-full blur-2xl opacity-75 pointer-events-none"
          style={{ borderRadius: '40% 60% 35% 65% / 55% 45% 65% 35%' }}
        />
        <div 
          className="absolute top-1/2 -right-16 -translate-y-12 w-48 h-56 bg-[#EAF5EF] rounded-full blur-2xl opacity-70 pointer-events-none"
          style={{ borderRadius: '50% 50% 40% 60% / 60% 40% 60% 40%' }}
        />
        <div 
          className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#E5F2EC] rounded-full blur-2xl opacity-75 pointer-events-none"
          style={{ borderRadius: '55% 45% 60% 40% / 40% 60% 50% 50%' }}
        />

        {/* ─────────────────────────────────────────────────────────────
            1. TOP HEADER (LOCATION PIN ONLY — NO FAKE STATUS BAR)
        ───────────────────────────────────────────────────────────── */}
        <div className="pt-4 sm:pt-5 px-6 flex items-center justify-end relative z-20">
          <button 
            type="button" 
            onClick={() => navigate('/user/map')} 
            className="text-[#102030] hover:text-[#016A54] transition-colors p-1.5 rounded-full hover:bg-neutral-100/60 active:scale-95 cursor-pointer"
            aria-label="Nearby Map"
            title="Explore on Map"
          >
            <FiMapPin className="w-5 h-5 fill-[#102030] text-[#102030]" />
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. LOGO & BRAND SECTION (DYNAMIC FROM ADMIN SETTINGS)
        ───────────────────────────────────────────────────────────── */}
        <div className="px-6 pt-1 text-center relative z-20 flex flex-col items-center">
          {/* Logo Symbol + Text */}
          <div className="flex items-center justify-center gap-3">
            {/* Dynamic App Logo (Admin uploaded) or Fallback Bag Symbol */}
            <div className="relative w-13 h-13 sm:w-15 sm:h-15 flex items-center justify-center shrink-0">
              {adminLogo && !imgError ? (
                <img
                  src={adminLogo}
                  alt={fullAppName}
                  className="w-full h-full object-contain drop-shadow-xs rounded-xl"
                  onError={() => setImgError(true)}
                />
              ) : (
                <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-xs">
                  {/* Bag Handle */}
                  <path 
                    d="M23 23V16C23 11.0294 27.0294 7 32 7C36.9706 7 41 11.0294 41 16V23" 
                    stroke="#016A54" 
                    strokeWidth="4.5" 
                    strokeLinecap="round" 
                  />
                  {/* Bag Body Gradient */}
                  <defs>
                    <linearGradient id="bagGradient" x1="10" y1="18" x2="54" y2="58" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#0B7B61" />
                      <stop offset="100%" stopColor="#015241" />
                    </linearGradient>
                  </defs>
                  <rect x="11" y="19" width="42" height="38" rx="10" fill="url(#bagGradient)" />
                  {/* White Leaf Symbol on Bag */}
                  <path 
                    d="M32 26C32 26 43 27 43 38C43 45 37 47 32 47C27 47 21 45 21 38C21 27 32 26 32 26Z" 
                    fill="white" 
                  />
                  <path 
                    d="M32 27C32 27 32 42 24 45" 
                    stroke="#016A54" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                  />
                </svg>
              )}
            </div>

            {/* Dynamic Typography: Word 1 (Navy #102030) / Rest (Green #016A54) */}
            <div className="flex flex-col text-left leading-[0.95]">
              <span className="text-[26px] sm:text-[30px] font-black text-[#102030] tracking-tight">
                {firstWord}
              </span>
              {restWords ? (
                <span className="text-[26px] sm:text-[30px] font-black text-[#016A54] tracking-tight">
                  {restWords}
                </span>
              ) : null}
            </div>
          </div>

          {/* Tagline */}
          <p className="text-[11px] sm:text-[12px] font-semibold text-[#64748B] tracking-wide mt-2.5 flex items-center justify-center gap-1.5 sm:gap-2">
            <span>Local Shops</span>
            <span className="text-[#94A3B8]">&bull;</span>
            <span>Real People</span>
            <span className="text-[#94A3B8]">&bull;</span>
            <span>Better Choices</span>
          </p>

          {/* Main Heading */}
          <div className="mt-4 sm:mt-5">
            <h1 className="text-[25px] sm:text-[29px] font-black text-[#102030] tracking-tight leading-[1.18]">
              Discover <br />
              Local Businesses <br />
              <span className="text-[#016A54]">Near You</span>
            </h1>
          </div>

          {/* Sub-navigation categories */}
          <p className="text-[11.5px] sm:text-[12.5px] font-bold text-[#334155] tracking-wide mt-2.5 flex items-center justify-center gap-1.5 sm:gap-2">
            <span>Shop</span>
            <span className="text-[#94A3B8]">&bull;</span>
            <span>Dine</span>
            <span className="text-[#94A3B8]">&bull;</span>
            <span>Explore</span>
            <span className="text-[#94A3B8]">&bull;</span>
            <span>Support</span>
          </p>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. MAIN VISUAL: LOCAL STREET SHOPS ILLUSTRATION
        ───────────────────────────────────────────────────────────── */}
        <div className="relative w-full my-auto flex-1 min-h-[190px] max-h-[280px] sm:max-h-[310px] flex items-center justify-center z-10 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <img
              src="/welcome-storefront-exact.png"
              alt="Local Shops, Cafes, and Boutiques"
              className="w-full h-full object-cover object-bottom"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/welcome-shops-illustration.jpg';
              }}
            />

            {/* Smooth organic bottom wave overlay into off-white background */}
            <div className="absolute -bottom-1 left-0 right-0 h-10 bg-gradient-to-t from-[#FBFBFA] via-[#FBFBFA]/60 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. BOTTOM CTA & LOGIN SECTION
        ───────────────────────────────────────────────────────────── */}
        <div className="px-6 pb-6 pt-1 sm:pb-8 flex flex-col items-center text-center relative z-20 space-y-3.5">
          {/* Large Rounded Pill-Shaped Green Button */}
          <button
            type="button"
            onClick={() => navigate('/user')}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[#016A54] hover:bg-[#015846] text-white font-extrabold text-[15px] sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-md shadow-[#016A54]/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Get Started</span>
            <FiArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Bottom Login Text */}
          <p className="text-[12px] font-medium text-[#64748B]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/user/login')}
              className="text-[#016A54] font-extrabold hover:underline cursor-pointer ml-0.5"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
