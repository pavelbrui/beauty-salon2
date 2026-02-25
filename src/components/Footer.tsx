import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { LocalizedLink } from './LocalizedLink';
import { FaFacebook, FaInstagram } from 'react-icons/fa';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="bg-gray-900">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Top section */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-white/10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-serif font-bold text-white tracking-wider">ANNA NOWAK</h3>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 mt-1 mb-4">beauty studio</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              ul. Młynowa 46, Lok U11<br />
              15-404 Białystok
            </p>
            <a href="tel:880435102" className="text-rose-400 text-sm font-medium mt-2 inline-block hover:text-rose-300 transition-colors">
              880 435 102
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-6">
              {language === 'pl' ? 'Nawigacja' : language === 'ru' ? 'Навигация' : 'Navigation'}
            </h4>
            <div className="space-y-3">
              <LocalizedLink to="/services" className="block text-gray-400 text-sm hover:text-white transition-colors">{t.services}</LocalizedLink>
              <LocalizedLink to="/appointments" className="block text-gray-400 text-sm hover:text-white transition-colors">{t.appointments}</LocalizedLink>
              <LocalizedLink to="/stylists" className="block text-gray-400 text-sm hover:text-white transition-colors">{t.stylists}</LocalizedLink>
              <LocalizedLink to="/gallery" className="block text-gray-400 text-sm hover:text-white transition-colors">{t.gallery}</LocalizedLink>
            </div>
          </div>

          {/* More links */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-6">
              {language === 'pl' ? 'Więcej' : language === 'ru' ? 'Ещё' : 'More'}
            </h4>
            <div className="space-y-3">
              <LocalizedLink to="/training" className="block text-gray-400 text-sm hover:text-white transition-colors">{t.training}</LocalizedLink>
              <LocalizedLink to="/blog" className="block text-gray-400 text-sm hover:text-white transition-colors">Blog</LocalizedLink>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-6">
              {language === 'pl' ? 'Obserwuj nas' : language === 'ru' ? 'Подписаться' : 'Follow us'}
            </h4>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all"><FaFacebook size={16} /></a>
              <a href="https://www.instagram.com/katarzyna.brui_" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all"><FaInstagram size={16} /></a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">&copy; {new Date().getFullYear()} Studio Urody Anna Nowak. {t.footer.rights}</p>
          <p className="text-gray-600 text-xs">Białystok, Polska</p>
        </div>
      </div>
    </footer>
  );
};
