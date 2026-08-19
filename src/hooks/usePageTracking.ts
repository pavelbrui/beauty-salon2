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
  const pagePath = location.pathname + location.search;

  useEffect(() => {
    const trackPageView = () => {
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: pagePath,
          page_title: document.title,
        });
      }
    };

    trackPageView();
    window.addEventListener('analytics-ready', trackPageView);
    return () => window.removeEventListener('analytics-ready', trackPageView);
  }, [pagePath]);
}
