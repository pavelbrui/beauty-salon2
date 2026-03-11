/** Centralized business data for structured data (JSON-LD) across the site. */

export const BASE_URL = 'https://katarzynabrui.pl';

export const BUSINESS_NAME = 'Salon Kosmetyczny Katarzyna Brui';

export const BUSINESS_ADDRESS = {
  '@type': 'PostalAddress' as const,
  streetAddress: 'ul. Młynowa 46, Lok U11',
  addressLocality: 'Białystok',
  postalCode: '15-404',
  addressCountry: 'PL',
};

export const BUSINESS_GEO = {
  '@type': 'GeoCoordinates' as const,
  latitude: 53.1274782,
  longitude: 23.1462283,
};

export const BUSINESS_TELEPHONE = '+48880435102';

export const BUSINESS_OPENING_HOURS = [
  {
    '@type': 'OpeningHoursSpecification' as const,
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '20:00',
  },
  {
    '@type': 'OpeningHoursSpecification' as const,
    dayOfWeek: 'Saturday',
    opens: '09:00',
    closes: '16:00',
  },
];

export const BUSINESS_AGGREGATE_RATING = {
  '@type': 'AggregateRating' as const,
  ratingValue: '5.0',
  reviewCount: '384',
  bestRating: '5',
  worstRating: '1',
  url: 'https://booksy.com/pl-pl/162206_katarzyna-brui_salon-kosmetyczny_5869_bialystok',
};

export const BUSINESS_SAME_AS = [
  'https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/',
  'https://www.instagram.com/katarzyna.brui_',
  'https://booksy.com/pl-pl/162206_katarzyna-brui_salon-kosmetyczny_5869_bialystok',
];

export const BUSINESS_IMAGES = [
  `${BASE_URL}/og-image.jpg`,
  `${BASE_URL}/og-image2.jpg`,
];

/** Minimal provider object for use in Service/Offer schemas. */
export const BUSINESS_PROVIDER = {
  '@type': 'BeautySalon' as const,
  name: BUSINESS_NAME,
  address: BUSINESS_ADDRESS,
  telephone: BUSINESS_TELEPHONE,
};

/** Publisher object for Article schemas. */
export const BUSINESS_PUBLISHER = {
  '@type': 'Organization' as const,
  name: BUSINESS_NAME,
  logo: {
    '@type': 'ImageObject' as const,
    url: `${BASE_URL}/og-image.jpg`,
  },
};
