import React from 'react';
import { LocalizedLink } from '../components/LocalizedLink';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

export const NotFoundPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="pt-16 min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-amber-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t.notFound.title}</h2>
        <p className="text-gray-600 mb-8">{t.notFound.description}</p>
        <LocalizedLink
          to="/"
          className="inline-block bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
        >
          {t.notFound.backHome}
        </LocalizedLink>
      </div>
    </div>
  );
};
