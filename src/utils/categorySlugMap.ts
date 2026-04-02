import { slugify } from './slugify';

interface CategorySlugOverride {
  name: string;
  slug: string;
}

const CATEGORY_SLUG_OVERRIDES: CategorySlugOverride[] = [
  { name: 'Makijaż permanentny', slug: 'makijaz-permanentny' },
  { name: 'Stylizacja rzęs', slug: 'stylizacja-rzes' },
  { name: 'Rzęsy', slug: 'rzesy' },
  { name: 'Stylizacja brwi', slug: 'stylizacja-brwi' },
  { name: 'Pielęgnacja brwi', slug: 'pielegnacja-brwi' },
  { name: 'Manicure i pedicure', slug: 'manicure-i-pedicure' },
  { name: 'Peeling węglowy', slug: 'peeling-weglowy' },
  { name: 'Laserowe usuwanie', slug: 'laserowe-usuwanie' },
  { name: 'Manicure', slug: 'manicure' },
  { name: 'Pakiety', slug: 'pakiety' },
];

/**
 * Hardcoded mapping: DB category name → URL slug.
 * NEVER change existing slugs after deployment — it would break SEO and existing links.
 * Only ADD new entries when new categories are created.
 */
export const CATEGORY_NAME_TO_SLUG: Record<string, string> = {};

CATEGORY_SLUG_OVERRIDES.forEach(({ name, slug }) => {
  CATEGORY_NAME_TO_SLUG[name] = slug;
  CATEGORY_NAME_TO_SLUG[name.toLowerCase()] = slug;
});

/** Reverse map: slug → canonical DB category name */
export const SLUG_TO_CATEGORY_NAME: Record<string, string> = Object.fromEntries(
  CATEGORY_SLUG_OVERRIDES.map(({ name, slug }) => [slug, name])
);

/** Get slug for a category name. Falls back to slugify() for unknown categories. */
export function getCategorySlug(categoryName: string): string {
  return CATEGORY_NAME_TO_SLUG[categoryName]
    || CATEGORY_NAME_TO_SLUG[categoryName.toLowerCase()]
    || slugify(categoryName);
}

/** Get DB category name from a slug. Returns undefined if not found. */
export function getCategoryNameFromSlug(slug: string): string | undefined {
  return SLUG_TO_CATEGORY_NAME[slug];
}
