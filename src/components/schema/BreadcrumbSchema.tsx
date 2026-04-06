import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../hooks/useLanguage';
import { BASE_URL } from './businessData';

export interface BreadcrumbItem {
  name: string;
  /** Bare path without language prefix, e.g. "/services" */
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

/** Ensure path ends with trailing slash (Netlify serves prerendered pages at /path/). */
const ensureTrailingSlash = (path: string): string =>
  path.endsWith('/') ? path : `${path}/`;

/** Build full URL with language prefix and trailing slash. Polish gets no prefix. */
const getLocalizedUrl = (barePath: string, lang: string): string => {
  const path = ensureTrailingSlash(barePath);
  if (lang === 'pl') return `${BASE_URL}${path}`;
  return `${BASE_URL}/${lang}${path}`;
};

/**
 * Renders a BreadcrumbList JSON-LD script.
 * Automatically applies the current language prefix to URLs.
 */
export const BreadcrumbSchema: React.FC<BreadcrumbSchemaProps> = ({ items }) => {
  const { language } = useLanguage();

  if (items.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: getLocalizedUrl(item.url, language),
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
