import React from 'react';
import LogoLoader from '../common/LogoLoader';

/** Lightweight spinner using brand ring */
export const Spinner = ({ size = 'md', className = '', label = 'Loading' }) => {
  const sizeClass = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  }[size] || 'w-8 h-8 border-2';

  return (
    <div
      className={`inline-block rounded-full border-primary-200 border-t-primary-500 animate-spin ${sizeClass} ${className}`}
      role="status"
      aria-label={label}
    />
  );
};

/** Full-page / section loader — wraps existing LogoLoader */
export const Loader = ({ fullScreen = true, message }) => (
  <div className={fullScreen ? 'min-h-[40vh] flex flex-col items-center justify-center gap-3' : 'flex items-center gap-3'}>
    <LogoLoader fullScreen={false} inline size={fullScreen ? 'w-16 h-16' : 'w-8 h-8'} />
    {message && <p className="text-sm text-neutral-500 font-medium">{message}</p>}
  </div>
);

export default Spinner;
