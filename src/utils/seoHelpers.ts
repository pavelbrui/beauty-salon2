/**
 * SEO Helper utilities for dynamic content optimization
 */

export interface ServiceSEOData {
  name: string;
  description: string;
  price?: number;
  duration?: string;
  category?: string;
}

export interface BlogPostSEOData {
  title: string;
  description: string;
  slug: string;
  publishedDate: string;
  modifiedDate?: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
}

/**
 * Generate SEO-friendly title for a service page
 * 
 * @param serviceName - Name of the service
 * @param location - City/location (default: "Białystok")
 * @returns Optimized title for search engines
 * 
 * @example
 * generateServiceTitle("Makijaż permanentny brwi")
 * // Returns: "Makijaż permanentny brwi Białystok | Salon Katarzyna Brui"
 */
export const generateServiceTitle = (
  serviceName: string,
  location: string = 'Białystok'
): string => {
  return `${serviceName} ${location} | Salon Kosmetyczny Katarzyna Brui`;
};

/**
 * Generate SEO-friendly meta description for a service
 * 
 * @param serviceName - Name of the service
 * @param shortDescription - Brief description
 * @param location - City/location
 * @returns Meta description (max 160 characters)
 */
export const generateServiceDescription = (
  serviceName: string,
  shortDescription: string,
  location: string = 'Białystok'
): string => {
  const base = `${serviceName} w ${location}. ${shortDescription} Umów wizytę online!`;
  // Ensure description doesn't exceed 160 characters (Google's limit)
  return base.length > 160 ? base.substring(0, 157) + '...' : base;
};

/**
 * Generate keywords for a service based on common search patterns
 * 
 * @param serviceName - Name of the service
 * @param location - City/location
 * @returns Array of relevant keywords
 */
export const generateServiceKeywords = (
  serviceName: string,
  location: string = 'Białystok'
): string[] => {
  const keywords = [
    serviceName,
    `${serviceName} ${location}`,
    `${serviceName} cena`,
    `${serviceName} opinie`,
    `najlepszy ${serviceName.toLowerCase()} ${location}`,
    `${serviceName} salon`,
    `${serviceName} profesjonalnie`,
  ];
  return keywords;
};

/**
 * Generate canonical URL for a service page
 * 
 * @param serviceSlug - URL-friendly service slug
 * @param language - Language code (pl, en, ru)
 * @returns Full canonical URL
 */
export const generateServiceCanonical = (
  serviceSlug: string,
  language: string = 'pl'
): string => {
  const baseUrl = 'https://katarzynabrui.pl';
  const path = `/services/${serviceSlug}`;
  
  if (language === 'pl') {
    return `${baseUrl}${path}`;
  }
  return `${baseUrl}/${language}${path}`;
};

/**
 * Generate breadcrumb items for a service page
 * 
 * @param serviceName - Display name of the service
 * @param serviceSlug - URL-friendly service slug
 * @returns Array of breadcrumb items
 */
export const generateServiceBreadcrumbs = (
  serviceName: string,
  serviceSlug: string
) => {
  return [
    { name: 'Strona główna', url: '/' },
    { name: 'Zabiegi', url: '/services' },
    { name: serviceName, url: `/services/${serviceSlug}` },
  ];
};

/**
 * Generate SEO-friendly title for a blog post
 * 
 * @param postTitle - Original blog post title
 * @returns Optimized title with site name
 */
export const generateBlogTitle = (postTitle: string): string => {
  return `${postTitle} | Blog Salon Katarzyna Brui`;
};

/**
 * Generate breadcrumb items for a blog post
 * 
 * @param postTitle - Display name of the post
 * @param postSlug - URL-friendly post slug
 * @returns Array of breadcrumb items
 */
export const generateBlogBreadcrumbs = (
  postTitle: string,
  postSlug: string
) => {
  return [
    { name: 'Strona główna', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: postTitle, url: `/blog/${postSlug}` },
  ];
};

/**
 * Sanitize and normalize text for use in meta tags
 * Removes special characters and extra whitespace
 * 
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export const sanitizeMetaText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>"]/g, '') // Remove HTML-like characters
    .trim();
};

/**
 * Generate structured data for a service (Product schema)
 * 
 * @param data - Service SEO data
 * @param baseUrl - Base URL of the site
 * @returns Schema.org Product schema object
 */
export const generateServiceSchema = (
  data: ServiceSEOData,
  baseUrl: string = 'https://katarzynabrui.pl'
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.name,
    description: data.description,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Salon Kosmetyczny Katarzyna Brui',
      url: baseUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'ul. Młynowa 46, Lok U11',
        addressLocality: 'Białystok',
        postalCode: '15-404',
        addressCountry: 'PL',
      },
      telephone: '+48 880 435 102',
    },
    ...(data.price && {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'PLN',
        price: data.price,
      },
    }),
    ...(data.duration && { duration: data.duration }),
  };
};

/**
 * Generate structured data for a blog post (Article schema)
 * 
 * @param data - Blog post SEO data
 * @param baseUrl - Base URL of the site
 * @returns Schema.org Article schema object
 */
export const generateBlogSchema = (
  data: BlogPostSEOData,
  baseUrl: string = 'https://katarzynabrui.pl'
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    description: data.description,
    image: data.coverImage || `${baseUrl}/og-image.jpg`,
    datePublished: data.publishedDate,
    dateModified: data.modifiedDate || data.publishedDate,
    author: {
      '@type': 'Person',
      name: data.author || 'Salon Kosmetyczny Katarzyna Brui',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Salon Kosmetyczny Katarzyna Brui',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    url: `${baseUrl}/blog/${data.slug}`,
    ...(data.tags && { keywords: data.tags.join(', ') }),
  };
};
