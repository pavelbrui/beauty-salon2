import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { LocalizedLink } from './LocalizedLink';
import { FaFacebook, FaInstagram } from 'react-icons/fa';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const currentYear = new Date().getFullYear();

  const footerLinks = [
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
            <span className="block font-bold text-lg mb-4">{t.services}</span>
            <nav className="space-y-2">
              {footerLinks.map(link => (
                <LocalizedLink
                  key={link.path}
                  to={link.path}
                  className="block text-gray-400 hover:text-amber-400 transition-colors text-sm"
                >
                  {link.label}
                </LocalizedLink>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <span className="block font-bold text-lg mb-4">{language === 'pl' ? 'Kontakt' : language === 'en' ? 'Contact' : 'Контакт'}</span>
            <address className="text-gray-400 text-sm not-italic space-y-2">
              <p>Salon Kosmetyczny Katarzyna Brui</p>
              <p>ul. Młynowa 46, U11</p>
              <p>15-404 Białystok, Polska</p>
              <p className="pt-2">
                <a href="tel:+48880435102" className="hover:text-amber-400 transition-colors">
                  +48 880 435 102
                </a>
              </p>
              <p>
                <a href="mailto:info@katarzynabrui.pl" className="hover:text-amber-400 transition-colors">
                  info@katarzynabrui.pl
                </a>
              </p>
            </address>
            <div className="flex space-x-4 mt-4">
              <a
                href="https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook – Katarzyna Brui Permanent"
                className="text-gray-400 hover:text-amber-400 transition-colors"
              >
                <FaFacebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="https://www.instagram.com/katarzyna.brui_"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram – @katarzyna.brui_"
                className="text-gray-400 hover:text-amber-400 transition-colors"
              >
                <FaInstagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <span className="block font-bold text-lg mb-4">{language === 'pl' ? 'Informacje' : language === 'en' ? 'Information' : 'Информация'}</span>
            <nav className="space-y-2">
              {legalLinks.map(link => (
                <LocalizedLink
                  key={link.path}
                  to={link.path}
                  className="block text-gray-400 hover:text-amber-400 transition-colors text-sm"
                >
                  {link.label}
                </LocalizedLink>
              ))}
            </nav>
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
