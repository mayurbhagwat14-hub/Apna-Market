import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import Logo from '../common/Logo';
import { APP_NAME } from '../../theme/brand';
import { useBranding } from '../../context/BrandingContext';

const DEFAULT_SECTIONS = {
  user: [
    {
      title: 'Company',
      links: [
        { label: 'About Us', to: '/user/about-app' },
        { label: 'Help & Support', to: '/user/help-support' },
        { label: 'Cancellation Policy', to: '/user/cancellation-policy' },
      ],
    },
    {
      title: 'Quick Links',
      links: [
        { label: 'My Bookings', to: '/user/my-bookings' },
        { label: 'Wallet', to: '/user/wallet' },
        { label: 'Become a Provider', to: '/vendor/signup' },
      ],
    },
  ],
  vendor: [
    {
      title: 'Provider',
      links: [
        { label: 'Dashboard', to: '/vendor/dashboard' },
        { label: 'Earnings', to: '/vendor/earnings' },
        { label: 'About', to: '/vendor/about-app' },
      ],
    },
  ],
  admin: [],
};

/**
 * Shared Footer — panel-aware link groups. Contact via props from settings.
 */
const Footer = ({
  panel = 'user',
  sections,
  email,
  phone,
  address,
  className = '',
}) => {
  const { branding } = useBranding();
  const name = branding?.appName || APP_NAME;
  const year = new Date().getFullYear();
  const groups = sections || DEFAULT_SECTIONS[panel] || DEFAULT_SECTIONS.user;

  const contactEmail =
    email || `support@${String(name).toLowerCase().replace(/\s+/g, '')}.in`;
  const contactPhone = phone || '+91 98765 43210';
  const contactAddress = address || 'India';

  return (
    <footer
      className={`bg-neutral-50 border-t border-neutral-100 pt-14 pb-8 mt-12 relative overflow-hidden ${className}`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <Logo className="h-10 w-auto mb-4" />
            <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
              {name} helps you find and book trusted local services in minutes.
            </p>
          </div>

          {groups.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-bold text-neutral-900 mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-neutral-500 hover:text-primary-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-bold text-neutral-900 mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-neutral-500">
              <li>
                <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 hover:text-primary-600">
                  <FiMail className="w-4 h-4 text-primary-500" aria-hidden />
                  {contactEmail}
                </a>
              </li>
              <li>
                <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 hover:text-primary-600">
                  <FiPhone className="w-4 h-4 text-primary-500" aria-hidden />
                  {contactPhone}
                </a>
              </li>
              <li className="inline-flex items-start gap-2">
                <FiMapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" aria-hidden />
                <span>{contactAddress}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <p>© {year} {name}. All rights reserved.</p>
          <p className="font-medium text-neutral-500">{APP_NAME}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
