import React from 'react';
import { FaStar } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

export const Reviews: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-rose-500 text-sm uppercase tracking-[0.2em] mb-3 font-medium">
            {language === 'pl' ? 'Opinie' : language === 'ru' ? 'Отзывы' : 'Reviews'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">
            {t.reviews.title}
          </h2>
          <div className="w-16 h-0.5 bg-rose-300 mx-auto" />
        </div>
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide">
          {Object.entries(t.reviews.reviewers).map(([author, review]: [string, any]) => (
            <div
              key={author}
              className="bg-rose-50/50 p-7 rounded-2xl border border-rose-100/50 hover:shadow-lg transition-all duration-300 flex-none w-[300px] sm:w-[350px] snap-center"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-semibold">{author.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{author}</h3>
                  <div className="flex items-center mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className="text-rose-400"
                        size={12}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed italic">"{review.content}"</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <a
            href="https://booksy.com/pl-pl/162206_katarzyna-brui_salon-kosmetyczny_5869_bialystok"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-rose-500 hover:text-rose-600 font-medium text-sm transition-colors"
          >
            {t.reviews.viewMore}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
        </div>
      </div>
    </div>
  );
};
