import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { LocalizedLink } from './LocalizedLink';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="bg-dark border-t border-brand/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
          <p className="text-cream-300 text-sm">
            &copy; {new Date().getFullYear()} Salon Kosmetyczny Katarzyna Brui. {t.footer.rights}
          </p>
          <LocalizedLink to="/services" className="text-cream-300 hover:text-brand text-sm transition-colors">
            {t.services}
          </LocalizedLink>
        </div>
      </div>
    </footer>
  );
};
