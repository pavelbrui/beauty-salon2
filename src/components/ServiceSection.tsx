import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Service } from '../types';
import { ServiceCardOptimized } from './ServiceCardOptimized';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getCategoryName } from '../utils/serviceTranslation';

interface ServiceSectionProps {
  category: string;
  services: Service[];
  onBookService?: (service: Service) => void;
}

const SCROLL_AMOUNT = 280;
const CARD_WIDTH = 300;
const GAP = 24;

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
  const [activeIndex, setActiveIndex] = useState(0);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const left = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(left > 2);
    setCanScrollRight(left < maxScroll - 2);
    // Approximate active dot from scroll position
    const cardTotal = CARD_WIDTH + GAP;
    const idx = Math.round(left / cardTotal);
    setActiveIndex(Math.min(idx, Math.max(0, services.length - 1)));
  }, [services.length]);

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

  const scrollToDot = (dotIdx: number) => {
    const el = scrollRef.current;
    if (!el || dotCount <= 1) return;
    const serviceIdx = Math.round((dotIdx / (dotCount - 1)) * (services.length - 1));
    const cardTotal = CARD_WIDTH + GAP;
    el.scrollTo({ left: serviceIdx * cardTotal, behavior: 'smooth' });
  };

  const showHint = isMobile && services.length > 1;
  const dotCount = Math.min(services.length, 5);
  const activeDot = dotCount <= 1 ? 0 : Math.round((activeIndex / (services.length - 1)) * (dotCount - 1));

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
        {/* Tap zones - invisible, mobile only */}
        {showHint && canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Przewiń w lewo"
            className="absolute left-0 top-0 bottom-6 w-12 z-10 md:hidden bg-transparent"
          />
        )}
        {showHint && canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Przewiń w prawo"
            className="absolute right-0 top-0 bottom-6 w-12 z-10 md:hidden bg-transparent"
          />
        )}

        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-6 pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {services.map((service) => (
            <motion.div
              key={service.id}
              className="flex-none w-[300px] sm:w-[350px] snap-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ServiceCardOptimized
                service={service}
              />
            </motion.div>
          ))}
        </div>

        {/* Scroll dots - minimal, elegant */}
        {showHint && (
          <div className="flex justify-center gap-1.5 pt-4 pb-4 md:hidden">
            {Array.from({ length: dotCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToDot(i)}
                aria-label={`Pozycja ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeDot === i ? 'w-4 bg-amber-500' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
        
        <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-neutral-50 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-neutral-50 to-transparent pointer-events-none" />
      </div>
    </motion.section>
  );
};