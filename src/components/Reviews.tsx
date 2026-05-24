import React, { useRef } from 'react';
import { FaStar, FaGoogle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { motion } from 'framer-motion';

export const Reviews: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.reviews.title}
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => <FaStar key={i} />)}
              </div>
              <span className="text-gray-600 font-medium">5.0 / 5.0 (384 {t.reviewsLabel})</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-3 rounded-full border border-gray-200 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
              aria-label="Previous reviews"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-3 rounded-full border border-gray-200 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
              aria-label="Next reviews"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-6 pb-8 no-scrollbar snap-x snap-mandatory scroll-smooth"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {Object.entries(t.reviews.reviewers).map(([author, review]: [string, any], idx) => (
            <motion.div
              key={author}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-neutral-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex-none w-[320px] sm:w-[400px] snap-center border border-gray-100"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg mr-4">
                  {author.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{author}</h3>
                  <div className="flex items-center mt-1 gap-2">
                    <div className="flex text-amber-400 text-xs">
                      {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                    </div>
                    {review.source === 'google' ? (
                      <FaGoogle className="text-blue-500 text-xs" title="Google" />
                    ) : (
                      <span className="text-amber-600 text-[10px] font-black border border-amber-600 px-1 rounded" title="Booksy">B</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic leading-relaxed">"{review.content}"</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-6 mt-12 border-t border-gray-100 pt-10">
          <a
            href="https://booksy.com/pl-pl/162206_katarzyna-brui_salon-kosmetyczny_5869_bialystok"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-amber-500 hover:text-amber-600 transition-all font-medium shadow-sm"
          >
            <span className="text-amber-600 font-bold">B</span>
            {t.reviews.viewMoreBooksy}
          </a>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Katarzyna+Brui+Permanent+Białystok&query_place_id=ChIJzQK31Dv9H0cR0aqPnVAPkDo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-amber-500 hover:text-amber-600 transition-all font-medium shadow-sm"
          >
            <FaGoogle className="text-blue-500" />
            {t.reviews.viewMoreGoogle}
          </a>
        </div>
      </div>
    </div>
  );
};