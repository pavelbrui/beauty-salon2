import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

export const MapLocation: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  
  // Zakodowany adres dla Google Maps
  const address = encodeURIComponent("Młynowa 46 lok U11, 15-404 Białystok, Poland");
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
  
  return (
    <div className="w-full p-6 rounded-lg bg-white shadow-lg">
      <div className="flex items-center justify-center space-x-3 text-amber-600 mb-4">
        <FaMapMarkerAlt className="w-8 h-8" />
        <h3 className="text-xl font-semibold">{t.contact.location.title}</h3>
      </div>
      
      <a 
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-[200px] rounded-lg overflow-hidden mb-4 relative bg-gray-100 hover:opacity-90 transition-opacity"
      >
        <img
          src={`https://maps.googleapis.com/maps/api/staticmap?center=${address}&zoom=15&size=400x200&markers=color:red%7C${address}&key=AIzaSyD15_JvLEOg9UWt8MkZXyoqOmR4V7e9Pc4`}
          alt={t.contact.location.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-sm text-gray-600">
          {t.contact.location.openInMaps}
        </div>
      </a>
      
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