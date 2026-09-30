import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiGift, FiCamera, FiLayers, FiShare2, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const QuickMarketingActions = memo(({ onOpenOfferModal, onOpenPhotoModal, storeName = 'My Shop' }) => {
  const navigate = useNavigate();

  const handleShareStore = () => {
    const storeUrl = window.location.origin;
    if (navigator.share) {
      navigator.share({
        title: `${storeName} on Apna Market`,
        text: `Discover ${storeName} on Apna Market! Check out our store photos, catalog & exclusive deals:`,
        url: storeUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(storeUrl);
      toast.success('Store link copied to clipboard!');
    }
  };

  const actions = [
    {
      id: 'offer',
      title: 'Post New Offer',
      subtitle: 'Launch store deals & discounts',
      icon: FiGift,
      bg: 'from-[#016A54] to-[#014D3D]',
      iconBg: 'bg-white/20',
      textColor: 'text-white',
      badge: 'High Footfall',
      onClick: onOpenOfferModal
    },
    {
      id: 'photo',
      title: 'Upload Store Photo',
      subtitle: 'Storefront & interior showcase',
      icon: FiCamera,
      bg: 'from-[#D97706] to-[#B45309]',
      iconBg: 'bg-white/20',
      textColor: 'text-white',
      badge: 'Storefront',
      onClick: onOpenPhotoModal
    },
    {
      id: 'catalog',
      title: 'Catalog & Menu',
      subtitle: 'Manage items & pricing',
      icon: FiLayers,
      bg: 'from-[#4F46E5] to-[#3730A3]',
      iconBg: 'bg-white/20',
      textColor: 'text-white',
      badge: 'Products',
      onClick: () => navigate('/vendor/my-services')
    },
    {
      id: 'promote',
      title: 'Share & Promote',
      subtitle: 'Share shop link on WhatsApp',
      icon: FiShare2,
      bg: 'from-[#0D9488] to-[#0F766E]',
      iconBg: 'bg-white/20',
      textColor: 'text-white',
      badge: '1-Click',
      onClick: handleShareStore
    },
    {
      id: 'subscribe',
      title: 'Subscribe & Advertise',
      subtitle: 'Boost your shop visibility',
      icon: FiGift,
      bg: 'from-[#7C3AED] to-[#5B21B6]',
      iconBg: 'bg-white/20',
      textColor: 'text-white',
      badge: '⚡ Boost',
      onClick: () => navigate('/vendor/subscription')
    }
  ];

  return (
    <div className="px-4 pt-3">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((act) => {
          const IconComp = act.icon;

          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className={`relative overflow-hidden rounded-3xl p-4 text-left bg-gradient-to-br ${act.bg} ${act.textColor} shadow-md shadow-black/5 active:scale-97 transition-all flex flex-col justify-between min-h-[110px] group`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`w-9 h-9 rounded-2xl ${act.iconBg} backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 group-hover:scale-110 transition-transform`}>
                  <IconComp className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                  {act.badge}
                </span>
              </div>

              <div>
                <p className="text-[14px] font-black tracking-tight leading-snug flex items-center justify-between">
                  <span>{act.title}</span>
                  <FiChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </p>
                <p className="text-[11px] opacity-85 font-medium truncate mt-0.5">
                  {act.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

QuickMarketingActions.displayName = 'QuickMarketingActions';
export default QuickMarketingActions;
