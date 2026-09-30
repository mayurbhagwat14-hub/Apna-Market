import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiCopy, FiArrowLeft, FiGift } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookMessenger } from 'react-icons/fa';
import { useBranding } from '../../../../context/BrandingContext';
import { Button } from '../../../../components/ui';
import NotificationBell from '../../components/common/NotificationBell';
import { gradients } from '../../../../theme';

const ShareChip = ({ label, onClick, className, children }) => (
  <button type="button" onClick={onClick} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${className}`}>
      {children}
    </div>
    <span className="text-[10px] text-neutral-600 font-medium">{label}</span>
  </button>
);

const Rewards = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();

  const referralLink = useMemo(() => {
    const slug = (branding.appName || 'zevygo').toLowerCase().replace(/\s+/g, '');
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/user/signup?ref=${slug}`;
    }
    return `https://${slug}.com/refer`;
  }, [branding.appName]);

  const shareText = `Join me on ${branding.appName} — book trusted local services and get ₹100 off your first booking!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      toast.success('Link copied to clipboard!');
    });
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`, '_blank');
  };

  const handleShareMessenger = () => {
    window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const steps = [
    'Invite friends and get rewarded',
    'They get ₹100 on their first service',
    'You get ₹100 once their service is completed',
  ];

  return (
    <div className="min-h-screen pb-8 relative bg-neutral-50">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-100 px-4 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Button type="button" variant="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <FiArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FiGift className="w-5 h-5 text-primary-600" />
            <h1 className="text-lg font-bold text-neutral-900">Refer & Earn</h1>
          </div>
        </div>
        <NotificationBell />
      </header>

      <main className="relative z-10">
        <div className="px-4 py-5">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Refer and get free services</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Invite friends to try {branding.appName}. They get ₹100 off; you earn ₹100 after their first completed
                service.
              </p>
            </div>
            <div className="w-14 h-14 bg-warning-100 rounded-xl flex items-center justify-center shrink-0 text-2xl shadow-sm">
              🎁
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold text-neutral-600 mb-3 uppercase tracking-wide">Refer via</p>
            <div className="flex gap-4">
              <ShareChip label="WhatsApp" onClick={handleShareWhatsApp} className="bg-[#25D366] text-white">
                <FaWhatsapp className="w-6 h-6" />
              </ShareChip>
              <ShareChip label="Messenger" onClick={handleShareMessenger} className="bg-[#0084FF] text-white">
                <FaFacebookMessenger className="w-6 h-6" />
              </ShareChip>
              <ShareChip label="Copy link" onClick={handleCopyLink} className="bg-primary-600 text-white">
                <FiCopy className="w-5 h-5" />
              </ShareChip>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 bg-white rounded-t-3xl shadow-sm border-t border-neutral-100">
          <h3 className="text-base font-bold text-neutral-900 mb-4">How it works</h3>
          <ol className="space-y-4">
            {steps.map((text, i) => (
              <li key={text} className="flex gap-3">
                <span className="w-7 h-7 shrink-0 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center border border-primary-100">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-600 pt-1">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="px-4 py-4 border-t border-neutral-100 bg-white">
          <div className="flex flex-wrap items-center gap-2 text-primary-600 text-xs">
            <button type="button" className="hover:underline font-medium">
              Terms and conditions
            </button>
            <span className="text-neutral-300">•</span>
            <button type="button" className="hover:underline font-medium">
              FAQs
            </button>
          </div>
        </div>

        <div className="px-4 py-5 bg-white border-t border-neutral-100">
          <h2 className="text-base font-bold text-neutral-800 mb-1">You are yet to earn any scratch cards</h2>
          <p className="text-xs text-neutral-500 mb-4">Start referring to unlock surprises</p>
          <div className="flex items-center gap-3 pt-2 border-t border-dotted border-neutral-200">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center shrink-0 text-xl">
              🎁
            </div>
            <p className="text-sm text-neutral-800 font-medium">Earn ₹100 on every successful referral</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Rewards;
