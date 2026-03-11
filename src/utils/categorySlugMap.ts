import { slugify } from './slugify';

/**
 * Hardcoded mapping: DB category name → URL slug.
 * NEVER change existing slugs after deployment — it would break SEO and existing links.
 * Only ADD new entries when new categories are created.
 */
export const CATEGORY_NAME_TO_SLUG: Record<string, string> = {
  'makijaż permanentny': 'makijaz-permanentny',
  'stylizacja rzęs': 'stylizacja-rzes',
  'rzęsy': 'rzesy',
  'pielęgnacja brwi': 'pielegnacja-brwi',
  'peeling węglowy': 'peeling-weglowy',
  'laserowe usuwanie': 'laserowe-usuwanie',
  'manicure': 'manicure',
  'pakiety': 'pakiety',
};

/** Reverse map: slug → DB category name */
export const SLUG_TO_CATEGORY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_NAME_TO_SLUG).map(([name, slug]) => [slug, name])
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
