import React, { useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'gmpx-store-locator': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};

// Konfiguracja dla Google Store Locator
const CONFIGURATION = {
  locations: [
    {
      title: "Makijaż Permanentny Białystok | Katarzyna Brui",
      address1: "Ul. Młynowa 46",
      address2: "Białystok, Poland",
      coords: { lat: 53.1274782, lng: 23.1462283 },
      placeId: "ChIJzQK31Dv9H0cR0aqPnVAPkDo",
      actions: [
        {
          label: "Book appointment",
          defaultUrl: "https://www.google.com/maps/reserve/m/-GcTTTTRG_s?source=gmpqb"
        }
      ]
    }
  ],
  mapOptions: {
    center: { lat: 53.1274782, lng: 23.1462283 },
    fullscreenControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 15,
    zoomControl: true,
    maxZoom: 17,
    mapId: ""
  },
  mapsApiKey: "AIzaSyAAskRaUXpyWH4_Nlp87NuKhktjUOrzCdI",
  capabilities: {
    input: false,
    autocomplete: false,
    directions: false,
    distanceMatrix: false,
    details: false,
    actions: true
  }
};

export const MapLocation: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  // Typowanie dla custom elementu
  type GMPXStoreLocatorElement = HTMLElement & {
    configureFromQuickBuilder: (config: any) => void;
  };

  useEffect(() => {
    const scriptId = 'gmpx-extended-script';
    const existingScript = document.getElementById(scriptId);
    if (!existingScript) {
      const script = document.createElement('script');
      script.src =
        'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js';
      script.type = 'module';
      script.id = scriptId;
      script.onload = () => {
        // Po załadowaniu skryptu upewniamy się, że custom element jest zdefiniowany
        customElements.whenDefined('gmpx-store-locator').then(() => {
          const locator = document.querySelector('gmpx-store-locator') as GMPXStoreLocatorElement;
          if (locator) {
            locator.configureFromQuickBuilder(CONFIGURATION);
          }
        });
      };
      document.body.appendChild(script);
    } else {
      // Jeśli skrypt już istnieje, konfigurujemy element
      customElements.whenDefined('gmpx-store-locator').then(() => {
        const locator = document.querySelector('gmpx-store-locator') as GMPXStoreLocatorElement;
        if (locator) {
          locator.configureFromQuickBuilder(CONFIGURATION);
        }
      });
    }
  }, []);

  return (
    <div className="w-full p-6 rounded-lg bg-white shadow-lg">
      {/* Nagłówek z ikoną */}
      <div className="flex items-center justify-center space-x-3 text-amber-600 mb-4">
        <FaMapMarkerAlt className="w-8 h-8" />
        <h3 className="text-xl font-semibold">{t.contact.location.title}</h3>
      </div>

      {/* Kontener mapy */}
      <div className="h-[300px] relative mb-4">
        {/* Style custom elementu */}
        <style>{`
          gmpx-store-locator {
            width: 100%;
            height: 100%;
            --gmpx-color-surface: #fff;
            --gmpx-color-on-surface: #212121;
            --gmpx-color-on-surface-variant: #757575;
            --gmpx-color-primary: #1967d2;
            --gmpx-color-outline: #e0e0e0;
            --gmpx-fixed-panel-width-row-layout: 28.5em;
            --gmpx-fixed-panel-height-column-layout: 65%;
            --gmpx-font-family-base: "Roboto", sans-serif;
            --gmpx-font-family-headings: "Roboto", sans-serif;
            --gmpx-font-size-base: 0.875rem;
            --gmpx-hours-color-open: #188038;
            --gmpx-hours-color-closed: #d50000;
            --gmpx-rating-color: #ffb300;
            --gmpx-rating-color-empty: #e0e0e0;
          }
        `}</style>

        {/* Ładowarka API oraz interaktywny locator */}
        <gmpx-api-loader key="AIzaSyAAskRaUXpyWH4_Nlp87NuKhktjUOrzCdI" solution-channel="GMP_QB_locatorplus_v11_cF"></gmpx-api-loader>
        <gmpx-store-locator map-id="DEMO_MAP_ID"></gmpx-store-locator>
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
