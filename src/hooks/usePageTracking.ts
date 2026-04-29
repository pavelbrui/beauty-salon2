import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Push page view for direct gtag integration
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }

    // Push custom event for GTM (useful for Yandex Metrica SPA tracking)
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'virtual_page_view',
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location.pathname, location.search]);
}
