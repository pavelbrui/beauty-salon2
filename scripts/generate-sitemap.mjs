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
const SITEMAP_PATH = `${process.cwd()}/public/sitemap.xml`;

const DYNAMIC_START = '<!-- DYNAMIC CONTENT START: auto-generated. Do not edit manually. -->';
const DYNAMIC_END = '<!-- DYNAMIC CONTENT END -->';

const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
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

/** Render <image:image> tags. images = [{ url, title?, caption? }] */
const renderImageTags = (images) => {
  if (!images || images.length === 0) return '';
  return images
    .map((img) => {
      const titleTag = img.title ? `\n      <image:title>${xmlEscape(img.title)}</image:title>` : '';
      const captionTag = img.caption ? `\n      <image:caption>${xmlEscape(img.caption)}</image:caption>` : '';
      return `    <image:image>\n      <image:loc>${xmlEscape(img.url)}</image:loc>${titleTag}${captionTag}\n    </image:image>`;
    })
    .join('\n');
};

/** Google-supported video formats for sitemap video:content_loc */
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.3gp', '.m4v'];
const isSupportedVideoFormat = (url) => {
  const lower = url.toLowerCase().split('?')[0];
  return SUPPORTED_VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext));
};

/** Render <video:video> tags. videos = [{ contentUrl, thumbnailUrl, title, description, uploadDate? }] */
const renderVideoTags = (videos) => {
  if (!videos || videos.length === 0) return '';
  const supported = videos.filter(v => isSupportedVideoFormat(v.contentUrl));
  if (supported.length === 0) return '';
  return supported
    .map((v) => {
      const uploadTag = v.uploadDate ? `\n      <video:publication_date>${xmlEscape(v.uploadDate)}</video:publication_date>` : '';
      return `    <video:video>
      <video:content_loc>${xmlEscape(v.contentUrl)}</video:content_loc>
      <video:thumbnail_loc>${xmlEscape(v.thumbnailUrl)}</video:thumbnail_loc>
      <video:title>${xmlEscape(v.title)}</video:title>
      <video:description>${xmlEscape(v.description)}</video:description>${uploadTag}
    </video:video>`;
    })
    .join('\n');
};

const renderUrlEntry = ({ barePath, locale, changefreq, priority, lastmod, images, videos }) => {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  const imageTags = images?.length ? `\n${renderImageTags(images)}` : '';
  const videoTags = videos?.length ? `\n${renderVideoTags(videos)}` : '';

  return `  <url>
    <loc>${xmlEscape(localizedUrl(barePath, locale))}</loc>
${renderAlternateLinks(barePath)}${lastmodTag}${imageTags}${videoTags}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
};

const renderLocalizedEntries = ({ barePath, changefreq, priority, lastmod, images, videos }) =>
  LOCALES.map((locale) =>
    renderUrlEntry({
      barePath,
      locale,
      changefreq,
      priority,
      lastmod,
      images,
      videos,
    })
  ).join('\n');

const fetchSupabaseRows = async (table) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return [];
  }

  // blog_posts has published_at + title; trainings has created_at + title
  const hasPublishedAt = table === 'blog_posts';

  const params = new URLSearchParams({
    select: hasPublishedAt
      ? 'slug,title,cover_image_url,updated_at,published_at'
      : 'slug,title,cover_image_url,updated_at,created_at',
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
        title: row.title || '',
        coverImage: row.cover_image_url || null,
        lastmod: formatLastmod(row.updated_at || row.published_at || row.created_at),
      }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[sitemap] ${table} fetch failed: ${message}`);
    return [];
  }
};

/** Helper to call Supabase REST API. */
const supabaseFetch = async (path) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) return null;
  return response.json();
};

/** Hardcoded fallback images per category (from src/assets/images.ts / Booksy CDN). */
const CATEGORY_FALLBACK_IMAGES = {
  'Makijaż permanentny': {
    url: 'https://d375139ucebi94.cloudfront.net/region2/pl/162206/biz_photo/5a73327f21184b88a8b9fedfb56a61-katarzyna-brui-biz-photo-1d98bd067f1944208bd8a14a6dcbde-booksy.jpeg',
    title: 'Makijaż permanentny brwi – salon Katarzyna Brui Białystok',
  },
  'Stylizacja rzęs': {
    url: 'https://d375139ucebi94.cloudfront.net/region2/pl/162206/biz_photo/fae2fc9a84a544ceafb0a8aca24206-katarzyna-brui-biz-photo-74fdb20b9f8342fd83839bde75da44-booksy.jpeg',
    title: 'Stylizacja rzęs – salon Katarzyna Brui Białystok',
  },
  'Laserowe usuwanie': {
    url: 'https://d375139ucebi94.cloudfront.net/region2/pl/162206/service_photos/1c4f01a9291a45a1aeea8def0189905a.jpeg',
    title: 'Laserowe usuwanie tatuażu – salon Katarzyna Brui Białystok',
  },
  'Manicure i pedicure': {
    url: 'https://d375139ucebi94.cloudfront.net/region2/pl/162206/service_photos/5d5b6ace0dbd48d29c5eb4f0161e7f34.jpeg',
    title: 'Manicure hybrydowy – salon Katarzyna Brui Białystok',
  },
  'Peeling węglowy': {
    url: 'https://d375139ucebi94.cloudfront.net/region2/pl/162206/service_photos/9747b7458ba3419d995eed0367b690c1.jpeg',
    title: 'Peeling węglowy – salon Katarzyna Brui Białystok',
  },
};

/** Keyword-rich video SEO data per category (popular search queries for Białystok). */
const CATEGORY_VIDEO_SEO = {
  'Makijaż permanentny': {
    title: 'Makijaż permanentny brwi Białystok – brwi pudrowe, ombre brows, microblading, nanopigmentacja',
    description: 'Makijaż permanentny brwi i ust Białystok – efekty zabiegów. Brwi pudrowe (powder brows), ombre brwi, microblading, nano brows, combo brows, makijaż permanentny ust. Najlepsza linergistka Białystok – salon Katarzyna Brui. Cena, metody, efekty.',
  },
  'Stylizacja rzęs': {
    title: 'Przedłużanie rzęs Białystok – rzęsy objętościowe 2D 3D, laminacja rzęs',
    description: 'Stylizacja i przedłużanie rzęs w Białymstoku. Rzęsy 1:1, objętościowe 2D 3D, laminacja rzęs, lifting rzęs – salon Katarzyna Brui.',
  },
  'Pielęgnacja brwi': {
    title: 'Laminacja brwi Białystok – henna pudrowa, regulacja, botox brwi',
    description: 'Pielęgnacja brwi w Białymstoku. Laminacja brwi, henna pudrowa, regulacja, botox brwi, styling brwi – salon kosmetyczny Katarzyna Brui.',
  },
  'Peeling węglowy': {
    title: 'Peeling węglowy Białystok – carbon peeling, laserowe oczyszczanie skóry',
    description: 'Peeling węglowy (carbon peeling) w Białymstoku. Laserowe oczyszczanie skóry, peeling laserowy, oczyszczanie twarzy – salon Katarzyna Brui.',
  },
  'Laserowe usuwanie': {
    title: 'Usuwanie tatuażu Białystok – laser Nd:YAG, usuwanie makijażu permanentnego',
    description: 'Laserowe usuwanie tatuażu i makijażu permanentnego w Białymstoku. Laser Nd:YAG, bezpieczne usuwanie – salon Katarzyna Brui.',
  },
  'Manicure i pedicure': {
    title: 'Manicure hybrydowy Białystok – manicure żelowy, japoński, pedicure',
    description: 'Manicure i pedicure w Białymstoku. Manicure hybrydowy, żelowy, klasyczny, japoński, pedicure – salon kosmetyczny Katarzyna Brui.',
  },
  'Manicure': {
    title: 'Manicure hybrydowy Białystok – żelowy, klasyczny, japoński',
    description: 'Manicure w Białymstoku. Manicure hybrydowy, żelowy, klasyczny, japoński, paznokcie – salon kosmetyczny Katarzyna Brui.',
  },
  'Rzęsy': {
    title: 'Przedłużanie rzęs Białystok – rzęsy 1:1, objętościowe, laminacja',
    description: 'Rzęsy w Białymstoku. Przedłużanie rzęs 1:1, objętościowe 2D 3D, laminacja, lifting rzęs – salon Katarzyna Brui.',
  },
};

/** Fetch service categories with images and videos (from service_categories table + fallbacks). */
const fetchServiceCategories = async () => {
  try {
    // Fetch from service_categories (has image_url, video_url) and also the distinct categories from services table
    const [catRows, serviceRows] = await Promise.all([
      supabaseFetch('service_categories?select=name,image_url,video_url'),
      supabaseFetch('services?select=category'),
    ]);

    // Merge: use service_categories image_url if available, otherwise use fallback
    const catImageMap = new Map();
    const catVideoMap = new Map();
    if (Array.isArray(catRows)) {
      for (const row of catRows) {
        if (row.name && row.image_url) {
          catImageMap.set(row.name, {
            url: row.image_url,
            title: `${row.name} – salon Katarzyna Brui Białystok`,
          });
        }
        if (row.name && row.video_url) {
          const thumbnailUrl = row.image_url || (CATEGORY_FALLBACK_IMAGES[row.name]?.url) || `${BASE_URL}/og-image.jpg`;
          const seo = CATEGORY_VIDEO_SEO[row.name];
          catVideoMap.set(row.name, {
            contentUrl: row.video_url,
            thumbnailUrl,
            title: seo?.title || `${row.name} – salon Katarzyna Brui Białystok`,
            description: seo?.description || `${row.name} – usługi kosmetyczne w salonie Katarzyna Brui, Białystok`,
          });
        }
      }
    }

    // Get distinct category names from services
    const allCategories = Array.isArray(serviceRows)
      ? [...new Set(serviceRows.map((r) => r.category).filter(Boolean))].sort()
      : [];

    return allCategories.map((cat) => {
      const dbImage = catImageMap.get(cat);
      const fallback = CATEGORY_FALLBACK_IMAGES[cat];
      const images = dbImage ? [dbImage] : fallback ? [fallback] : [];
      const video = catVideoMap.get(cat);
      const videos = video ? [video] : [];
      return { name: cat, images, videos };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[sitemap] service categories fetch failed: ${message}`);
    return [];
  }
};

/** Map service_images category → service_categories name */
const IMAGE_CAT_TO_SERVICE_CAT = {
  makijaz: 'Makijaż permanentny',
  rzesy: 'Stylizacja rzęs',
  brwi: 'Stylizacja brwi',
  laser: 'Laserowe usuwanie',
  manicure: 'Manicure i pedicure',
  pedicure: 'Manicure i pedicure',
  peeling: 'Peeling węglowy',
};

/** Fetch all service_images for gallery + category enrichment. */
const fetchServiceImages = async () => {
  const rows = await supabaseFetch('service_images?select=url,alt_text,category,description&order=category');
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => r.url);
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

const buildDynamicSection = ({ blogRows, trainingRows, categories, serviceImages }) => {
  const lines = [`  ${DYNAMIC_START}`];
  let count = 0;

  // Build image lists from service_images per category
  const serviceImagesByCategory = new Map();
  const allGalleryImages = [];
  for (const img of serviceImages) {
    const sitemapImg = {
      url: img.url,
      title: img.description || img.alt_text || 'Zabieg kosmetyczny – salon Katarzyna Brui Białystok',
    };
    allGalleryImages.push(sitemapImg);
    const serviceCat = IMAGE_CAT_TO_SERVICE_CAT[img.category];
    if (serviceCat) {
      const existing = serviceImagesByCategory.get(serviceCat) || [];
      existing.push(sitemapImg);
      serviceImagesByCategory.set(serviceCat, existing);
    }
  }

  // Note: gallery images are added in the Netlify function sitemap.
  // The static sitemap.xml already has /gallery entries; no duplicates needed here.

  // SEO landing pages
  if (LANDING_PAGE_SLUGS.length > 0) {
    lines.push('  <!-- SEO landing page URLs -->');
    for (const slug of LANDING_PAGE_SLUGS) {
      lines.push(
        renderLocalizedEntries({
          barePath: `/${slug}`,
          changefreq: 'monthly',
          priority: '0.9',
          lastmod: null,
          images: [],
        })
      );
      count++;
    }
  }

  if (categories.length > 0) {
    lines.push('  <!-- Dynamic service category URLs -->');
    for (const cat of categories) {
      const barePath = `/services/${getCategorySlug(cat.name)}`;
      const extraImages = serviceImagesByCategory.get(cat.name) || [];
      const allImages = [...cat.images, ...extraImages];
      lines.push(
        renderLocalizedEntries({
          barePath,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: null,
          images: allImages,
          videos: cat.videos,
        })
      );
      count++;
    }
  }

  if (blogRows.length > 0) {
    lines.push('  <!-- Dynamic blog post URLs -->');
    for (const row of blogRows) {
      const barePath = `/blog/${encodeURIComponent(row.slug)}`;
      const images = row.coverImage
        ? [{ url: row.coverImage, title: `${row.title} – blog Katarzyna Brui` }]
        : [];
      lines.push(
        renderLocalizedEntries({
          barePath,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: row.lastmod,
          images,
        })
      );
      count++;
    }
  }

  if (trainingRows.length > 0) {
    lines.push('  <!-- Dynamic training URLs -->');
    for (const row of trainingRows) {
      const barePath = `/training/${encodeURIComponent(row.slug)}`;
      const images = row.coverImage
        ? [{ url: row.coverImage, title: `${row.title} – szkolenia Katarzyna Brui` }]
        : [];
      lines.push(
        renderLocalizedEntries({
          barePath,
          changefreq: 'monthly',
          priority: '0.7',
          lastmod: row.lastmod,
          images,
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

  const [blogRows, trainingRows, categories, serviceImages] = await Promise.all([
    fetchSupabaseRows('blog_posts').then(dedupeBySlug),
    fetchSupabaseRows('trainings').then(dedupeBySlug),
    fetchServiceCategories(),
    fetchServiceImages(),
  ]);

  const dynamicSection = buildDynamicSection({ blogRows, trainingRows, categories, serviceImages });
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
