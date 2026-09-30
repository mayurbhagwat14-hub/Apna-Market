import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiShield, FiClock, FiAward, FiGlobe, FiSmile, FiSmartphone, FiBriefcase } from 'react-icons/fi';
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

  const brandTextClass = 'bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent';

  const features = [
    { icon: FiBriefcase, title: 'Steady jobs', description: 'Get matched with customers in your area' },
    { icon: FiShield, title: 'Secure payouts', description: 'Transparent earnings in your wallet' },
    { icon: FiClock, title: 'Flexible schedule', description: 'Accept work that fits your day' },
    { icon: FiAward, title: 'Grow your brand', description: 'Build ratings and repeat business' },
  ];

  const stats = [
    { number: '10K+', label: 'Happy Customers' },
    { number: '500+', label: 'Service Partners' },
    { number: '4.8', label: 'Partner Rating' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-neutral-50 pb-10 relative">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />

      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-neutral-100 relative">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button type="button" variant="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <FiArrowLeft className="w-5 h-5" />
          </Button>
          <span className={`text-xl font-bold ${brandTextClass}`}>About {branding.appName}</span>
        </div>
      </header>

      <main className="px-5 py-6 space-y-8 relative z-10 max-w-lg mx-auto">
        <div className="animate-item text-center">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-[-3px] rounded-full opacity-70 bg-gradient-to-r from-primary-500 via-secondary-400 to-primary-600 animate-spin [animation-duration:4s]" />
            <div className="absolute inset-0 bg-white rounded-full shadow-lg flex items-center justify-center">
              <Logo className="w-16 h-16 object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
            Partner with <span className={brandTextClass}>{branding.appName}</span>
          </h1>
          <p className="text-neutral-500 max-w-xs mx-auto leading-relaxed">
            Grow your service business with verified bookings and on-time payouts.
          </p>
        </div>

        <div className="animate-item flex justify-between bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 divide-x divide-neutral-100">
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1 text-center px-2">
              <div className={`text-xl font-bold ${brandTextClass}`}>{stat.number}</div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="animate-item">
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-6 border border-primary-100 relative overflow-hidden">
            <FiGlobe className="absolute top-0 right-0 p-4 w-24 h-24 text-primary-200 opacity-40" />
            <h3 className="text-lg font-bold text-neutral-800 mb-3 relative z-10">Our mission</h3>
            <p className="text-sm text-neutral-600 leading-relaxed relative z-10">
              {branding.appName} connects skilled partners with customers who need reliable home and personal services.
            </p>
          </div>
        </div>

        <div className="animate-item">
          <h3 className="text-lg font-bold text-neutral-800 mb-4 px-1">Why partners choose us</h3>
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
          <h3 className="text-lg font-bold text-neutral-800 mb-4 px-1">How it works</h3>
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-neutral-100">
            {[
              { title: 'Get alerts', desc: 'New jobs in your service area', icon: FiSmartphone },
              { title: 'Accept & go', desc: 'Claim jobs and navigate to the customer', icon: FiUsers },
              { title: 'Get paid', desc: 'Complete work and track earnings', icon: FiSmile },
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
          <p className="text-[10px] text-neutral-300 mt-4">Partner app • Made with care in India</p>
        </div>
      </main>
    </div>
  );
};

export default AboutApp;
