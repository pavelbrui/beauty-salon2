import React from 'react';
import { FaStar } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

export const Reviews: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="py-20 bg-dark-100 border-y border-brand/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-cream text-center mb-12">
          {t.reviews.title}
        </h2>
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory">
          {Object.entries(t.reviews.reviewers).map(([author, review]: [string, any]) => (
            <div
              key={author}
              className="bg-dark-50 border border-brand/20 p-6 flex-none w-[300px] sm:w-[350px] snap-center hover:border-brand/40 transition-colors"
            >
              <div className="flex items-center mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-cream">{author}</h3>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className="text-brand"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-cream-300">{review.content}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <a
            href="https://booksy.com/pl-pl/162206_katarzyna-brui_salon-kosmetyczny_5869_bialystok"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:text-brand-400 font-medium transition-colors"
          >
            {t.reviews.viewMore} →
          </a>
        </div>
      </div>
    </div>
  );
};