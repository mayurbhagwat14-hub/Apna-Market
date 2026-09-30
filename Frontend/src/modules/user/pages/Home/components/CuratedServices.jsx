import React, { useRef, useEffect } from 'react';
import { createOptimizedScrollAnimation, createOptimizedStaggerAnimation } from '../../../../../utils/optimizedScrollTrigger';
import ServiceCard from '../../../components/common/ServiceCard';

const CuratedServices = React.memo(({ services, onServiceClick }) => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef(null);


  const serviceList = services || [];

  // Defer GSAP scroll animations until after initial render for better performance
  useEffect(() => {
    // Skip animations on initial load to improve performance
    const shouldAnimate = typeof window !== 'undefined' &&
      (window.requestIdleCallback || window.setTimeout);

    if (!shouldAnimate || !sectionRef.current || !titleRef.current || !cardsRef.current) {
      // Show content immediately without animation
      if (titleRef.current) titleRef.current.style.opacity = '1';
      if (cardsRef.current) {
        Array.from(cardsRef.current.children).forEach(card => {
          card.style.opacity = '1';
          card.style.transform = 'none';
        });
      }
      return;
    }

    // Defer animation initialization until browser is idle
    const initAnimations = () => {
      const cards = Array.from(cardsRef.current?.children || []);
      if (cards.length === 0) return;

      const cleanupFunctions = [];

      // Animate title with optimized scroll trigger
      const titleCleanup = createOptimizedScrollAnimation(
        titleRef.current,
        {
          from: { y: 30, opacity: 0 },
          to: { y: 0, opacity: 1 },
          duration: 0.6,
          ease: 'power2.out',
        },
        { rootMargin: '100px' }
      );
      if (titleCleanup) cleanupFunctions.push(titleCleanup);

      // Stagger animate cards with optimized scroll trigger
      const cardsCleanup = createOptimizedStaggerAnimation(
        cards,
        {
          from: { x: 50, opacity: 0, scale: 0.9 },
          to: { x: 0, opacity: 1, scale: 1 },
          duration: 0.5,
          stagger: 0.1,
          ease: 'back.out(1.7)',
        },
        { rootMargin: '150px' }
      );
      if (cardsCleanup) cleanupFunctions.push(cardsCleanup);

      return () => {
        cleanupFunctions.forEach(cleanup => cleanup?.());
      };
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if (window.requestIdleCallback) {
      const idleCallback = window.requestIdleCallback(initAnimations, { timeout: 2000 });
      return () => {
        if (idleCallback) window.cancelIdleCallback(idleCallback);
      };
    } else {
      const timeout = setTimeout(initAnimations, 500);
      return () => clearTimeout(timeout);
    }
  }, []); // Empty deps - only run once on mount

  if (serviceList.length === 0) {
    return null;
  }

  return (
    <div ref={sectionRef} className="mb-8">
      {/* Title Section */}
      <div ref={titleRef} className="px-4 mb-3.5" style={{ opacity: 1 }}>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
          Thoughtful curations
        </h2>
        <p className="text-xs sm:text-sm font-medium text-gray-500">
          of our finest experiences
        </p>
      </div>

      <div ref={cardsRef} className="flex gap-3.5 sm:gap-4 overflow-x-auto px-4 pb-3 pt-1 scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:snap-none">
        {serviceList.map((service, index) => (
          <ServiceCard
            key={service.id || index}
            title={service.title}
            gif={service.gif}
            youtubeUrl={service.youtubeUrl}
          />
        ))}
      </div>
    </div>
  );
});

CuratedServices.displayName = 'CuratedServices';

export default CuratedServices;

