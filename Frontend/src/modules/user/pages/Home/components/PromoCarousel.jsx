import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { gsap } from 'gsap';
import PromoCard from '../../../components/common/PromoCard';
import { themeColors } from '../../../../../theme';
import promo1 from '../../../../../assets/images/pages/Home/promo-carousel/1764052270908-bae94c.jpg';
import promo2 from '../../../../../assets/images/pages/Home/promo-carousel/1678450687690-81f922.jpg';
import promo3 from '../../../../../assets/images/pages/Home/promo-carousel/1745822547742-760034.jpg';
import promo4 from '../../../../../assets/images/pages/Home/promo-carousel/1711428209166-2d42c0.jpg';
import promo5 from '../../../../../assets/images/pages/Home/promo-carousel/1762785595543-540198.jpg';
import promo6 from '../../../../../assets/images/pages/Home/promo-carousel/1678454437383-aa4984.jpg';

const PromoCarousel = memo(({ promos, onPromoClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);
  const intervalRef = useRef(null);
  const carouselRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);



  const promotionalCards = promos || [];

  // Append first card clone to end for seamless infinite manual & auto swiping
  const displayCards = useMemo(() => {
    if (promotionalCards.length > 1) {
      return [
        ...promotionalCards,
        { ...promotionalCards[0], id: `${promotionalCards[0].id || 'promo'}-clone-end`, isClone: true }
      ];
    }
    return promotionalCards;
  }, [promotionalCards]);

  const isResettingRef = useRef(false);

  // Auto-scroll loop functionality (3-second interval)
  useEffect(() => {
    if (isHovered || promotionalCards.length <= 1) return;

    const interval = setInterval(() => {
      if (!scrollContainerRef.current || isResettingRef.current) return;

      const container = scrollContainerRef.current;
      const firstCard = container.querySelector('[data-promo-card]');
      const cardWidth = firstCard ? firstCard.offsetWidth + 8 : container.offsetWidth * 0.88;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      if (container.scrollLeft >= maxScrollLeft - 15) {
        // We are on clone card at the end -> instantly jump to real index 0, then scroll to index 1
        container.style.scrollBehavior = 'auto';
        container.scrollLeft = 0;
        container.style.scrollBehavior = 'smooth';

        setTimeout(() => {
          if (container) {
            container.scrollTo({ left: cardWidth, behavior: 'smooth' });
          }
        }, 50);
      } else {
        container.scrollTo({
          left: container.scrollLeft + cardWidth,
          behavior: 'smooth'
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered, promotionalCards.length]);

  // Handle manual & auto scroll for seamless instant reset on clone
  const handleScroll = () => {
    if (!scrollContainerRef.current || isResettingRef.current) return;

    const container = scrollContainerRef.current;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    // If user manually swipes into the clone card at the end
    if (container.scrollLeft >= maxScrollLeft - 5) {
      isResettingRef.current = true;
      // Instantly jump to beginning (real card 0) without smooth transition delay
      setTimeout(() => {
        if (container) {
          container.style.scrollBehavior = 'auto';
          container.scrollLeft = 0;
          container.style.scrollBehavior = 'smooth';
        }
        isResettingRef.current = false;
      }, 350);
    }
  };

  // Entrance animation
  useEffect(() => {
    if (carouselRef.current) {
      gsap.fromTo(carouselRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );
    }
  }, []);

  if (!promos || promos.length === 0) {
    return null;
  }

  return (
    <div
      ref={carouselRef}
      className=""
      style={{ opacity: 1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-2 overflow-x-auto px-1 sm:px-2 pt-2 pb-1 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollBehavior: 'smooth' }}
      >
        {displayCards.map((promo, index) => (
          <div key={`${promo.id || index}-${index}`} data-promo-card className="flex-shrink-0 snap-center">
            <PromoCard
              title={promo.title}
              subtitle={promo.subtitle}
              buttonText={promo.buttonText}
              image={promo.image}
              className={promo.className}
              onClick={() => onPromoClick?.(promo)}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

PromoCarousel.displayName = 'PromoCarousel';

export default PromoCarousel;

