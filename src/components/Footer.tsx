import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { LocalizedLink } from './LocalizedLink';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
              <span className="text-white font-serif text-sm font-bold">AN</span>
            </div>
            <div>
              <p className="font-serif font-semibold text-lg">Anna Nowak</p>
              <p className="text-gray-500 text-xs tracking-wider uppercase">Beauty Studio</p>
            </div>
          </div>
          <div className="flex gap-8 text-sm text-gray-400">
            <LocalizedLink to="/services" className="hover:text-rose-400 transition-colors">{t.services}</LocalizedLink>
            <LocalizedLink to="/gallery" className="hover:text-rose-400 transition-colors">{t.gallery}</LocalizedLink>
            <LocalizedLink to="/training" className="hover:text-rose-400 transition-colors">{t.training}</LocalizedLink>
          </div>
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Studio Urody Anna Nowak. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
};
