import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { stripLangPrefix } from '../hooks/useLocalizedPath';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  image?: string;
  noindex?: boolean;
  keywords?: string[];
  structuredData?: Record<string, unknown>;
}

const SITE_NAME = 'Salon Kosmetyczny Katarzyna Brui';
const DEFAULT_DESCRIPTION = 'Profesjonalny salon kosmetyczny w Białymstoku. Makijaż permanentny, stylizacja rzęs, pielęgnacja brwi. Umów wizytę online!';
const BASE_URL = 'https://katarzynabrui.pl';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

const LANGUAGES = ['pl', 'en', 'ru'] as const;

const OG_LOCALES: Record<string, string> = {
  pl: 'pl_PL',
  en: 'en_US',
  ru: 'ru_RU',
};

/** Build full URL with language prefix. Polish gets no prefix. */
const getLocalizedUrl = (barePath: string, lang: string): string => {
  if (lang === 'pl') return `${BASE_URL}${barePath}`;
  return `${BASE_URL}/${lang}${barePath}`;
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  type = 'website',
  image = DEFAULT_IMAGE,
  noindex = false,
  keywords,
  structuredData,
}) => {
  const { language } = useLanguage();
  const location = useLocation();

  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Makijaż Permanentny Białystok`;
  const barePath = canonical || stripLangPrefix(location.pathname) || '/';
  const url = getLocalizedUrl(barePath, language);

  return (
    <Helmet>
      <html lang={language} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}

      {/* Hreflang alternate links — each pointing to a unique URL per language */}
      {LANGUAGES.map(lang => (
        <link key={lang} rel="alternate" hrefLang={lang} href={getLocalizedUrl(barePath, lang)} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${barePath}`} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={OG_LOCALES[language]} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
