import React from 'react';
import SimpleServiceCard from '../../../components/common/SimpleServiceCard';
import { themeColors } from '../../../../../theme';

const ServiceCategorySection = ({ title, services, onSeeAllClick, onServiceClick }) => {
  return (
    <div className="mb-8">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
      </div>

      {/* Horizontal Scrollable Service Cards */}
      <div className="flex gap-3.5 sm:gap-4 overflow-x-auto px-4 pb-3 pt-1 scrollbar-hide snap-x snap-mandatory">
        {services.map((service) => (
          <SimpleServiceCard
            key={service.id}
            title={service.title}
            image={service.image}
            onClick={() => onServiceClick?.(service)}
          />
        ))}
      </div>
    </div>
  );
};

export default ServiceCategorySection;

