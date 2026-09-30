import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { configService } from '../../../../services/configService';
import { Footer as SharedFooter } from '../../../../components/ui';

/**
 * User home footer — wraps shared Footer with live support settings.
 * Still only mounts on /user home (route shell also gates this).
 */
const Footer = () => {
  const location = useLocation();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await configService.getSettings();
      if (data?.success) setSettings(data.settings);
    };
    fetchSettings();
  }, []);

  if (location.pathname !== '/user' && location.pathname !== '/user/') {
    return null;
  }

  const address = settings?.companyAddress
    ? `${settings.companyAddress}, ${settings.companyCity}, ${settings.companyState} - ${settings.companyPincode}`
    : undefined;

  return (
    <SharedFooter
      panel="user"
      email={settings?.supportEmail || settings?.companyEmail}
      phone={settings?.supportPhone || settings?.companyPhone}
      address={address}
      className="pb-28 lg:pb-8"
    />
  );
};

export default Footer;
