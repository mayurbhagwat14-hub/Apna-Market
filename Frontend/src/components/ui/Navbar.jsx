import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiMenu, FiX, FiMapPin, FiChevronDown } from 'react-icons/fi';
import Logo from '../common/Logo';
import { APP_NAME } from '../../theme/brand';
import Button from './Button';

export const PANEL_NAV = {
  user: [
    { label: 'Home', to: '/user' },
    { label: 'Bookings', to: '/user/my-bookings' },
    { label: 'Cart', to: '/user/cart' },
    { label: 'Account', to: '/user/account' },
  ],
  vendor: [
    { label: 'Dashboard', to: '/vendor/dashboard' },
    { label: 'Jobs', to: '/vendor/jobs' },
    { label: 'Earnings', to: '/vendor/earnings' },
    { label: 'Profile', to: '/vendor/profile' },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Users', to: '/admin/users/all' },
    { label: 'Vendors', to: '/admin/vendors/all' },
    { label: 'Bookings', to: '/admin/bookings' },
    { label: 'Settings', to: '/admin/settings' },
  ],
};

/**
 * Panel-aware Navbar — desktop links + mobile drawer.
 * Pass `items` to override defaults for a panel.
 */
const Navbar = ({
  panel = 'user',
  items,
  homeTo,
  locationLabel,
  onLocationClick,
  rightSlot,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const navItems = items || PANEL_NAV[panel] || PANEL_NAV.user;
  const logoTo = homeTo || navItems[0]?.to || '/';

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const linkClass = ({ isActive }) =>
    [
      'font-semibold transition-colors',
      isActive ? 'text-primary-600' : 'text-neutral-700 hover:text-primary-500',
    ].join(' ');

  return (
    <header
      className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-100 ${className}`}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-5">
        <div className="flex items-center justify-between gap-3 h-14 sm:h-16">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="icon"
              className="lg:hidden"
              icon={FiMenu}
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            />
            <Link to={logoTo} className="shrink-0" aria-label={`${APP_NAME} home`}>
              <Logo className="h-8 sm:h-10 w-auto" />
            </Link>

            <nav className="hidden lg:flex items-center gap-7 ml-4" aria-label="Primary">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === logoTo} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onLocationClick && (
              <button
                type="button"
                onClick={onLocationClick}
                className="hidden sm:flex items-center gap-1.5 max-w-[180px] text-left"
              >
                <FiMapPin className="w-4 h-4 text-primary-500 shrink-0" aria-hidden />
                <span className="text-sm font-bold text-neutral-900 truncate">
                  {locationLabel || 'Select location'}
                </span>
                <FiChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden />
              </button>
            )}
            {rightSlot}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-neutral-950/40 border-0"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(86vw,20rem)] bg-white shadow-xl p-5 flex flex-col animate-slide-in-bottom">
            <div className="flex items-center justify-between mb-8">
              <Logo className="h-9 w-auto" />
              <Button
                variant="icon"
                icon={FiX}
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              />
            </div>
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === logoTo}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    [
                      'px-4 py-3 rounded-xl text-base font-semibold transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-700 hover:bg-neutral-50',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
};

export default Navbar;
