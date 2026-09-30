import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiBriefcase, FiCheckCircle, FiArrowUp } from 'react-icons/fi';
import { FaWallet, FaRegMoneyBillAlt } from 'react-icons/fa';

const StatsCards = memo(({ stats }) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Today's Earnings",
      value: `₹${stats.todayEarnings.toLocaleString()}`,
      icon: FaRegMoneyBillAlt,
      iconBg: 'bg-[#EEF2FF]',
      iconColor: 'text-[#016A54]',
      subtitle: (
        <span className="flex items-center text-[#016A54] font-bold text-[11px]">
          <FiArrowUp className="w-3 h-3 mr-0.5" strokeWidth={3} /> 12.5% <span className="text-gray-400 ml-1 font-medium">from yesterday</span>
        </span>
      ),
      chartColor: '#016A54',
      onClick: () => navigate('/vendor/wallet'),
    },
    {
      title: 'New Requests',
      value: stats.pendingAlerts,
      icon: FiClock,
      iconBg: 'bg-[#F5F3FF]',
      iconColor: 'text-[#8B5CF6]',
      subtitle: <span className="text-gray-400 text-[11px] font-medium">{stats.pendingAlerts === 0 ? 'No pending requests' : 'Open Jobs to review'}</span>,
      chartColor: '#C4B5FD',
      onClick: () => navigate('/vendor/jobs'),
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs,
      icon: FiBriefcase,
      iconBg: 'bg-[#ECFDF5]',
      iconColor: 'text-[#10B981]',
      subtitle: <span className="text-gray-400 text-[11px] font-medium">{stats.activeJobs === 0 ? 'No active jobs' : 'All active jobs'}</span>,
      chartColor: '#6EE7B7',
      onClick: () => navigate('/vendor/jobs'),
    },
    {
      title: 'Completed Jobs',
      value: stats.completedJobs,
      icon: FiCheckCircle,
      iconBg: 'bg-[#FFF7ED]',
      iconColor: 'text-[#F97316]',
      subtitle: <span className="text-gray-400 text-[11px] font-medium">All time completed</span>,
      chartColor: '#FDBA74',
      onClick: () => navigate('/vendor/jobs'),
    },
  ];

  return (
    <div className="px-4 pt-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {cards.map((card, index) => {
          const IconComponent = card.icon;

          return (
            <button
              key={card.title}
              type="button"
              onClick={card.onClick}
              className="bg-white rounded-[24px] p-4 text-left shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-all active:scale-[0.98] flex flex-col justify-between min-h-[145px] relative overflow-hidden"
            >
              <div className="flex items-center gap-2.5 mb-4 relative z-10">
                <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <p className="text-[12px] text-gray-800 font-medium tracking-tight leading-tight">
                  {card.title}
                </p>
              </div>
              
              <div className="relative z-10">
                <p className="text-[28px] font-black text-gray-900 mb-1.5 leading-none tracking-tight">
                  {card.value}
                </p>
                {card.subtitle}
              </div>

              {/* Decorative Mini Line Chart in Background */}
              <div className="absolute bottom-0 right-0 w-24 h-16 pointer-events-none opacity-80">
                <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <path d="M0,40 L20,30 L40,35 L60,15 L80,25 L100,5" fill="none" stroke={card.chartColor} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M0,40 L20,30 L40,35 L60,15 L80,25 L100,5 L100,50 L0,50 Z" fill={`url(#grad-${index})`} opacity="0.3" />
                  <defs>
                    <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: card.chartColor, stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: card.chartColor, stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="5" r="3" fill={card.chartColor} />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

StatsCards.displayName = 'VendorStatsCards';
export default StatsCards;
