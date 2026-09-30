import React from 'react';
import CategoryCard from '../../../components/common/CategoryCard';
import { resolveCategoryBookingMode } from '../../../../../utils/listingBookingMode';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

// Curated high-res aesthetic category photos (used if DB image isn't set yet)
const defaultAestheticCategoryImages = {
  'driver': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&auto=format&fit=crop&q=80',
  'driver-booking': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&auto=format&fit=crop&q=80',
  'cook': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80',
  'cook-maharaj': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80',
  'worker': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
  'worker-helper': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
  'tiffin': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
  'dj-sound': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
  'photographer-videographer': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80',
  'makeup-artist': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&auto=format&fit=crop&q=80',
  'healthcare-nurse-attendant': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
  'healthcare': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
  'room-rental': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&auto=format&fit=crop&q=80',
  'marriage-hall': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop&q=80',
  'security-guard': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&auto=format&fit=crop&q=80',
  'housekeeping': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80',
  'electrician': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
  'plumber': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop&q=80',
  'appliance-service': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80',
  'ac': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80',
  'fridge': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80',
  'washing-machine': 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&auto=format&fit=crop&q=80',
  'pest-control': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
};

const getDefaultAestheticImage = (slug = '', title = '') => {
  const normSlug = (slug || '').toLowerCase();
  if (defaultAestheticCategoryImages[normSlug]) return defaultAestheticCategoryImages[normSlug];
  
  const normTitle = (title || '').toLowerCase();
  if (normTitle.includes('driver')) return defaultAestheticCategoryImages['driver'];
  if (normTitle.includes('cook') || normTitle.includes('maharaj')) return defaultAestheticCategoryImages['cook'];
  if (normTitle.includes('worker') || normTitle.includes('helper')) return defaultAestheticCategoryImages['worker'];
  if (normTitle.includes('tiffin')) return defaultAestheticCategoryImages['tiffin'];
  if (normTitle.includes('dj') || normTitle.includes('sound') || normTitle.includes('music')) return defaultAestheticCategoryImages['dj-sound'];
  if (normTitle.includes('photo') || normTitle.includes('video') || normTitle.includes('camera')) return defaultAestheticCategoryImages['photographer-videographer'];
  if (normTitle.includes('makeup') || normTitle.includes('beauty')) return defaultAestheticCategoryImages['makeup-artist'];
  if (normTitle.includes('nurse') || normTitle.includes('health') || normTitle.includes('medical')) return defaultAestheticCategoryImages['healthcare'];
  if (normTitle.includes('room') || normTitle.includes('rent')) return defaultAestheticCategoryImages['room-rental'];
  if (normTitle.includes('marriage') || normTitle.includes('hall') || normTitle.includes('wedding')) return defaultAestheticCategoryImages['marriage-hall'];
  if (normTitle.includes('security') || normTitle.includes('guard')) return defaultAestheticCategoryImages['security-guard'];
  if (normTitle.includes('clean') || normTitle.includes('housekeeping')) return defaultAestheticCategoryImages['housekeeping'];
  if (normTitle.includes('electric')) return defaultAestheticCategoryImages['electrician'];
  if (normTitle.includes('plumb')) return defaultAestheticCategoryImages['plumber'];
  if (normTitle.includes('wash')) return defaultAestheticCategoryImages['washing-machine'];
  if (normTitle.includes('fridge') || normTitle.includes('refriger')) return defaultAestheticCategoryImages['fridge'];
  if (normTitle.includes('ac') || normTitle.includes('appliance')) return defaultAestheticCategoryImages['ac'];
  if (normTitle.includes('pest')) return defaultAestheticCategoryImages['pest-control'];

  return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80';
};

const ServiceCategories = React.memo(({ categories, onCategoryClick, onSeeAllClick }) => {
  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  // Display top 8 categories on the Home grid for a perfect 4x2 mobile layout
  const displayedCategories = categories.slice(0, 8);

  return (
    <div className="space-y-2.5 my-1">
      {/* Title Bar: Our Services | View All */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-slate-900 font-extrabold text-base sm:text-lg tracking-tight">
          Our Services
        </h2>
        <button
          type="button"
          onClick={onSeeAllClick}
          className="text-primary-500 hover:text-primary-600 text-xs font-bold transition-colors cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* 4-Column Grid Layout on Mobile for Compact Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {displayedCategories.map((category, index) => {
          const slug = category.slug?.toLowerCase();
          const dbIcon = category.homeIconUrl || category.imageUrl || category.icon || category.image;
          const imageSrc = dbIcon ? toAssetUrl(dbIcon) : getDefaultAestheticImage(slug, category.title);

          return (
            <div key={category.id || category._id || index} className="w-full">
              <CategoryCard
                title={category.title}
                icon={
                  <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200/80 relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={imageSrc}
                      alt={category.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                }
                onClick={() => onCategoryClick?.(category)}
                hasSaleBadge={category.hasSaleBadge}
                bookingMode={resolveCategoryBookingMode(category)}
                index={index}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

ServiceCategories.displayName = 'ServiceCategories';

export default ServiceCategories;
