import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BASE_URL, BUSINESS_PUBLISHER } from './businessData';

interface ArticleSchemaProps {
  headline: string;
  description: string;
  image?: string;
  author: string;
  datePublished?: string;
  dateModified?: string;
  /** Bare path, e.g. "/blog/my-post" */
  slug: string;
  /** Optional FAQ items extracted from content */
  faqItems?: { question: string; answer: string }[];
  /** Optional video URL from content blocks */
  videoUrl?: string;
}

/**
 * Renders an Article JSON-LD script for blog post detail pages.
 * Optionally includes a FAQPage in the @graph if faqItems are provided.
 */
export const ArticleSchema: React.FC<ArticleSchemaProps> = ({
  headline,
  description,
  image,
  author,
  datePublished,
  dateModified,
  slug,
  faqItems,
  videoUrl,
}) => {
  const articleSchema: Record<string, unknown> = {
    '@type': 'Article',
    headline,
    description,
    image: image || `${BASE_URL}/og-image.jpg`,
    author: { '@type': 'Person', name: author },
    publisher: BUSINESS_PUBLISHER,
    datePublished,
    dateModified,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}${slug}` },
    ...(videoUrl ? {
      video: {
        '@type': 'VideoObject',
        name: headline,
        description: description || headline,
        contentUrl: videoUrl,
        thumbnailUrl: image || `${BASE_URL}/og-image.jpg`,
        uploadDate: datePublished?.includes('T') ? datePublished : `${datePublished}T00:00:00+01:00`,
        publisher: BUSINESS_PUBLISHER,
      },
    } : {}),
  };

  const faqSchema: Record<string, unknown> | null =
    faqItems && faqItems.length > 0
      ? {
          '@type': 'FAQPage',
          mainEntity: faqItems.map(({ question, answer }) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer },
          })),
        }
      : null;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [articleSchema, ...(faqSchema ? [faqSchema] : [])],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
