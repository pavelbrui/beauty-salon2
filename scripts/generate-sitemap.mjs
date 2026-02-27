import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

/** Load .env file into process.env (only sets vars not already defined). */
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

const BASE_URL = 'https://katarzynabrui.pl';
const LOCALES = ['pl', 'en', 'ru'];
const SITEMAP_PATH = `${process.cwd()}/public/sitemap.xml`;

const DYNAMIC_START = '<!-- DYNAMIC CONTENT START: auto-generated. Do not edit manually. -->';
const DYNAMIC_END = '<!-- DYNAMIC CONTENT END -->';

const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>
`;

const xmlEscape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const localizedUrl = (barePath, locale) => {
  if (locale === 'pl') {
    return `${BASE_URL}${barePath}`;
  }
  return `${BASE_URL}/${locale}${barePath}`;
};

const formatLastmod = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const renderAlternateLinks = (barePath) =>
  [
    ...LOCALES.map(
      (locale) =>
        `    <xhtml:link rel="alternate" hreflang="${locale}" href="${xmlEscape(localizedUrl(barePath, locale))}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(localizedUrl(barePath, 'pl'))}"/>`,
  ].join('\n');

const renderUrlEntry = ({ barePath, locale, changefreq, priority, lastmod }) => {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';

  return `  <url>
    <loc>${xmlEscape(localizedUrl(barePath, locale))}</loc>
${renderAlternateLinks(barePath)}${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
};

const renderLocalizedEntries = ({ barePath, changefreq, priority, lastmod }) =>
  LOCALES.map((locale) =>
    renderUrlEntry({
      barePath,
      locale,
      changefreq,
      priority,
      lastmod,
    })
  ).join('\n');

const fetchSupabaseRows = async (table) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return [];
  }

  // blog_posts has published_at; trainings only has created_at/updated_at
  const hasPublishedAt = table === 'blog_posts';

  const params = new URLSearchParams({
    select: hasPublishedAt ? 'slug,updated_at,published_at' : 'slug,updated_at,created_at',
    is_published: 'eq.true',
    slug: 'not.is.null',
    order: hasPublishedAt ? 'published_at.desc.nullslast' : 'updated_at.desc.nullslast',
  });

  const endpoint = `${supabaseUrl}/rest/v1/${table}?${params.toString()}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`[sitemap] ${table} fetch failed: ${response.status} ${response.statusText}`);
      console.warn(`[sitemap] ${table} response: ${body.slice(0, 300)}`);
      return [];
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) return [];

    return rows
      .filter((row) => typeof row?.slug === 'string' && row.slug.trim().length > 0)
      .map((row) => ({
        slug: row.slug.trim(),
        lastmod: formatLastmod(row.updated_at || row.published_at || row.created_at),
      }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[sitemap] ${table} fetch failed: ${message}`);
    return [];
  }
};

/** Fetch distinct service categories from the services table. */
const fetchServiceCategories = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return [];

  const params = new URLSearchParams({
    select: 'category',
  });

  const endpoint = `${supabaseUrl}/rest/v1/services?${params.toString()}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      console.warn(`[sitemap] service categories fetch failed: ${response.status}`);
      return [];
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) return [];

    const unique = [...new Set(rows.map((r) => r.category).filter(Boolean))];
    return unique.sort();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[sitemap] service categories fetch failed: ${message}`);
    return [];
  }
};

const dedupeBySlug = (rows) => {
  const map = new Map();

  for (const row of rows) {
    if (!map.has(row.slug)) {
      map.set(row.slug, row);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.slug.localeCompare(b.slug));
};

const buildDynamicSection = ({ blogRows, trainingRows, categories }) => {
  const lines = [`  ${DYNAMIC_START}`];
  let count = 0;

  if (categories.length > 0) {
    lines.push('  <!-- Dynamic service category URLs -->');
    for (const cat of categories) {
      const barePath = `/services/${encodeURIComponent(cat)}`;
      lines.push(
        renderLocalizedEntries({
          barePath,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: null,
        })
      );
      count++;
    }
  }

  if (blogRows.length > 0) {
    lines.push('  <!-- Dynamic blog post URLs -->');
    for (const row of blogRows) {
      const barePath = `/blog/${encodeURIComponent(row.slug)}`;
      lines.push(
        renderLocalizedEntries({
          barePath,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: row.lastmod,
        })
      );
      count++;
    }
  }

  if (trainingRows.length > 0) {
    lines.push('  <!-- Dynamic training URLs -->');
    for (const row of trainingRows) {
      const barePath = `/training/${encodeURIComponent(row.slug)}`;
      lines.push(
        renderLocalizedEntries({
          barePath,
          changefreq: 'monthly',
          priority: '0.7',
          lastmod: row.lastmod,
        })
      );
      count++;
    }
  }

  if (count === 0) {
    lines.push('  <!-- No dynamic URLs detected during this build -->');
  }

  lines.push(`  ${DYNAMIC_END}`);
  return lines.join('\n');
};

const removeExistingDynamicSection = (sitemapContent) => {
  const pattern = new RegExp(
    `\\n?\\s*${escapeRegExp(DYNAMIC_START)}[\\s\\S]*?${escapeRegExp(DYNAMIC_END)}\\s*\\n?`,
    'm'
  );
  return sitemapContent.replace(pattern, '\n');
};

const main = async () => {
  await loadEnv();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[sitemap] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — skipping dynamic URLs.');
  }

  let sitemapContent = fallbackSitemap;

  try {
    sitemapContent = await readFile(SITEMAP_PATH, 'utf8');
  } catch {
    console.warn('[sitemap] public/sitemap.xml not found, creating a new one.');
  }

  const [blogRows, trainingRows, categories] = await Promise.all([
    fetchSupabaseRows('blog_posts').then(dedupeBySlug),
    fetchSupabaseRows('trainings').then(dedupeBySlug),
    fetchServiceCategories(),
  ]);

  const dynamicSection = buildDynamicSection({ blogRows, trainingRows, categories });
  const cleaned = removeExistingDynamicSection(sitemapContent);

  if (!cleaned.includes('</urlset>')) {
    throw new Error('[sitemap] Invalid sitemap.xml format: missing </urlset>.');
  }

  const updated = cleaned.replace('</urlset>', `${dynamicSection}\n</urlset>`);

  await writeFile(SITEMAP_PATH, updated, 'utf8');

  console.log(
    `[sitemap] Updated public/sitemap.xml (categories: ${categories.length}, blog: ${blogRows.length}, training: ${trainingRows.length}).`
  );
};

main().catch((error) => {
  console.error('[sitemap] Generation failed:', error);
  process.exit(1);
});
