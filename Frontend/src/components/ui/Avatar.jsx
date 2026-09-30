import React from 'react';
import { FiCheck } from 'react-icons/fi';

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const Avatar = ({
  src,
  name = '',
  size = 'md',
  verified = false,
  className = '',
  alt,
}) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`${SIZES[size] || SIZES.md} rounded-full object-cover border-2 border-white shadow-sm bg-neutral-100`}
        />
      ) : (
        <div
          className={`${SIZES[size] || SIZES.md} rounded-full flex items-center justify-center font-bold text-primary-700 bg-primary-100 border-2 border-white shadow-sm`}
          aria-label={name || 'Avatar'}
        >
          {initials}
        </div>
      )}
      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success-500 text-white flex items-center justify-center border-2 border-white"
          aria-label="Verified"
        >
          <FiCheck className="w-2.5 h-2.5" strokeWidth={3} />
        </span>
      )}
    </div>
  );
};

export default Avatar;
