import React from 'react';
import { HiStar, HiBriefcase, HiLocationMarker, HiLightningBolt, HiShieldCheck, HiArrowRight } from 'react-icons/hi';
import { HiOutlinePhone } from 'react-icons/hi2';
import { MdVerified } from 'react-icons/md';

import { GiSteeringWheel } from 'react-icons/gi';

const ListingCard = ({ listing, onClick }) => {
  const [imageError, setImageError] = React.useState(false);
  const cover = listing.provider?.photo || listing.portfolioPhotos?.[0];
  const provider = listing.provider || {};
  const itemCount = listing.itemCount || listing.catalogItems?.length || 0;
  const isAvailableNow = listing.availability?.isAvailableNow || false;

  const categoryName = listing.category?.title || 'Service';
  const providerName = provider.businessName || provider.name || listing.title;
  const subtitle = listing.title;
  const rating = provider.rating || '0.0';
  const city = listing.serviceArea?.city || 'Anywhere';

  const isDriver = categoryName.toLowerCase().includes('driver');

  return (
    <div
      onClick={onClick}
      className="w-full bg-white rounded-[20px] sm:rounded-[24px] border border-neutral-100 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] transition-shadow p-3 sm:p-5 cursor-pointer group"
    >
      {/* Forced Horizontal Layout */}
      <div className="flex flex-row gap-3 sm:gap-6">
        
        {/* Left: Image Container */}
        <div className="relative w-[130px] sm:w-[220px] h-[180px] sm:h-auto shrink-0 rounded-[16px] sm:rounded-[20px] overflow-hidden bg-neutral-100 flex flex-col justify-between">
          {cover && !imageError ? (
            <img 
              src={cover} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover" 
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center text-4xl font-black text-neutral-300 bg-neutral-50">
              {providerName.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

          {/* Top Right Icon Badge */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-10 sm:h-10 bg-white/95 backdrop-blur-md rounded-lg sm:rounded-xl flex items-center justify-center text-primary-500 shadow-lg">
            {isDriver ? (
              <GiSteeringWheel className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : listing.category?.icon ? (
              <img src={listing.category.icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
            ) : (
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
            )}
          </div>


        </div>

        {/* Right: Content Container */}
        <div className="flex-1 flex flex-col min-w-0 py-0.5 sm:py-1">
          
          {/* Top category pill */}
          <div className="flex items-center gap-1 sm:gap-1.5 w-fit px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-primary-50 text-primary-500">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-primary-500 rounded-full"></div>
            <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-wider">{categoryName}</span>
          </div>

          {/* Title & Verified */}
          <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2">
            <h2 className="text-[15px] sm:text-[24px] font-black text-[#0f172a] leading-none truncate">
              {providerName}
            </h2>
            <MdVerified className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 shrink-0" />
          </div>

          {/* Subtitle */}
          <p className="text-[10px] sm:text-[14px] text-neutral-500 font-medium mt-0.5 sm:mt-1 truncate">
            {subtitle}
          </p>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-1.5 sm:mt-2.5">
            {listing.bookingMode && (
               <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-emerald-50 text-emerald-700">
                 <HiLightningBolt className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                 <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-wide">
                   {listing.bookingMode.replace('_', ' & ')}
                 </span>
               </div>
            )}
            {provider.isVerified !== false && (
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-primary-50 text-primary-600">
                <HiShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[8px] sm:text-[11px] font-bold">Verified Provider</span>
              </div>
            )}
          </div>



          {/* Horizontal Divider */}
          <div className="h-px w-full bg-neutral-100 my-2 sm:my-3"></div>

          {/* Stats Row */}
          <div className="flex items-center justify-between gap-1 sm:gap-10">
            {/* Rating */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="flex items-center justify-center text-blue-400 shrink-0">
                <HiStar className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] sm:text-[17px] font-black text-neutral-900 leading-tight">{rating}</p>
                <p className="text-[8px] sm:text-[12px] text-neutral-500 font-medium hidden sm:block">Rating</p>
              </div>
            </div>

            <div className="w-px h-5 sm:h-10 bg-neutral-100"></div>

            {/* Packages */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="flex items-center justify-center text-blue-400 shrink-0">
                <HiBriefcase className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] sm:text-[17px] font-black text-neutral-900 leading-tight">{itemCount}</p>
                <p className="text-[8px] sm:text-[12px] text-neutral-500 font-medium hidden sm:block">Package{itemCount !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="w-px h-5 sm:h-10 bg-neutral-100"></div>

            {/* Service Area */}
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <div className="flex items-center justify-center text-blue-400 shrink-0">
                <HiLocationMarker className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[17px] font-black text-neutral-900 leading-tight truncate">{city}</p>
                <p className="text-[8px] sm:text-[12px] text-neutral-500 font-medium hidden sm:block">Area</p>
              </div>
            </div>
          </div>
          
          <div className="h-px w-full bg-neutral-100 my-2 sm:my-3 hidden sm:block"></div>

          {/* Footer Buttons */}
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mt-auto pt-2 sm:pt-0">
            <button 
              className="flex-1 sm:w-[160px] sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-2xl border border-neutral-200 sm:border-2 text-primary-500 font-bold text-[10px] sm:text-[13px] hover:bg-neutral-50 transition-colors"
            >
              <span className="truncate">View Details</span>
            </button>
            
            <button 
              className="flex-[1.5] sm:w-[200px] sm:flex-none flex items-center justify-center sm:justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-2xl bg-[#016A54] text-white font-bold text-[10px] sm:text-[14px] hover:bg-blue-800 transition-colors shadow-sm sm:shadow-[0_8px_16px_-6px_rgba(1, 106, 84,0.4)]"
            >
              <span className="truncate">Book Now</span>
              <div className="hidden sm:flex w-7 h-7 rounded-full bg-white text-[#016A54] items-center justify-center shrink-0">
                <HiArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ListingCard;
