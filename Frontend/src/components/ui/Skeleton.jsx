import React from 'react';

const ROUND = {
  none: 'rounded-none',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

export const Skeleton = ({ className = '', width, height, rounded = 'xl' }) => (
  <div
    className={`bg-neutral-200 animate-pulse ${ROUND[rounded] || ROUND.xl} ${className}`}
    style={{ width, height }}
    aria-hidden
  />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="0.75rem"
        className={i === lines - 1 ? 'w-2/3' : 'w-full'}
        rounded="md"
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = '2.5rem' }) => (
  <Skeleton width={size} height={size} rounded="full" className="shrink-0" />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white border border-neutral-100 rounded-3xl p-4 ${className}`}>
    <div className="flex gap-3 animate-pulse">
      <SkeletonAvatar size="3.5rem" />
      <div className="flex-1 space-y-2">
        <Skeleton height="1rem" className="w-1/2" rounded="md" />
        <Skeleton height="0.75rem" className="w-3/4" rounded="md" />
        <Skeleton height="0.75rem" className="w-1/3" rounded="md" />
      </div>
    </div>
  </div>
);

export default Skeleton;
