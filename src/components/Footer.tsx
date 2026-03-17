import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { LocalizedLink } from './LocalizedLink';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { path: '/services', label: t.services },
    { path: '/appointments', label: t.appointments },
    { path: '/blog', label: (t as Record<string, unknown>).blog as string || 'Blog' },
    { path: '/gallery', label: t.gallery },
    { path: '/stylists', label: t.stylists },
  ];

  const legalLinks = [
    { path: '/privacy-policy', label: language === 'pl' ? 'Polityka prywatności' : language === 'en' ? 'Privacy Policy' : 'Политика конфиденциальности' },
    { path: '/terms', label: language === 'pl' ? 'Warunki użytkowania' : language === 'en' ? 'Terms of Use' : 'Условия использования' },
  ];

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Services Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t.services}</h3>
            <nav className="space-y-2">
              {footerLinks.map(link => (
                <LocalizedLink
                  key={link.path}
                  to={link.path}
                  className="text-gray-400 hover:text-amber-400 transition-colors text-sm"
                >
                  {link.label}
                </LocalizedLink>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">{language === 'pl' ? 'Kontakt' : language === 'en' ? 'Contact' : 'Контакт'}</h3>
            <address className="text-gray-400 text-sm not-italic space-y-2">
              <p>Salon Kosmetyczny Katarzyna Brui</p>
              <p>ul. Słonimskiego 4/2</p>
              <p>15-950 Białystok, Polska</p>
              <p className="pt-2">
                <a href="tel:+48857405000" className="hover:text-amber-400 transition-colors">
                  +48 857 405 000
                </a>
              </p>
              <p>
                <a href="mailto:info@katarzynabrui.pl" className="hover:text-amber-400 transition-colors">
                  info@katarzynabrui.pl
                </a>
              </p>
            </address>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">{language === 'pl' ? 'Informacje' : language === 'en' ? 'Information' : 'Информация'}</h3>
            <nav className="space-y-2">
              {legalLinks.map(link => (
                <LocalizedLink
                  key={link.path}
                  to={link.path}
                  className="text-gray-400 hover:text-amber-400 transition-colors text-sm"
                >
                  {link.label}
                </LocalizedLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <div className="flex justify-center gap-6">
            <a
              href="https://facebook.com/katarzynabrui"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-amber-400 transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://instagram.com/katarzynabrui"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-amber-400 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m5.894 17.5c-1.156 1.156-2.75 1.792-4.418 1.792s-3.262-.636-4.418-1.792c-.707-.707-1.264-1.56-1.649-2.511H5.5V8.5h13v5.689c-.385.951-.942 1.804-1.649 2.511m1.649-9.189H5.5V5.5h13v3.311z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} Salon Kosmetyczny Katarzyna Brui. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
};
