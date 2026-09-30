import React from 'react';
import { 
  FaCarSide, 
  FaHelmetSafety, 
  FaUtensils, 
  FaMusic, 
  FaCamera, 
  FaHospital, 
  FaHouse, 
  FaRing, 
  FaUserShield, 
  FaBroom, 
  FaBolt, 
  FaFaucetDrip, 
  FaSnowflake, 
  FaBug
} from 'react-icons/fa6';
import { GiWashingMachine } from 'react-icons/gi';
import { TbChefHat } from 'react-icons/tb';
import { HiSparkles } from 'react-icons/hi2';

const categoryConfigMap = {
  // Driver
  'driver': {
    Icon: FaCarSide,
    bgGradient: 'from-blue-600 via-blue-500 to-indigo-600',
    glow: 'rgba(1, 106, 84, 0.4)',
  },
  'driver-booking': {
    Icon: FaCarSide,
    bgGradient: 'from-blue-600 via-blue-500 to-indigo-600',
    glow: 'rgba(1, 106, 84, 0.4)',
  },

  // Cook / Maharaj
  'cook': {
    Icon: TbChefHat,
    bgGradient: 'from-amber-500 via-orange-500 to-red-500',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  'cook-maharaj': {
    Icon: TbChefHat,
    bgGradient: 'from-amber-500 via-orange-500 to-red-500',
    glow: 'rgba(245, 158, 11, 0.4)',
  },

  // Worker / Helper
  'worker': {
    Icon: FaHelmetSafety,
    bgGradient: 'from-yellow-400 via-amber-500 to-orange-500',
    glow: 'rgba(234, 179, 8, 0.4)',
  },
  'worker-helper': {
    Icon: FaHelmetSafety,
    bgGradient: 'from-yellow-400 via-amber-500 to-orange-500',
    glow: 'rgba(234, 179, 8, 0.4)',
  },

  // Tiffin Service
  'tiffin': {
    Icon: FaUtensils,
    bgGradient: 'from-emerald-500 via-primary-600 to-green-600',
    glow: 'rgba(16, 185, 129, 0.4)',
  },

  // DJ Sound
  'dj-sound': {
    Icon: FaMusic,
    bgGradient: 'from-purple-600 via-violet-600 to-indigo-700',
    glow: 'rgba(147, 51, 234, 0.4)',
  },

  // Photographer & Videographer
  'photographer-videographer': {
    Icon: FaCamera,
    bgGradient: 'from-rose-500 via-pink-600 to-red-600',
    glow: 'rgba(244, 63, 94, 0.4)',
  },

  // Makeup Artist
  'makeup-artist': {
    Icon: HiSparkles,
    bgGradient: 'from-fuchsia-500 via-pink-500 to-rose-600',
    glow: 'rgba(217, 70, 239, 0.4)',
  },

  // Healthcare & Nursing
  'healthcare-nurse-attendant': {
    Icon: FaHospital,
    bgGradient: 'from-emerald-500 via-primary-600 to-primary-700',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  'healthcare': {
    Icon: FaHospital,
    bgGradient: 'from-emerald-500 via-primary-600 to-primary-700',
    glow: 'rgba(16, 185, 129, 0.4)',
  },

  // Room Rental
  'room-rental': {
    Icon: FaHouse,
    bgGradient: 'from-primary-500 via-primary-600 to-indigo-600',
    glow: 'rgba(1, 106, 84, 0.4)',
  },

  // Marriage Hall
  'marriage-hall': {
    Icon: FaRing,
    bgGradient: 'from-violet-600 via-purple-600 to-pink-600',
    glow: 'rgba(139, 92, 246, 0.4)',
  },

  // Security Guard
  'security-guard': {
    Icon: FaUserShield,
    bgGradient: 'from-slate-700 via-slate-800 to-zinc-900',
    glow: 'rgba(51, 65, 85, 0.4)',
  },

  // Housekeeping
  'housekeeping': {
    Icon: FaBroom,
    bgGradient: 'from-primary-500 via-primary-600 to-primary-700',
    glow: 'rgba(1, 106, 84, 0.4)',
  },

  // Electrician
  'electrician': {
    Icon: FaBolt,
    bgGradient: 'from-amber-400 via-yellow-500 to-orange-500',
    glow: 'rgba(245, 158, 11, 0.4)',
  },

  // Plumber
  'plumbers': {
    Icon: FaFaucetDrip,
    bgGradient: 'from-primary-500 via-primary-500 to-primary-700',
    glow: 'rgba(59, 130, 246, 0.4)',
  },

  // AC & Appliances
  'appliance-service': {
    Icon: FaSnowflake,
    bgGradient: 'from-primary-400 via-primary-500 to-primary-700',
    glow: 'rgba(1, 106, 84, 0.4)',
  },
  'ac': {
    Icon: FaSnowflake,
    bgGradient: 'from-primary-400 via-primary-500 to-primary-700',
    glow: 'rgba(1, 106, 84, 0.4)',
  },
  'fridge': {
    Icon: FaSnowflake,
    bgGradient: 'from-primary-500 via-indigo-600 to-primary-600',
    glow: 'rgba(1, 106, 84, 0.4)',
  },
  'washing-machine': {
    Icon: GiWashingMachine,
    bgGradient: 'from-primary-500 via-primary-600 to-indigo-600',
    glow: 'rgba(1, 106, 84, 0.4)',
  },

  // Pest Control
  'pest-control': {
    Icon: FaBug,
    bgGradient: 'from-rose-600 via-red-600 to-amber-700',
    glow: 'rgba(225, 29, 72, 0.4)',
  },
};

const getDefaultConfig = (slugOrTitle = '') => {
  const normalized = (slugOrTitle || '').toLowerCase();
  if (normalized.includes('driver')) return categoryConfigMap['driver'];
  if (normalized.includes('cook') || normalized.includes('maharaj')) return categoryConfigMap['cook'];
  if (normalized.includes('worker') || normalized.includes('helper')) return categoryConfigMap['worker'];
  if (normalized.includes('tiffin')) return categoryConfigMap['tiffin'];
  if (normalized.includes('dj') || normalized.includes('sound') || normalized.includes('music')) return categoryConfigMap['dj-sound'];
  if (normalized.includes('photo') || normalized.includes('video') || normalized.includes('camera')) return categoryConfigMap['photographer-videographer'];
  if (normalized.includes('makeup') || normalized.includes('beauty')) return categoryConfigMap['makeup-artist'];
  if (normalized.includes('nurse') || normalized.includes('health') || normalized.includes('medical') || normalized.includes('care')) return categoryConfigMap['healthcare'];
  if (normalized.includes('room') || normalized.includes('rent')) return categoryConfigMap['room-rental'];
  if (normalized.includes('marriage') || normalized.includes('hall') || normalized.includes('wedding') || normalized.includes('venue')) return categoryConfigMap['marriage-hall'];
  if (normalized.includes('security') || normalized.includes('guard')) return categoryConfigMap['security-guard'];
  if (normalized.includes('clean') || normalized.includes('housekeeping') || normalized.includes('maid')) return categoryConfigMap['housekeeping'];
  if (normalized.includes('electric')) return categoryConfigMap['electrician'];
  if (normalized.includes('plumb')) return categoryConfigMap['plumber'];
  if (normalized.includes('wash')) return categoryConfigMap['washing-machine'];
  if (normalized.includes('fridge') || normalized.includes('refriger')) return categoryConfigMap['fridge'];
  if (normalized.includes('ac') || normalized.includes('cool') || normalized.includes('appliance')) return categoryConfigMap['ac'];
  if (normalized.includes('pest') || normalized.includes('bug')) return categoryConfigMap['pest-control'];

  return {
    Icon: HiSparkles,
    bgGradient: 'from-blue-600 via-indigo-600 to-purple-600',
    glow: 'rgba(1, 106, 84, 0.4)',
  };
};

const CategoryIcon = ({ slug = '', title = '', size = 'md', className = '' }) => {
  const config = categoryConfigMap[slug?.toLowerCase()] || getDefaultConfig(slug || title);
  const safeConfig = config || getDefaultConfig('');
  const Icon = safeConfig.Icon || HiSparkles;
  const bgGradient = safeConfig.bgGradient || 'from-blue-600 via-indigo-600 to-purple-600';
  const glow = safeConfig.glow || 'rgba(1, 106, 84, 0.4)';

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl text-lg',
    md: 'w-12 h-12 sm:w-13 sm:h-13 rounded-2xl text-xl',
    lg: 'w-16 h-16 rounded-2xl text-2xl',
  }[size] || 'w-12 h-12 sm:w-13 sm:h-13 rounded-2xl text-xl';

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size] || 'w-6 h-6';

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-tr ${bgGradient} text-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${sizeClasses} ${className}`}
      style={{
        boxShadow: `0 6px 18px ${glow}`,
      }}
    >
      {/* Subtle glossy sheen line */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/30 via-transparent to-black/15 pointer-events-none" />
      <Icon className={`${iconSizes} relative z-10 filter drop-shadow-sm`} />
    </div>
  );
};

export default CategoryIcon;
