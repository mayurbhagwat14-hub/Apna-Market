import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiShield, FiClock, FiAward, FiGlobe, FiSmile, FiSmartphone } from 'react-icons/fi';
import { gsap } from 'gsap';
import Logo from '../../../../components/common/Logo';
import { useBranding } from '../../../../context/BrandingContext';
import { gradients } from '../../../../theme';
import { Button } from '../../../../components/ui';

const AboutApp = () => {
  const { branding } = useBranding();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.animate-item', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const brandTextClass = 'text-[#016A54]';

  const features = [
    { icon: FiUsers, title: 'Local Businesses', description: 'Explore top rated shops and services in your neighborhood' },
    { icon: FiShield, title: 'Verified Addresses', description: 'Direct GPS navigation & verified business contact numbers' },
    { icon: FiClock, title: 'Live Store Hours', description: 'Accurate operating hours and active store status' },
    { icon: FiAward, title: 'Exclusive Deals', description: 'Save money with discounts and weekend flash offers' },
  ];

  const stats = [
    { number: '500+', label: 'Local Shops' },
    { number: '20K+', label: 'Monthly Visitors' },
    { number: '4.8', label: 'App Rating' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FBFBFA] pb-24 relative w-full max-w-lg mx-auto shadow-xs font-sans text-neutral-900">
      <header className="bg-white/95 backdrop-blur-md shadow-2xs sticky top-0 z-30 border-b border-[#F0F2F1] px-4 py-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-[#F5F7F6] flex items-center justify-center text-neutral-800 hover:bg-[#EAEFEA] active:scale-95 transition-all"
          aria-label="Go back"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-bold text-neutral-900">About Apna Market</span>
      </header>

      <main className="px-5 py-6 space-y-7 relative z-10">
        <div className="animate-item text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute inset-0 bg-[#EDF8F5] rounded-full shadow-inner flex items-center justify-center border-2 border-[#016A54]/20">
              <Logo className="w-16 h-16 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mb-1">
            Welcome to <span className={brandTextClass}>Apna Market</span>
          </h1>
          <p className="text-neutral-500 text-xs max-w-xs mx-auto leading-relaxed font-medium">
            Your neighborhood discovery marketplace for local shops, restaurants, fashion, and services in Indore.
          </p>
        </div>

        <div className="animate-item flex justify-between bg-white rounded-2xl p-5 shadow-2xs border border-neutral-150/80 divide-x divide-neutral-100">
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1 text-center px-2">
              <div className="text-lg font-black text-[#016A54]">{stat.number}</div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="animate-item">
          <div className="bg-gradient-to-br from-[#EDF8F5] to-emerald-50 rounded-2xl p-5 border border-[#ADE2D7]/50 relative overflow-hidden">
            <FiGlobe className="absolute top-0 right-0 p-4 w-24 h-24 text-[#016A54] opacity-15" />
            <h3 className="text-base font-bold text-[#014A3B] mb-2 relative z-10">Our Mission</h3>
            <p className="text-xs text-neutral-700 leading-relaxed relative z-10 font-medium">
              Empowering local Indian shop owners by connecting them directly with nearby customers—without intermediaries or high commission fees.
            </p>
          </div>
        </div>

        <div className="animate-item">
          <h3 className="text-sm font-bold text-neutral-900 mb-3 px-1">Why choose Apna Market?</h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-primary-50 text-primary-600">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-neutral-800 mb-1">{feature.title}</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-item">
          <h3 className="text-lg font-bold text-neutral-800 mb-4 px-1">How we work</h3>
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-neutral-100">
            {[
              { title: 'Book details', desc: 'Select service and schedule time', icon: FiSmartphone },
              { title: 'Get matched', desc: 'We assign a top-rated pro', icon: FiUsers },
              { title: 'Relax', desc: 'Enjoy quality service', icon: FiSmile },
            ].map((step, i) => (
              <div key={step.title} className="flex items-center p-4 border-b last:border-0 border-neutral-50">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-4 shadow-sm text-white font-bold text-lg bg-gradient-to-br from-primary-600 to-secondary-500">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-800">{step.title}</h4>
                  <p className="text-xs text-neutral-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-item text-center pt-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-400 mb-1">Designed & developed by</p>
          <span className={`text-sm font-bold tracking-wide ${brandTextClass}`}>{branding.appName} Team</span>
          <p className="text-[10px] text-neutral-300 mt-4">v7.6.27 • Made with care in India</p>
        </div>
      </main>
    </div>
  );
};

export default AboutApp;
