import React, { memo } from 'react';
import { FiUsers, FiCheckCircle, FiClock } from 'react-icons/fi';

const TrustStatsRow = memo(() => {
  const stats = [
    {
      id: 1,
      icon: FiUsers,
      value: '10,000+',
      label: 'Happy Users',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      borderColor: 'border-primary-100'
    },
    {
      id: 2,
      icon: FiCheckCircle,
      value: '99.4%',
      label: 'Satisfaction',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-500',
      borderColor: 'border-primary-100'
    },
    {
      id: 3,
      icon: FiClock,
      value: '24/7',
      label: 'Support',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      borderColor: 'border-primary-100'
    }
  ];

  return (
    <div className="my-4">
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className={`${stat.bgColor} border ${stat.borderColor} rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-xs transition-transform active:scale-95`}
            >
              <div className={`w-8 h-8 rounded-xl ${stat.bgColor} flex items-center justify-center mb-1 ${stat.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">
                {stat.value}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 truncate max-w-full">
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

TrustStatsRow.displayName = 'TrustStatsRow';

export default TrustStatsRow;
