import React from 'react';
import { FaStar } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

export const Reviews: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
          {t.reviews.title}
        </h2>
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory">
          {Object.entries(t.reviews.reviewers).map(([author, review]: [string, any]) => (
            <div
              key={author}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow flex-none w-[300px] sm:w-[350px] snap-center"
            >
              <div className="flex items-center mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{author}</h3>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className="text-amber-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600">{review.content}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <a
            href="https://booksy.com/pl-pl/162206_katarzyna-brui_salon-kosmetyczny_5869_bialystok"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            {t.reviews.viewMore} →
          </a>
        </div>
      </div>
    </div>
  );
};