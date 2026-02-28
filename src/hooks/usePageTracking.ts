import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    Cookiebot?: { consent?: { statistics?: boolean } };
  }
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const hasConsent = window.Cookiebot?.consent?.statistics;
    if (hasConsent && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location.pathname, location.search]);
}
