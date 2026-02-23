import React from 'react';
import { LocalizedLink } from '../components/LocalizedLink';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

export const NotFoundPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="pt-16 min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-brand mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-cream mb-2">{t.notFound.title}</h2>
        <p className="text-cream-300 mb-8">{t.notFound.description}</p>
        <LocalizedLink
          to="/"
          className="inline-block bg-brand text-dark px-6 py-3 font-semibold hover:bg-brand-400 transition-colors"
        >
          {t.notFound.backHome}
        </LocalizedLink>
      </div>
    </div>
  );
};
