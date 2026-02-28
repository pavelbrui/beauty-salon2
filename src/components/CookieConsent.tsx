import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

const GA_ID = 'G-BP257P61XY';

function loadGA() {
  if (document.getElementById('ga-script')) return;
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

export function CookieConsent() {
  const { language } = useLanguage();
  const t = translations[language];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'accepted') {
      loadGA();
    } else if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    loadGA();
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slideUp">
      <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-100 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5 shrink-0">🍪</span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-700 text-sm leading-relaxed">
              {(t as Record<string, unknown>).cookieText as string}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={accept}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-full transition-colors"
              >
                {(t as Record<string, unknown>).cookieAccept as string}
              </button>
              <button
                onClick={decline}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-full transition-colors"
              >
                {(t as Record<string, unknown>).cookieDecline as string}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
