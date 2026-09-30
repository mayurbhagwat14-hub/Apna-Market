import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCompass,
  FiArrowRight,
  FiShoppingBag,
  FiScissors,
  FiCoffee,
  FiTool,
  FiTag,
  FiCpu,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

// Fallback banners tailored specifically to Apna Market
export const DEFAULT_HERO_BANNERS = [
  {
    id: 'banner-food',
    title: 'Tasty Food',
    highlightText: 'Near You',
    badge: 'Discover Near You',
    subtitle: 'Explore top rated restaurants and cafes around you',
    buttonText: 'Explore Cafes',
    slug: 'restaurants',
    bgGradient: 'from-[#014033] via-[#015443] to-[#016A54]',
    accentColor: 'text-emerald-200',
    badgeBg: 'bg-white/15 text-emerald-200',
    ambientGlow: 'bg-amber-400/20',
    ambientGlow2: 'bg-emerald-400/20',
    imageUrl: '/tasty-food-banner.jpg',
    categoryIcon: FiCoffee
  },
  {
    id: 'banner-fashion',
    title: 'Trending Style',
    highlightText: 'In Indore',
    badge: 'Festive & Fashion',
    subtitle: 'Top local boutiques, ethnic wear & latest fashion collections',
    buttonText: 'Shop Clothing',
    slug: 'clothing',
    bgGradient: 'from-[#2e0854] via-[#4c1d95] to-[#6d28d9]',
    accentColor: 'text-purple-200',
    badgeBg: 'bg-white/15 text-purple-200',
    ambientGlow: 'bg-pink-400/25',
    ambientGlow2: 'bg-indigo-400/25',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
    categoryIcon: FiTag
  },
  {
    id: 'banner-salon',
    title: 'Glow & Groom',
    highlightText: 'At Best Salons',
    badge: 'Salon & Wellness',
    subtitle: 'Top rated hair stylists, spas & skin treatments near you',
    buttonText: 'Book Salon',
    slug: 'beauty-care',
    bgGradient: 'from-[#831843] via-[#9d174d] to-[#be185d]',
    accentColor: 'text-pink-200',
    badgeBg: 'bg-white/15 text-pink-200',
    ambientGlow: 'bg-rose-400/25',
    ambientGlow2: 'bg-amber-400/20',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
    categoryIcon: FiScissors
  },
  {
    id: 'banner-services',
    title: 'Trusted Local',
    highlightText: 'Services',
    badge: 'Doorstep Help',
    subtitle: 'Verified electricians, plumbers & AC repair experts',
    buttonText: 'Explore Services',
    slug: 'services',
    bgGradient: 'from-[#064e3b] via-[#047857] to-[#059669]',
    accentColor: 'text-teal-200',
    badgeBg: 'bg-white/15 text-teal-200',
    ambientGlow: 'bg-cyan-400/20',
    ambientGlow2: 'bg-emerald-300/20',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
    categoryIcon: FiTool
  },
  {
    id: 'banner-shops',
    title: 'Neighborhood',
    highlightText: 'Stores & Kirana',
    badge: 'Apna Bazaar',
    subtitle: 'Daily essentials, fresh groceries & local shopping simplified',
    buttonText: 'Browse Stores',
    slug: 'shops',
    bgGradient: 'from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb]',
    accentColor: 'text-sky-200',
    badgeBg: 'bg-white/15 text-sky-200',
    ambientGlow: 'bg-blue-400/25',
    ambientGlow2: 'bg-cyan-300/20',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
    categoryIcon: FiShoppingBag
  },
  {
    id: 'banner-electronics',
    title: 'Electronics &',
    highlightText: 'Gadget Hub',
    badge: 'Best Tech Deals',
    subtitle: 'Smartphones, laptops, accessories & instant repair shops',
    buttonText: 'View Gadgets',
    slug: 'electronics',
    bgGradient: 'from-[#18181b] via-[#334155] to-[#475569]',
    accentColor: 'text-slate-200',
    badgeBg: 'bg-white/15 text-slate-200',
    ambientGlow: 'bg-blue-400/20',
    ambientGlow2: 'bg-amber-400/15',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
    categoryIcon: FiCpu
  }
];

const HeroBannerCarousel = ({ banners = [] }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // Combine backend seeded banners with default fallback styles
  const activeBanners = (banners && banners.length > 0)
    ? banners.map((item, idx) => {
        const fallback = DEFAULT_HERO_BANNERS[idx % DEFAULT_HERO_BANNERS.length];
        return {
          id: item.id || item._id || `banner-${idx}`,
          title: item.title || fallback.title,
          highlightText: item.highlightText !== undefined ? item.highlightText : fallback.highlightText,
          badge: item.badge || fallback.badge,
          subtitle: item.subtitle || item.text || fallback.subtitle,
          buttonText: item.buttonText || fallback.buttonText,
          slug: item.slug || fallback.slug,
          bgGradient: item.bgGradient || fallback.bgGradient,
          imageUrl: item.imageUrl || fallback.imageUrl,
          accentColor: fallback.accentColor,
          badgeBg: fallback.badgeBg,
          ambientGlow: fallback.ambientGlow,
          ambientGlow2: fallback.ambientGlow2,
          categoryIcon: fallback.categoryIcon
        };
      })
    : DEFAULT_HERO_BANNERS;

  const total = activeBanners.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-scroll loop functionality (4.5s)
  useEffect(() => {
    if (isPaused || total <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, total, handleNext]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    // Minimum 40px drag distance to trigger slide
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
  };

  const handleBannerClick = (banner) => {
    if (banner.slug) {
      navigate(`/user/category/${banner.slug}`);
    } else {
      navigate('/user/explore');
    }
  };

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];
  const IconComponent = currentBanner.categoryIcon || FiCompass;

  return (
    <div
      className="relative w-full group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Banner Slide Container */}
      <div
        onClick={() => handleBannerClick(currentBanner)}
        className={`relative rounded-3xl bg-gradient-to-r ${currentBanner.bgGradient} text-white overflow-hidden p-5 sm:p-7 shadow-lg shadow-black/15 flex items-center justify-between gap-4 cursor-pointer transition-all duration-500 active:scale-[0.99]`}
      >
        {/* Dynamic Ambient Background Glows */}
        <div
          className={`absolute -right-8 -top-8 w-60 h-60 ${currentBanner.ambientGlow} rounded-full blur-2xl pointer-events-none transition-all duration-700`}
        />
        <div
          className={`absolute right-10 bottom-0 w-48 h-48 ${currentBanner.ambientGlow2} rounded-full blur-2xl pointer-events-none transition-all duration-700`}
        />

        {/* Left Column Text Content */}
        <div className="relative z-10 max-w-[65%] sm:max-w-[70%] flex flex-col justify-between space-y-2 sm:space-y-3">
          <div>
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${currentBanner.badgeBg} text-[10px] sm:text-xs font-bold mb-1.5 backdrop-blur-xs`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{currentBanner.badge || 'Discover Near You'}</span>
            </div>

            {/* Banner Title & Highlight */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-[1.15] drop-shadow-xs">
              {currentBanner.title} <br className="sm:hidden" />
              <span className={currentBanner.accentColor || 'text-emerald-200'}>
                {currentBanner.highlightText ? ` ${currentBanner.highlightText}` : ''}
              </span>
            </h2>

            {/* Subtitle / Description */}
            <p className="text-[11px] sm:text-sm text-white/85 mt-1 font-medium leading-tight line-clamp-2">
              {currentBanner.subtitle}
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/15 group-hover:bg-white/25 active:scale-95 text-white text-[11px] sm:text-xs font-bold transition-all w-fit backdrop-blur-md border border-white/25 shadow-xs">
              <span>{currentBanner.buttonText || 'Explore Now'}</span>
              <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Right Column Visual Image */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 shrink-0 z-10">
          <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-2 border-white/20 group-hover:scale-105 transition-all duration-300 bg-black/10">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              key={currentBanner.imageUrl}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={(e) => {
                // Fallback to placeholder if external URL fails
                e.target.src = '/tasty-food-banner.jpg';
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Arrows (Visible on hover for desktop) */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white items-center justify-center backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 z-20"
            aria-label="Previous banner"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white items-center justify-center backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 z-20"
            aria-label="Next banner"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Pagination Dot Indicators */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {activeBanners.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(dotIdx);
              }}
              className={`transition-all duration-300 rounded-full ${
                dotIdx === currentIndex
                  ? 'w-6 h-1.5 bg-[#016A54]'
                  : 'w-1.5 h-1.5 bg-neutral-300 hover:bg-neutral-400'
              }`}
              aria-label={`Go to slide ${dotIdx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(HeroBannerCarousel);
