import React from 'react';
import { LocalizedLink } from '../components/LocalizedLink';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

export const NotFoundPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="pt-16 min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-serif font-bold text-rose-200 mb-2">404</h1>
        <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-3">{t.notFound.title}</h2>
        <p className="text-gray-500 mb-8">{t.notFound.description}</p>
        <LocalizedLink
          to="/"
          className="inline-block bg-rose-500 text-white px-8 py-3 rounded-full font-medium hover:bg-rose-600 transition-all hover:shadow-lg hover:shadow-rose-500/20"
        >
          {t.notFound.backHome}
        </LocalizedLink>
      </div>
    </div>
  );
};
