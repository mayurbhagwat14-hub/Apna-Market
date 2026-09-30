import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { APP_NAME, APP_TAGLINE } from '../theme/brand';

const BrandingContext = createContext();

const DEFAULT_BRANDING = {
  appName: APP_NAME,
  appLogo: '',
};

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(() => {
    try {
      const cached = localStorage.getItem('app_branding');
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          appName: parsed.appName || APP_NAME,
          appLogo: parsed.appLogo || '',
        };
      }
    } catch {
      /* ignore bad cache */
    }
    return { ...DEFAULT_BRANDING };
  });

  const fetchBranding = async () => {
    try {
      const res = await api.get('/public/config');
      if (res.data && res.data.settings) {
        const rawName = res.data.settings.appName || APP_NAME;
        const normalizedName = rawName.toLowerCase() === 'zevgo' ? 'Zevygo' : rawName;
        const newBranding = {
          appName: normalizedName,
          appLogo: res.data.settings.appLogo || '',
        };
        setBranding(newBranding);
        localStorage.setItem('app_branding', JSON.stringify(newBranding));
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    }
  };

  useEffect(() => {
    fetchBranding();

    const handleBrandingUpdated = () => {
      fetchBranding();
    };

    window.addEventListener('brandingUpdated', handleBrandingUpdated);
    return () => {
      window.removeEventListener('brandingUpdated', handleBrandingUpdated);
    };
  }, []);

  useEffect(() => {
    document.title = `${branding.appName} | ${APP_TAGLINE}`;

    if (branding.appLogo) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = branding.appLogo;
    }
  }, [branding.appName, branding.appLogo]);

  return (
    <BrandingContext.Provider value={{ branding, fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
