import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} Salon Kosmetyczny Katarzyna Brui. {t.footer.rights}</p>
      </div>
    </footer>
  );
};
