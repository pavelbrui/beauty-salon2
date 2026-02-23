import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { FaFacebook, FaInstagram } from 'react-icons/fa';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="bg-stone-900 text-stone-200 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">Katarzyna Brui</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Salon kosmetyczny w Białymstoku. Makijaż permanentny, stylizacja rzęs, pielęgnacja brwi.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">{language === 'pl' ? 'Kontakt' : language === 'ru' ? 'Контакты' : 'Contact'}</h3>
            <p className="text-stone-400 text-sm">
              ul. Młynowa 46, Lok U11<br />
              15-404 Białystok<br />
              <a href="tel:880435102" className="text-rose-400 hover:text-rose-300 transition-colors">880 435 102</a>
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white mb-4">{language === 'pl' ? 'Social media' : language === 'ru' ? 'Соцсети' : 'Social media'}</h3>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-rose-400 transition-colors">
                <FaFacebook size={24} />
              </a>
              <a href="https://www.instagram.com/katarzyna.brui_" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-rose-400 transition-colors">
                <FaInstagram size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-stone-700 text-center">
          <p className="text-stone-500 text-sm">&copy; {new Date().getFullYear()} Salon Kosmetyczny Katarzyna Brui. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
};
