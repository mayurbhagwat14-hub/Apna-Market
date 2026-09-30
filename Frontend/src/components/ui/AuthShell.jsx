import React from 'react';
import { FiChevronLeft, FiLock } from 'react-icons/fi';
import Logo from '../common/Logo';
import { APP_NAME } from '../../theme/brand';
import { useBranding } from '../../context/BrandingContext';
import Button from './Button';

/**
 * Shared auth page chrome — blob, rings, logo, card, trust strip.
 */
const AuthShell = ({
  title,
  subtitle,
  children,
  onBack,
  maxWidth = 'md', // md | 2xl
  showShield = true,
  footer,
  className = '',
}) => {
  const { branding } = useBranding();
  const name = branding?.appName || APP_NAME;
  const widthClass = maxWidth === '2xl' ? 'sm:max-w-2xl' : 'sm:max-w-md';

  return (
    <div className={`min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-neutral-25 flex flex-col justify-center py-4 sm:py-8 lg:py-10 px-3 sm:px-6 lg:px-8 relative ${className}`}>

      <div className="absolute bottom-0 left-[-10%] w-full h-[40%] sm:h-[50%] opacity-40 sm:opacity-50 pointer-events-none z-0">
        <svg
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full stroke-primary-500/20 stroke-1 fill-none"
        >
          <circle cx="100" cy="300" r="100" />
          <circle cx="100" cy="300" r="150" />
          <circle cx="100" cy="300" r="200" />
        </svg>
      </div>

      {onBack && (
        <div className="absolute top-4 left-3 sm:top-8 sm:left-8 z-20">
          <Button
            type="button"
            variant="icon"
            icon={FiChevronLeft}
            aria-label="Go back"
            onClick={onBack}
            className="bg-white shadow-md"
          />
        </div>
      )}

      <div className={`mx-auto w-full max-w-[420px] ${widthClass} text-center mb-4 sm:mb-6 relative z-10 pt-2 sm:pt-4`}>
        <div className="flex justify-center mb-4 sm:mb-6">
          <Logo className="h-24 sm:h-32 w-auto max-w-[260px] filter drop-shadow-sm" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-[28px] font-extrabold text-neutral-900 tracking-tight leading-tight px-1">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 sm:mt-3 text-sm sm:text-[15px] text-neutral-500 font-medium px-1 leading-snug">{subtitle}</p>
        )}
      </div>

      <div className={`mx-auto w-full max-w-[420px] ${widthClass} relative z-10 pb-3 sm:pb-4`}>
        <div className="bg-white py-5 sm:py-7 px-4 sm:px-7 shadow-lg sm:shadow-xl rounded-2xl sm:rounded-3xl border border-neutral-100">
          {children}
        </div>
        {footer && <div className="mt-4 text-center">{footer}</div>}
      </div>

      {showShield && (
        <div className="mt-3 sm:mt-4 flex flex-col items-center justify-center relative z-10 pb-4 sm:pb-8 px-3">
          <img
            src="/secure_shield_3d.png"
            alt=""
            className="h-16 sm:h-24 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="mt-2 sm:mt-3 flex items-center justify-center gap-2 text-xs sm:text-[13px] text-neutral-500 font-medium text-center">
            <div className="bg-primary-100 p-1.5 rounded-full flex items-center justify-center shrink-0">
              <FiLock className="h-3.5 w-3.5 text-primary-500" aria-hidden />
            </div>
            <p>
              Your data is <span className="text-primary-500 font-bold">safe and secure</span> with{' '}
              {name}.
            </p>
          </div>
          <p className="mt-3 text-[11px] sm:text-[12px] text-neutral-400">
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthShell;
