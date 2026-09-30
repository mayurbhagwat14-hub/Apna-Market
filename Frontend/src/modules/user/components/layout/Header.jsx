import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiChevronDown } from 'react-icons/fi';
import Logo from '../../../../components/common/Logo';
import SearchBar from '../../pages/Home/components/SearchBar';

const formatDisplayLocation = (rawLocation) => {
  if (!rawLocation || rawLocation === '...' || typeof rawLocation !== 'string') {
    return { mainLoc: 'Pune', subLoc: 'Maharashtra' };
  }

  const trimmed = rawLocation.trim();

  if (/^[\d\s.,\-+]+$/.test(trimmed)) {
    return { mainLoc: 'Pune', subLoc: 'Maharashtra' };
  }

  const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
  const textParts = parts.filter(p => !/^\d+$/.test(p));

  if (textParts.length === 0) {
    return { mainLoc: 'Pune', subLoc: 'Maharashtra' };
  }

  if (textParts.length === 1) {
    return { mainLoc: textParts[0], subLoc: 'Maharashtra' };
  }

  return {
    mainLoc: textParts[0],
    subLoc: textParts.slice(1).join(', ')
  };
};

const Header = ({ location, onLocationClick, onMenuClick, onSearchClick }) => {
  const { mainLoc, subLoc } = formatDisplayLocation(location);

  return (
    <>
      {/* Top Header Row: Logo & Location */}
      <div className="bg-[#0B1528] text-white relative z-30">
        {/* Background Ambient Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-24 bg-primary-500/20 blur-[50px] pointer-events-none rounded-full" />

        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3 px-2.5 sm:px-6 pt-3 pb-2 relative z-10">
          {/* Logo on Left */}
          <Link to="/user" className="flex items-center group py-0.5 shrink-0">
            <Logo className="h-8 sm:h-9 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(1, 106, 84,0.4)] transition-transform duration-300 group-hover:scale-105" />
          </Link>

          {/* Location Selector Pill */}
          <button
            type="button"
            onClick={onLocationClick}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 text-white border border-white/10 shadow-xs transition-all active:scale-95 cursor-pointer max-w-[210px] shrink-0"
          >
            <FiMapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[11.5px] font-bold text-white truncate tracking-tight">
              {mainLoc}{subLoc ? `, ${subLoc}` : ''}
            </span>
            <FiChevronDown className="w-3 h-3 text-blue-300/80 shrink-0" />
          </button>
        </div>
      </div>

      {/* Sticky Search Bar Row */}
      <div className="sticky top-0 z-40 bg-[#0B1528] -mt-0.5 pt-2 pb-3 px-2.5 sm:px-6 shadow-[0_8px_25px_rgba(0,0,0,0.25)] rounded-b-2xl">
        <div className="max-w-screen-xl mx-auto">
          <SearchBar onInputClick={onSearchClick} />
        </div>
      </div>
    </>
  );
};

export default Header;

