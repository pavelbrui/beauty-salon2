/// <reference types="google.maps" />
import React, { useEffect, useRef } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const PLACE_ID = 'ChIJzQK31Dv9H0cR0aqPnVAPkDo';
// Fallback coordinates (ul. Młynowa 46, 15-404 Białystok) — used only if Geocoder fails
const FALLBACK_LAT = 53.13578;
const FALLBACK_LNG = 23.15688;

let mapsLoaded = false;
let mapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (mapsLoaded && window.google?.maps) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=marker,geocoding`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      mapsLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

async function resolvePlaceCoords(): Promise<{ lat: number; lng: number }> {
  try {
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ placeId: PLACE_ID });
    const loc = result.results[0]?.geometry?.location;
    if (loc) return { lat: loc.lat(), lng: loc.lng() };
  } catch {
    // fall through to fallback
  }
  return { lat: FALLBACK_LAT, lng: FALLBACK_LNG };
}

export const MapLocation: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(async () => {
        if (cancelled || !mapRef.current) return;

        const coords = await resolvePlaceCoords();
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: coords,
          zoom: 17,
          mapId: 'beauty-salon-map',
        });

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: coords,
          title: 'Katarzyna Brui - Salon Kosmetyczny',
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding:4px">
              <strong>Katarzyna Brui</strong><br/>
              ul. Mlynowa 46, Lok U11<br/>
              15-404 Bialystok<br/>
              <a href="https://www.google.com/maps/place/?q=place_id:${PLACE_ID}" target="_blank" rel="noopener" style="color:#d97706">Directions</a>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open({ anchor: marker, map });
        });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="w-full rounded-lg overflow-hidden">
        <iframe
          title="Katarzyna Brui - lokalizacja"
          src={`https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=place_id:${PLACE_ID}`}
          width="100%"
          height="350"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ height: 350 }}
    />
  );
};
