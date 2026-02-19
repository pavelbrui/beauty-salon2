/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: { maps: any };
  }
}

import React, { useEffect, useRef, useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const PLACE_ID = 'ChIJzQK31Dv9H0cR0aqPnVAPkDo';
const SALON_COORDS = { lat: 53.1274782, lng: 23.1462283 };
const SALON_TITLE = 'Makijaż Permanentny Białystok | Katarzyna Brui';

export const MapLocation: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapFailed, setMapFailed] = useState(true);

  useEffect(() => {
    if (!MAPS_API_KEY || mapFailed) return;

    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId);

    const initMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: SALON_COORDS,
          zoom: 16,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true,
        });

        const marker = new window.google.maps.Marker({
          position: SALON_COORDS,
          map,
          title: SALON_TITLE,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding:8px;font-family:sans-serif">
              <strong style="font-size:14px">${SALON_TITLE}</strong><br/>
              <span style="color:#666;font-size:13px">ul. Młynowa 46, Lok U11<br/>15-404 Białystok</span>
            </div>
          `,
        });

        marker.addListener('click', () => infoWindow.open(map, marker));
      } catch {
        setMapFailed(true);
      }
    };

    if (existingScript && window.google?.maps) {
      initMap();
    } else if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&language=${language}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => setMapFailed(true);
      document.head.appendChild(script);
    }
  }, [language, mapFailed]);

  return (
    <div className="w-full p-6 rounded-lg bg-white shadow-lg">
      <div className="flex items-center justify-center space-x-3 text-amber-600 mb-4">
        <FaMapMarkerAlt className="w-8 h-8" />
        <h3 className="text-xl font-semibold">{t.contact.location.title}</h3>
      </div>

      <div className="w-full rounded-lg overflow-hidden mb-4">
        {mapFailed ? (
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
        ) : (
          <div ref={mapRef} className="w-full h-[350px]" />
        )}
      </div>

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
