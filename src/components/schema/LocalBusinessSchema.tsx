import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BASE_URL,
  BUSINESS_NAME,
  BUSINESS_ADDRESS,
  BUSINESS_GEO,
  BUSINESS_TELEPHONE,
  BUSINESS_OPENING_HOURS,
  BUSINESS_AGGREGATE_RATING,
  BUSINESS_SAME_AS,
  BUSINESS_IMAGES,
} from './businessData';

/**
 * Renders a BeautySalon (subtype of LocalBusiness) JSON-LD script.
 * Use on the homepage. Includes address, geo, opening hours, rating, sameAs.
 */
export const LocalBusinessSchema: React.FC = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: BUSINESS_NAME,
    image: BUSINESS_IMAGES,
    url: BASE_URL,
    telephone: BUSINESS_TELEPHONE,
    priceRange: '$$',
    address: BUSINESS_ADDRESS,
    geo: BUSINESS_GEO,
    openingHoursSpecification: BUSINESS_OPENING_HOURS,
    aggregateRating: BUSINESS_AGGREGATE_RATING,
    sameAs: BUSINESS_SAME_AS,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
