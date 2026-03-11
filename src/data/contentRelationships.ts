/**
 * Static content relationship mappings between blog categories,
 * service categories, and landing pages.
 * Used for internal linking (blog ↔ services ↔ landing pages).
 */

export interface LocalizedText {
  pl: string;
  en: string;
  ru: string;
}

export interface ContentRelationship {
  blogCategory: string;
  serviceCategories: string[];
  landingPageSlugs: string[];
  ctaLink: string;
  ctaText: LocalizedText;
}

export interface LandingRelationship {
  landingSlug: string;
  relatedBlogCategories: string[];
}

// Blog category → service categories + landing pages + CTA
export const BLOG_TO_SERVICE_MAP: ContentRelationship[] = [
  {
    blogCategory: 'permanent_makeup',
    serviceCategories: ['Makijaż permanentny'],
    landingPageSlugs: ['makijaz-permanentny-bialystok'],
    ctaLink: '/makijaz-permanentny-bialystok',
    ctaText: {
      pl: 'Zobacz ofertę makijażu permanentnego',
      en: 'View permanent makeup offer',
      ru: 'Смотреть предложение перманентного макияжа',
    },
  },
  {
    blogCategory: 'brows_lashes',
    serviceCategories: ['Pielęgnacja brwi', 'Stylizacja rzęs'],
    landingPageSlugs: ['laminacja-brwi-bialystok', 'stylizacja-rzes-bialystok'],
    ctaLink: '/laminacja-brwi-bialystok',
    ctaText: {
      pl: 'Sprawdź zabiegi brwi i rzęs',
      en: 'Check brow & lash treatments',
      ru: 'Посмотреть процедуры для бровей и ресниц',
    },
  },
  {
    blogCategory: 'manicure',
    serviceCategories: ['Manicure i pedicure'],
    landingPageSlugs: ['manicure-bialystok', 'pedicure-bialystok'],
    ctaLink: '/manicure-bialystok',
    ctaText: {
      pl: 'Zobacz ofertę manicure i pedicure',
      en: 'View manicure & pedicure offer',
      ru: 'Смотреть предложение маникюра и педикюра',
    },
  },
  {
    blogCategory: 'tips',
    serviceCategories: [],
    landingPageSlugs: [],
    ctaLink: '/services',
    ctaText: {
      pl: 'Zobacz wszystkie usługi',
      en: 'View all services',
      ru: 'Смотреть все услуги',
    },
  },
];

// Landing page slug → blog categories to fetch related articles
export const LANDING_TO_BLOG_MAP: LandingRelationship[] = [
  { landingSlug: 'makijaz-permanentny-bialystok', relatedBlogCategories: ['permanent_makeup', 'tips'] },
  { landingSlug: 'stylizacja-rzes-bialystok', relatedBlogCategories: ['brows_lashes', 'tips'] },
  { landingSlug: 'laminacja-brwi-bialystok', relatedBlogCategories: ['brows_lashes', 'tips'] },
  { landingSlug: 'peeling-weglowy-bialystok', relatedBlogCategories: ['tips'] },
  { landingSlug: 'usuwanie-tatuazu-bialystok', relatedBlogCategories: ['permanent_makeup', 'tips'] },
  { landingSlug: 'manicure-bialystok', relatedBlogCategories: ['manicure', 'tips'] },
  { landingSlug: 'pedicure-bialystok', relatedBlogCategories: ['manicure', 'tips'] },
  { landingSlug: 'szkolenia-kosmetyczne-bialystok', relatedBlogCategories: ['permanent_makeup', 'brows_lashes', 'manicure'] },
];

// Service category name → blog categories (for ServicesPage)
export const SERVICE_CATEGORY_TO_BLOG: Record<string, string[]> = {
  'Makijaż permanentny': ['permanent_makeup'],
  'Stylizacja rzęs': ['brows_lashes'],
  'Pielęgnacja brwi': ['brows_lashes'],
  'Peeling węglowy': ['tips'],
  'Laserowe usuwanie': ['permanent_makeup', 'tips'],
  'Manicure i pedicure': ['manicure'],
};

// --- Helpers ---

export const getBlogRelationship = (blogCategory: string): ContentRelationship | undefined =>
  BLOG_TO_SERVICE_MAP.find(r => r.blogCategory === blogCategory);

export const getLandingRelationship = (landingSlug: string): LandingRelationship | undefined =>
  LANDING_TO_BLOG_MAP.find(r => r.landingSlug === landingSlug);

export const getBlogCategoriesForServiceCategory = (serviceCategory: string): string[] =>
  SERVICE_CATEGORY_TO_BLOG[serviceCategory] || [];
