import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

const PLACE_ID = 'ChIJzQK31Dv9H0cR0aqPnVAPkDo';

export const MapLocation: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="w-full p-6 rounded-lg bg-white shadow-lg">
      {/* Nagłówek z ikoną */}
      <div className="flex items-center justify-center space-x-3 text-amber-600 mb-4">
        <FaMapMarkerAlt className="w-8 h-8" />
        <h3 className="text-xl font-semibold">{t.contact.location.title}</h3>
      </div>

      {/* Kontener mapy */}
      <div className="w-full rounded-lg overflow-hidden mb-4">
        <iframe
          title="Katarzyna Brui - lokalizacja"
          src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2400.5!2d23.1440396!3d53.1274782!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s${PLACE_ID}!2sMakija%C5%BC%20Permanentny%20Bia%C5%82ystok%20%7C%20Katarzyna%20Brui!5e0!3m2!1s${language}!2spl!4v1700000000000`}
          width="100%"
          height="350"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Adres i opis */}
      <div className="text-center space-y-2">
        <p className="text-gray-700 font-medium">
          ul. Młynowa 46, Lok U11
        </p>
        <p className="text-gray-700">
          15-404 Białystok
        </p>
        <p className="text-gray-600 text-sm mt-4">
          {t.contact.location.description}
        </p>
      </div>
    </div>
  );
};
