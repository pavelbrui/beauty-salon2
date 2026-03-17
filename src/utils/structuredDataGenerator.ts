/**
 * Structured Data Generator for Schema.org markup
 * Generates JSON-LD for various content types
 */

export interface LocalBusinessData {
  name: string;
  description?: string;
  url: string;
  telephone: string;
  email?: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  image?: string;
  priceRange?: string;
  openingHoursSpecification?: Array<{
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export interface ServiceData {
  name: string;
  description: string;
  provider: {
    name: string;
    url: string;
  };
  price?: number;
  priceCurrency?: string;
  duration?: string;
  image?: string;
}

export interface ReviewData {
  author: string;
  datePublished: string;
  reviewRating: {
    ratingValue: number;
    bestRating: number;
    worstRating: number;
  };
  reviewBody: string;
}

/**
 * Generate LocalBusiness schema.org markup
 * Used for salon/business information
 */
export const generateLocalBusinessSchema = (data: LocalBusinessData) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': data.url,
    name: data.name,
    url: data.url,
    telephone: data.telephone,
    ...(data.email && { email: data.email }),
    ...(data.description && { description: data.description }),
    ...(data.image && { image: data.image }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.address.streetAddress,
      addressLocality: data.address.addressLocality,
      postalCode: data.address.postalCode,
      addressCountry: data.address.addressCountry,
    },
    ...(data.priceRange && { priceRange: data.priceRange }),
    ...(data.openingHoursSpecification && {
      openingHoursSpecification: data.openingHoursSpecification.map(hours => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: hours.dayOfWeek,
        opens: hours.opens,
        closes: hours.closes,
      })),
    }),
    ...(data.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.aggregateRating.ratingValue,
        reviewCount: data.aggregateRating.reviewCount,
      },
    }),
  };
};

/**
 * Generate Service schema.org markup
 * Used for individual service pages
 */
export const generateServiceSchema = (data: ServiceData) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.name,
    description: data.description,
    provider: {
      '@type': 'LocalBusiness',
      name: data.provider.name,
      url: data.provider.url,
    },
    ...(data.image && { image: data.image }),
    ...(data.price && {
      offers: {
        '@type': 'Offer',
        priceCurrency: data.priceCurrency || 'PLN',
        price: data.price,
      },
    }),
    ...(data.duration && { duration: data.duration }),
  };
};

/**
 * Generate Review schema.org markup
 * Used for customer reviews
 */
export const generateReviewSchema = (data: ReviewData) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: data.author,
    },
    datePublished: data.datePublished,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: data.reviewRating.ratingValue,
      bestRating: data.reviewRating.bestRating,
      worstRating: data.reviewRating.worstRating,
    },
    reviewBody: data.reviewBody,
  };
};

/**
 * Generate Organization schema.org markup
 * Used for company/organization information
 */
export const generateOrganizationSchema = (data: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    telephone: string;
    contactType: string;
  };
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    ...(data.logo && { logo: data.logo }),
    ...(data.description && { description: data.description }),
    ...(data.sameAs && { sameAs: data.sameAs }),
    ...(data.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: data.contactPoint.telephone,
        contactType: data.contactPoint.contactType,
      },
    }),
  };
};

/**
 * Generate Event schema.org markup
 * Used for special promotions or events
 */
export const generateEventSchema = (data: {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address: string;
  };
  image?: string;
  url?: string;
  offers?: {
    price: number;
    priceCurrency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  };
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    ...(data.endDate && { endDate: data.endDate }),
    location: {
      '@type': 'Place',
      name: data.location.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.location.address,
      },
    },
    ...(data.image && { image: data.image }),
    ...(data.url && { url: data.url }),
    ...(data.offers && {
      offers: {
        '@type': 'Offer',
        price: data.offers.price,
        priceCurrency: data.offers.priceCurrency,
        availability: `https://schema.org/${data.offers.availability}`,
      },
    }),
  };
};

/**
 * Generate AggregateOffer schema.org markup
 * Used for multiple service offerings
 */
export const generateAggregateOfferSchema = (data: {
  priceCurrency: string;
  lowPrice: number;
  highPrice: number;
  offerCount: number;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateOffer',
    priceCurrency: data.priceCurrency,
    lowPrice: data.lowPrice,
    highPrice: data.highPrice,
    offerCount: data.offerCount,
  };
};

/**
 * Generate ContactPoint schema.org markup
 * Used for contact information
 */
export const generateContactPointSchema = (data: {
  telephone: string;
  contactType: string;
  areaServed?: string;
  availableLanguage?: string[];
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPoint',
    telephone: data.telephone,
    contactType: data.contactType,
    ...(data.areaServed && { areaServed: data.areaServed }),
    ...(data.availableLanguage && { availableLanguage: data.availableLanguage }),
  };
};

/**
 * Combine multiple schema.org objects into a single JSON-LD array
 * Useful when you need multiple schema types on one page
 */
export const combineSchemaMarkup = (schemas: any[]): any => {
  if (schemas.length === 1) {
    return schemas[0];
  }

  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };
};
