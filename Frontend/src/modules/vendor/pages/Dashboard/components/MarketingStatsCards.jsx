import React, { memo } from 'react';
import { FiEye, FiTag, FiCheckCircle, FiPhoneCall, FiTrendingUp, FiArrowUpRight } from 'react-icons/fi';

const MarketingStatsCards = memo(({ stats = {}, onOpenOffers, onOpenPhotos }) => {
  const cards = [
    {
      title: 'Store Impressions',
      value: (stats.storeViews || 1480).toLocaleString(),
      label: 'Local Views',
      icon: FiEye,
      iconBg: 'bg-[#EEF8F5]',
      iconColor: 'text-[#016A54]',
      badge: '+24% this week',
      badgeColor: 'text-[#016A54] bg-[#016A54]/10',
      chartColor: '#016A54',
      onClick: null
    },
    {
      title: 'Active Store Offers',
      value: stats.activeOffersCount !== undefined ? stats.activeOffersCount : 2,
      label: 'Deals Live',
      icon: FiTag,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      badge: 'Live on User App',
      badgeColor: 'text-amber-700 bg-amber-100/70',
      chartColor: '#D97706',
      onClick: onOpenOffers
    },
    {
      title: 'Offer Claims & Taps',
      value: (stats.offerClicks || 215).toLocaleString(),
      label: 'Customer Clicks',
      icon: FiCheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      badge: 'High Conversion',
      badgeColor: 'text-emerald-700 bg-emerald-100/70',
      chartColor: '#10B981',
      onClick: onOpenOffers
    },
    {
      title: 'Customer Inquiries',
      value: (stats.inquiriesCalls || 38).toLocaleString(),
      label: 'Calls & Visits',
      icon: FiPhoneCall,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      badge: 'Direct Leads',
      badgeColor: 'text-indigo-700 bg-indigo-100/70',
      chartColor: '#6366F1',
      onClick: null
    }
  ];

  return (
    <div className="px-4 pt-3">
      <div className="grid grid-cols-2 gap-3.5 mb-2">
        {cards.map((card, index) => {
          const IconComponent = card.icon;

          return (
            <div
              key={card.title}
              onClick={card.onClick || undefined}
              className={`bg-white rounded-3xl p-4 text-left shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between min-h-[148px] relative overflow-hidden ${card.onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <IconComponent className={`w-4.5 h-4.5 ${card.iconColor}`} />
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${card.badgeColor} flex items-center gap-0.5`}>
                  {card.badge}
                </span>
              </div>

              {/* Value and Label */}
              <div className="relative z-10">
                <p className="text-[26px] font-black text-gray-900 leading-none tracking-tight mb-1">
                  {card.value}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-gray-600 font-bold tracking-tight">
                    {card.title}
                  </p>
                  {card.onClick && (
                    <FiArrowUpRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                </div>
              </div>

              {/* Decorative Curve Vector in Card Background */}
              <div className="absolute -bottom-2 -right-2 w-28 h-14 pointer-events-none opacity-40">
                <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <path
                    d={index % 2 === 0 ? "M0,35 Q30,10 60,25 T100,5" : "M0,25 Q40,5 70,30 T100,10"}
                    fill="none"
                    stroke={card.chartColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d={index % 2 === 0 ? "M0,35 Q30,10 60,25 T100,5 L100,40 L0,40 Z" : "M0,25 Q40,5 70,30 T100,10 L100,40 L0,40 Z"}
                    fill={card.chartColor}
                    opacity="0.15"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

MarketingStatsCards.displayName = 'MarketingStatsCards';
export default MarketingStatsCards;
