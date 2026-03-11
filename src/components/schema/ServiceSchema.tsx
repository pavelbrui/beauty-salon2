import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BUSINESS_PROVIDER } from './businessData';

interface ServiceItem {
  name: string;
  description?: string;
  image?: string;
  category?: string;
  /** Price in cents */
  price: number;
}

interface ServiceSchemaProps {
  /** Catalog/page name shown in schema */
  catalogName: string;
  /** Full canonical URL of the page */
  url: string;
  /** Services to include in the OfferCatalog */
  services: ServiceItem[];
}

/**
 * Renders an OfferCatalog JSON-LD script for service listing pages.
 * Each service becomes an Offer with an itemOffered Service.
 */
export const ServiceSchema: React.FC<ServiceSchemaProps> = ({ catalogName, url, services }) => {
  if (services.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: catalogName,
    url,
    itemListElement: services.map(service => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        ...(service.description && { description: service.description }),
        ...(service.image && { image: service.image }),
        ...(service.category && { category: service.category }),
        provider: BUSINESS_PROVIDER,
      },
      price: (service.price / 100).toFixed(0),
      priceCurrency: 'PLN',
      availability: 'https://schema.org/InStock',
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
