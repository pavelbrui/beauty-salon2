import React from 'react';
import { LocalizedLink } from '../components/LocalizedLink';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

export const NotFoundPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="pt-20 min-h-screen bg-[#FAF9F7] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-[180px] font-serif font-bold text-gray-100 leading-none select-none">404</h1>
        <h2 className="text-2xl font-serif font-bold text-gray-900 -mt-10 mb-3">{t.notFound.title}</h2>
        <p className="text-gray-400 mb-10">{t.notFound.description}</p>
        <LocalizedLink
          to="/"
          className="inline-block text-[12px] uppercase tracking-[0.15em] font-semibold px-8 py-4 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-500"
        >
          {t.notFound.backHome}
        </LocalizedLink>
      </div>
    </div>
  );
};
