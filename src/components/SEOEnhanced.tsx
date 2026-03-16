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

interface SEOEnhancedProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  image?: string;
  noindex?: boolean;
  keywords?: string[];
  structuredData?: Record<string, unknown>;
  breadcrumbs?: BreadcrumbItem[];
  alternates?: {
    pl: string;
    en: string;
    ru: string;
  };
  /** Article-specific metadata */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  /** Product-specific metadata */
  product?: {
    price?: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    rating?: number;
    reviewCount?: number;
  };
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

const getLocalizedUrl = (barePath: string, lang: string): string => {
  if (lang === 'pl') return `${BASE_URL}${barePath}`;
  return `${BASE_URL}/${lang}${barePath}`;
};

/**
 * Enhanced SEO component with support for articles, products, and advanced schema.org markup.
 * 
 * Features:
 * - Article schema support (blog posts)
 * - Product schema support (services)
 * - Breadcrumb navigation
 * - Multi-language hreflang support
 * - Open Graph and Twitter Card metadata
 * - Automatic canonical URL generation
 * 
 * Usage:
 * <SEOEnhanced
 *   title="Makijaż Permanentny Brwi"
 *   description="Profesjonalny makijaż permanentny brwi w Białymstoku"
 *   article={{
 *     publishedTime: "2024-01-15T10:00:00Z",
 *     author: "Katarzyna Brui"
 *   }}
 * />
 */
export const SEOEnhanced: React.FC<SEOEnhancedProps> = ({
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
  article,
  product,
}) => {
  const { language } = useLanguage();
  const location = useLocation();

  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Makijaż Permanentny Białystok`;
  const barePath = canonical || stripLangPrefix(location.pathname) || '/';
  const url = getLocalizedUrl(barePath, language);

  const altPaths = alternates || getRouteAlternates(barePath);

  // Generate Article schema if provided
  const generateArticleSchema = () => {
    if (!article) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: fullTitle,
      description: description,
      image: image,
      datePublished: article.publishedTime,
      dateModified: article.modifiedTime || article.publishedTime,
      author: {
        '@type': 'Person',
        name: article.author || SITE_NAME,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/logo.png`,
        },
      },
      ...(article.section && { articleSection: article.section }),
      ...(article.tags && { keywords: article.tags.join(', ') }),
    };
  };

  // Generate Product schema if provided
  const generateProductSchema = () => {
    if (!product) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: fullTitle,
      description: description,
      image: image,
      brand: {
        '@type': 'Brand',
        name: SITE_NAME,
      },
      ...(product.price && {
        offers: {
          '@type': 'Offer',
          url: url,
          priceCurrency: product.currency || 'PLN',
          price: product.price,
          availability: `https://schema.org/${product.availability || 'InStock'}`,
        },
      }),
      ...(product.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount || 1,
        },
      }),
    };
  };

  const articleSchema = generateArticleSchema();
  const productSchema = generateProductSchema();

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

      {/* Hreflang alternate links */}
      {!noindex && LANGUAGES.map(lang => (
        <link key={lang} rel="alternate" hrefLang={lang} href={getLocalizedUrl(altPaths[lang], lang)} />
      ))}
      {!noindex && <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${altPaths.pl}`} />}

      {/* Open Graph */}
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

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title || 'Salon Kosmetyczny Katarzyna Brui Białystok'} />

      {/* Article metadata */}
      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && (
        <meta property="article:author" content={article.author} />
      )}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
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

export default SEOEnhanced;
