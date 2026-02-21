import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { detectLangFromPath } from '../hooks/useLocalizedPath';

export const LanguageLayout: React.FC = () => {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    const urlLang = detectLangFromPath(location.pathname);
    if (urlLang !== language) {
      setLanguage(urlLang);
    }
  }, [location.pathname, setLanguage, language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return <Outlet />;
};
