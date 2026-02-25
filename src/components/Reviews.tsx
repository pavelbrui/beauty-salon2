import React from 'react';
import { FaStar } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

export const Reviews: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const reviewEntries = Object.entries(t.reviews.reviewers);
  const featured = reviewEntries[0];
  const others = reviewEntries.slice(1);

  return (
    <section className="py-24 bg-[#FAF9F7]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 gap-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-rose-500 font-medium">
              {language === 'pl' ? 'Opinie klientek' : language === 'ru' ? 'Отзывы клиентов' : 'Client reviews'}
            </span>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 mt-3">
              {t.reviews.title}
            </h2>
          </div>
          <a
            href="https://booksy.com/pl-pl/162206_katarzyna-brui_salon-kosmetyczny_5869_bialystok"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] uppercase tracking-[0.15em] font-medium text-gray-900 border-b border-gray-900 pb-1 hover:text-rose-500 hover:border-rose-500 transition-colors self-start lg:self-auto"
          >
            {t.reviews.viewMore}
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured review - large */}
          {featured && (
            <div className="lg:col-span-1 lg:row-span-2 bg-gray-900 p-10 flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex gap-1 mb-8">
                  {[...Array(5)].map((_, i) => <FaStar key={i} className="text-rose-400" size={14} />)}
                </div>
                <p className="text-white/80 text-lg leading-relaxed italic font-serif">
                  "{(featured[1] as any).content}"
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white font-semibold text-sm">{featured[0]}</p>
                <p className="text-gray-500 text-xs mt-1">Booksy</p>
              </div>
            </div>
          )}

          {/* Other reviews - smaller cards */}
          {others.map(([author, review]: [string, any]) => (
            <div
              key={author}
              className="bg-white p-8 flex flex-col justify-between border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <FaStar key={i} className="text-rose-400" size={11} />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"{review.content}"</p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-gray-900 font-semibold text-sm">{author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
