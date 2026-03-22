import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { stripLangPrefix } from '../hooks/useLocalizedPath';
import { getRouteAlternates } from '../utils/routeAlternates';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  image?: string;
  noindex?: boolean;
  keywords?: string[];
  structuredData?: Record<string, unknown>;
  breadcrumbs?: BreadcrumbItem[];
  /** Custom per-language alternate paths. Overrides default hreflang generation. */
  alternates?: {
    pl: string;
    en: string;
    ru: string;
  };
}

const SITE_NAME = 'Salon Kosmetyczny Katarzyna Brui';
const SITE_NAME_SHORT = 'Katarzyna Brui';
const DEFAULT_DESCRIPTION = 'Profesjonalny salon kosmetyczny w Białymstoku. Makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi, peeling węglowy, manicure. Rezerwacja online.';
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
  breadcrumbs,
  alternates,
}) => {
  const { language } = useLanguage();
  const location = useLocation();

  const fullTitle = title ? `${title} | ${SITE_NAME_SHORT}` : `${SITE_NAME} | Makijaż Permanentny Białystok`;
  const barePath = canonical || stripLangPrefix(location.pathname) || '/';
  const url = getLocalizedUrl(barePath, language);

  // Per-language paths for hreflang: custom alternates → route map → same barePath fallback
  const altPaths = alternates || getRouteAlternates(barePath);

  return (
    <Helmet>
      <html lang={language} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1'} />
      <link rel="canonical" href={url} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}

      {/* Hreflang alternate links — skip for noindex pages */}
      {!noindex && LANGUAGES.map(lang => (
        <link key={lang} rel="alternate" hrefLang={lang} href={getLocalizedUrl(altPaths[lang], lang)} />
      ))}
      {!noindex && <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${altPaths.pl}`} />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={OG_LOCALES[language]} />
      {!noindex && LANGUAGES.filter(l => l !== language).map(lang => (
        <meta key={`og-alt-${lang}`} property="og:locale:alternate" content={OG_LOCALES[lang]} />
      ))}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title || 'Salon Kosmetyczny Katarzyna Brui Białystok'} />
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': breadcrumbs.map((item, i) => ({
              '@type': 'ListItem',
              'position': i + 1,
              'name': item.name,
              'item': getLocalizedUrl(item.url, language),
            })),
          })}
        </script>
      )}
    </Helmet>
  );
};
