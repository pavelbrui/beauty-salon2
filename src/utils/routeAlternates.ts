/**
 * Centralized route-to-hreflang mapping.
 *
 * Most routes share the same bare path across all languages (only the
 * /en or /ru prefix changes).  This map captures the exceptions —
 * routes whose *bare* path differs per language.
 *
 * To add a new translated route:
 *   1. Add both language variants as keys pointing to the same triple.
 *   2. SEO.tsx will resolve the correct alternates automatically.
 */

export interface RouteAlternates {
  pl: string;
  en: string;
  ru: string;
}

// ── Translated route groups ────────────────────────────────────────
// Each group lists every bare-path variant that maps to the same page.

const PRICES: RouteAlternates = { pl: '/cennik', en: '/prices', ru: '/prices' };

/**
 * Lookup table keyed by every known bare path that has a translated
 * counterpart.  Multiple keys can point to the same alternates object.
 */
const TRANSLATED_ROUTES: Record<string, RouteAlternates> = {
  '/cennik': PRICES,
  '/prices': PRICES,
};

/**
 * Return hreflang alternate paths for a given bare path.
 *
 * - If the path is in the translated-routes map, returns language-specific paths.
 * - Otherwise returns the same path for all three languages (the common case).
 */
export function getRouteAlternates(barePath: string): RouteAlternates {
  return TRANSLATED_ROUTES[barePath] ?? { pl: barePath, en: barePath, ru: barePath };
}
