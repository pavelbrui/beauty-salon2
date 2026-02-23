import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Service } from '../types';
import { ServiceCard } from './ServiceCard';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getCategoryName } from '../utils/serviceTranslation';

interface ServiceSectionProps {
  category: string;
  services: Service[];
  onBookService?: (service: Service) => void;
}

const SCROLL_AMOUNT = 280;

export const ServiceSection: React.FC<ServiceSectionProps> = ({
  category,
  services,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [services, updateScrollState]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT, behavior: 'smooth' });
  };

  const showArrows = isMobile && services.length > 1;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{getCategoryName(category, language, (t as any).categories)}</h2>
      
      <div className="relative">
        {/* Left scroll hint - mobile only */}
        {showArrows && canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Przewiń w lewo"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white/95 shadow-lg border border-gray-100 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 -ml-2"
          >
            <ChevronLeftIcon className="w-6 h-6" strokeWidth={2} />
          </button>
        )}
        {/* Right scroll hint - mobile only */}
        {showArrows && canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Przewiń w prawo"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white/95 shadow-lg border border-gray-100 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 -mr-2"
          >
            <ChevronRightIcon className="w-6 h-6" strokeWidth={2} />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {services.map((service) => (
            <motion.div
              key={service.id}
              className="flex-none w-[300px] sm:w-[350px] snap-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ServiceCard
                service={service}
              />
            </motion.div>
          ))}
        </div>
        
        <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-neutral-50 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-neutral-50 to-transparent pointer-events-none" />
      </div>
    </motion.section>
  );
};