import React, { forwardRef } from 'react';
import { useBranding } from '../../context/BrandingContext';
import { APP_NAME } from '../../theme/brand';

/**
 * Centralized Logo Component
 * Usage: <Logo className="h-8 w-auto" />
 * Supports ref for animations
 */
const Logo = forwardRef(({ className = "h-8 w-auto", ...props }, ref) => {
  const { branding } = useBranding();
  
  return (
    <img
      ref={ref}
      src={branding?.appLogo || '/apna-market-logo.png'}
      alt={branding?.appName || APP_NAME}
      className={`${className} object-contain`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = '/apna-market-logo.png';
      }}
      {...props}
    />
  );
});

Logo.displayName = 'Logo';

export default Logo;
