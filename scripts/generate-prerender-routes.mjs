/**
 * Generate prerender routes manifest for vite build.
 * Fetches dynamic slugs from Supabase (blog_posts, trainings, service_categories)
 * and outputs prerender-routes.json consumed by @prerenderer/rollup-plugin.
 *
 * Usage: node scripts/generate-prerender-routes.mjs
 * Runs as part of: npm run build
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

// Category slug map (must match src/utils/categorySlugMap.ts)
const CATEGORY_SLUG_MAP = {
  'makijaż permanentny': 'makijaz-permanentny',
  'stylizacja rzęs': 'stylizacja-rzes',
  'rzęsy': 'rzesy',
  'pielęgnacja brwi': 'pielegnacja-brwi',
  'peeling węglowy': 'peeling-weglowy',
  'laserowe usuwanie': 'laserowe-usuwanie',
  'manicure': 'manicure',
  'pakiety': 'pakiety',
};
const getCategorySlug = (name) =>
  CATEGORY_SLUG_MAP[name] || CATEGORY_SLUG_MAP[name.toLowerCase()] || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ── helpers (shared logic with generate-sitemap.mjs) ── */

const loadEnv = async () => {
  try {
    const content = await readFile(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env not found — env vars should be set by the host (e.g. Netlify)
  }
};

const fetchSupabaseRows = async (table) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  const hasPublishedAt = table === 'blog_posts';
  const params = new URLSearchParams({
    select: 'slug',
    is_published: 'eq.true',
    slug: 'not.is.null',
    order: hasPublishedAt ? 'published_at.desc.nullslast' : 'updated_at.desc.nullslast',
  });

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${params}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (!response.ok) return [];
    const rows = await response.json();
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((r) => typeof r?.slug === 'string' && r.slug.trim().length > 0)
      .map((r) => r.slug.trim());
  } catch {
    return [];
  }
};

const fetchServiceCategories = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/services?select=category`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (!response.ok) return [];
    const rows = await response.json();
    if (!Array.isArray(rows)) return [];
    return [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();
  } catch {
    return [];
  }
};

/** SEO landing page slugs (must match src/data/landingPages.ts) */
const LANDING_PAGE_SLUGS = [
  'makijaz-permanentny-bialystok',
  'stylizacja-rzes-bialystok',
  'laminacja-brwi-bialystok',
  'peeling-weglowy-bialystok',
  'usuwanie-tatuazu-bialystok',
  'manicure-bialystok',
  'pedicure-bialystok',
  'szkolenia-kosmetyczne-bialystok',
];

/* ── main ── */

const main = async () => {
  await loadEnv();

  const staticPages = [
    '/',
    '/services',
    '/prices',
    '/stylists',
    '/gallery',
    '/training',
    '/blog',
    ...LANDING_PAGE_SLUGS.map((s) => `/${s}`),
  ];

  const [blogSlugs, trainingSlugs, categories] = await Promise.all([
    fetchSupabaseRows('blog_posts'),
    fetchSupabaseRows('trainings'),
    fetchServiceCategories(),
  ]);

  console.log(`[prerender-routes] Found: ${blogSlugs.length} blog posts, ${trainingSlugs.length} trainings, ${categories.length} categories`);

  const dynamicPages = [
    ...categories.map((c) => `/services/${getCategorySlug(c)}`),
    ...blogSlugs.map((s) => `/blog/${encodeURIComponent(s)}`),
    ...trainingSlugs.map((s) => `/training/${encodeURIComponent(s)}`),
  ];

  const allBarePaths = [...staticPages, ...dynamicPages];

  // Generate language variants (pl = no prefix, en, ru)
  const allRoutes = [
    ...allBarePaths,
    ...allBarePaths.map((p) => `/en${p === '/' ? '/' : p}`),
    ...allBarePaths.map((p) => `/ru${p === '/' ? '/' : p}`),
  ];

  // Deduplicate
  const uniqueRoutes = [...new Set(allRoutes)];

  const outputPath = resolve(process.cwd(), 'prerender-routes.json');
  await writeFile(outputPath, JSON.stringify(uniqueRoutes, null, 2));
  console.log(`[prerender-routes] Generated ${uniqueRoutes.length} routes → prerender-routes.json`);
};

main().catch((err) => {
  console.error('[prerender-routes] Failed:', err);
  process.exit(1);
});
