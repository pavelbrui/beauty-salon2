import type { Handler } from '@netlify/functions';

// --- Config ---
const BASE_URL = 'https://katarzynabrui.pl';
const LOCALES = ['pl', 'en', 'ru'] as const;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// --- Helpers ---
const xmlEscape = (value: string): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const localizedUrl = (barePath: string, locale: string): string => {
  if (locale === 'pl') return `${BASE_URL}${barePath}`;
  return `${BASE_URL}/${locale}${barePath}`;
};

const formatLastmod = (value: string | null): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

// --- Image type ---
interface SitemapImage {
  url: string;
  title?: string;
  caption?: string;
}

// --- Video type ---
interface SitemapVideo {
  contentUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
}

// --- Render helpers ---
const renderAlternateLinks = (barePath: string): string =>
  [
    ...LOCALES.map(
      (locale) =>
        `    <xhtml:link rel="alternate" hreflang="${locale}" href="${xmlEscape(localizedUrl(barePath, locale))}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(localizedUrl(barePath, 'pl'))}"/>`,
  ].join('\n');

const renderImageTags = (images: SitemapImage[]): string => {
  if (!images || images.length === 0) return '';
  return images
    .map((img) => {
      const titleTag = img.title ? `\n      <image:title>${xmlEscape(img.title)}</image:title>` : '';
      const captionTag = img.caption ? `\n      <image:caption>${xmlEscape(img.caption)}</image:caption>` : '';
      return `    <image:image>\n      <image:loc>${xmlEscape(img.url)}</image:loc>${titleTag}${captionTag}\n    </image:image>`;
    })
    .join('\n');
};

const renderVideoTags = (videos: SitemapVideo[]): string => {
  if (!videos || videos.length === 0) return '';
  return videos
    .map((v) =>
      `    <video:video>
      <video:content_loc>${xmlEscape(v.contentUrl)}</video:content_loc>
      <video:thumbnail_loc>${xmlEscape(v.thumbnailUrl)}</video:thumbnail_loc>
      <video:title>${xmlEscape(v.title)}</video:title>
      <video:description>${xmlEscape(v.description)}</video:description>
    </video:video>`)
    .join('\n');
};

interface UrlEntry {
  barePath: string;
  changefreq: string;
  priority: string;
  lastmod?: string | null;
  images?: SitemapImage[];
  videos?: SitemapVideo[];
}

const renderLocalizedEntries = ({ barePath, changefreq, priority, lastmod, images, videos }: UrlEntry): string =>
  LOCALES.map((locale) => {
    const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
    const imageTags = images?.length ? `\n${renderImageTags(images)}` : '';
    const videoTags = videos?.length ? `\n${renderVideoTags(videos)}` : '';
    return `  <url>
    <loc>${xmlEscape(localizedUrl(barePath, locale))}</loc>
${renderAlternateLinks(barePath)}${lastmodTag}${imageTags}${videoTags}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

// --- Supabase fetch helper ---
const supabaseFetch = async (path: string): Promise<unknown[] | null> => {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

// --- Fallback category images ---
const CATEGORY_FALLBACK_IMAGES: Record<string, SitemapImage> = {
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

// --- Keyword-rich video SEO data per category ---
const CATEGORY_VIDEO_SEO: Record<string, { title: string; description: string }> = {
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

// --- Data fetchers ---

interface CategoryData {
  name: string;
  images: SitemapImage[];
  videos: SitemapVideo[];
}

const fetchServiceCategories = async (): Promise<CategoryData[]> => {
  try {
    const [catRows, serviceRows] = await Promise.all([
      supabaseFetch('service_categories?select=name,image_url,video_url') as Promise<{ name: string; image_url: string | null; video_url: string | null }[] | null>,
      supabaseFetch('services?select=category') as Promise<{ category: string }[] | null>,
    ]);

    const catImageMap = new Map<string, SitemapImage>();
    const catVideoMap = new Map<string, SitemapVideo>();
    if (Array.isArray(catRows)) {
      for (const row of catRows) {
        if (row.name && row.image_url) {
          catImageMap.set(row.name, {
            url: row.image_url,
            title: `${row.name} – salon Katarzyna Brui Białystok`,
          });
        }
        if (row.name && row.video_url) {
          const seo = CATEGORY_VIDEO_SEO[row.name];
          catVideoMap.set(row.name, {
            contentUrl: row.video_url,
            thumbnailUrl: row.image_url || CATEGORY_FALLBACK_IMAGES[row.name]?.url || `${BASE_URL}/og-image.jpg`,
            title: seo?.title || `${row.name} – salon Katarzyna Brui Białystok`,
            description: seo?.description || `${row.name} – usługi kosmetyczne w salonie Katarzyna Brui, Białystok`,
          });
        }
      }
    }

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
  } catch {
    return [];
  }
};

interface ContentRow {
  slug: string;
  title: string;
  coverImage: string | null;
  lastmod: string | null;
}

const fetchContentRows = async (table: string): Promise<ContentRow[]> => {
  if (!supabaseUrl || !supabaseKey) return [];

  const hasPublishedAt = table === 'blog_posts';
  const params = new URLSearchParams({
    select: hasPublishedAt
      ? 'slug,title,cover_image_url,updated_at,published_at'
      : 'slug,title,cover_image_url,updated_at,created_at',
    is_published: 'eq.true',
    slug: 'not.is.null',
    order: hasPublishedAt ? 'published_at.desc.nullslast' : 'updated_at.desc.nullslast',
  });

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${params.toString()}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) return [];
    const rows = await response.json();
    if (!Array.isArray(rows)) return [];

    const seen = new Set<string>();
    return rows
      .filter((row: { slug?: string }) => {
        if (typeof row?.slug !== 'string' || !row.slug.trim()) return false;
        if (seen.has(row.slug)) return false;
        seen.add(row.slug);
        return true;
      })
      .map((row: { slug: string; title?: string; cover_image_url?: string; updated_at?: string; published_at?: string; created_at?: string }) => ({
        slug: row.slug.trim(),
        title: row.title || '',
        coverImage: row.cover_image_url || null,
        lastmod: formatLastmod(row.updated_at || row.published_at || row.created_at || null),
      }));
  } catch {
    return [];
  }
};

// --- Static pages (always present) ---
interface StaticPage {
  barePath: string;
  changefreq: string;
  priority: string;
  images?: SitemapImage[];
}

const STATIC_PAGES: StaticPage[] = [
  {
    barePath: '/',
    changefreq: 'weekly',
    priority: '1.0',
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        title: 'Salon kosmetyczny Katarzyna Brui Białystok',
        caption: 'Salon kosmetyczny Katarzyna Brui – makijaż permanentny, stylizacja rzęs, laminacja brwi, manicure, pedicure w Białymstoku',
      },
      {
        url: `${BASE_URL}/og-image2.jpg`,
        title: 'Makijaż permanentny brwi Białystok – Katarzyna Brui',
        caption: 'Profesjonalny makijaż permanentny brwi i ust, stylizacja rzęs, peeling węglowy – salon kosmetyczny Białystok',
      },
      {
        url: `${BASE_URL}/og-image-mobile.jpg`,
        title: 'Kosmetyczka Białystok – makijaż permanentny, manicure, stylizacja rzęs',
        caption: 'Salon kosmetyczny Katarzyna Brui Białystok – makijaż permanentny brwi, manicure hybrydowy, pedicure, laminacja brwi, peeling węglowy, usuwanie tatuażu',
      },
    ],
  },
  {
    barePath: '/services',
    changefreq: 'weekly',
    priority: '0.9',
    images: [
      {
        url: 'https://d375139ucebi94.cloudfront.net/region2/pl/162206/biz_photo/5a73327f21184b88a8b9fedfb56a61-katarzyna-brui-biz-photo-1d98bd067f1944208bd8a14a6dcbde-booksy.jpeg',
        title: 'Makijaż permanentny brwi – salon Katarzyna Brui Białystok',
        caption: 'Makijaż permanentny brwi, metoda pudrowa – efekty zabiegu, salon kosmetyczny Białystok',
      },
      {
        url: 'https://d375139ucebi94.cloudfront.net/region2/pl/162206/biz_photo/fae2fc9a84a544ceafb0a8aca24206-katarzyna-brui-biz-photo-74fdb20b9f8342fd83839bde75da44-booksy.jpeg',
        title: 'Stylizacja rzęs – salon Katarzyna Brui Białystok',
        caption: 'Przedłużanie i stylizacja rzęs – efekty zabiegu, salon kosmetyczny Białystok',
      },
    ],
  },
  { barePath: '/stylists', changefreq: 'monthly', priority: '0.7' },
  {
    barePath: '/gallery',
    changefreq: 'weekly',
    priority: '0.7',
    images: [
      {
        url: 'https://d375139ucebi94.cloudfront.net/region2/pl/162206/biz_photo/5a73327f21184b88a8b9fedfb56a61-katarzyna-brui-biz-photo-1d98bd067f1944208bd8a14a6dcbde-booksy.jpeg',
        title: 'Galeria prac – makijaż permanentny brwi Białystok',
        caption: 'Efekty makijażu permanentnego brwi – salon Katarzyna Brui Białystok',
      },
      {
        url: 'https://d375139ucebi94.cloudfront.net/region2/pl/162206/biz_photo/fae2fc9a84a544ceafb0a8aca24206-katarzyna-brui-biz-photo-74fdb20b9f8342fd83839bde75da44-booksy.jpeg',
        title: 'Galeria prac – stylizacja rzęs Białystok',
        caption: 'Efekty stylizacji rzęs – salon Katarzyna Brui Białystok',
      },
    ],
  },
  { barePath: '/training', changefreq: 'monthly', priority: '0.8' },
  { barePath: '/blog', changefreq: 'weekly', priority: '0.8' },
];

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

// --- Main handler ---
const handler: Handler = async () => {
  const [categories, blogRows, trainingRows] = await Promise.all([
    fetchServiceCategories(),
    fetchContentRows('blog_posts'),
    fetchContentRows('trainings'),
  ]);

  const entries: string[] = [];

  // Collect all category videos for homepage entry
  const homepageVideos: SitemapVideo[] = categories.flatMap((cat) => cat.videos);

  // Static pages
  for (const page of STATIC_PAGES) {
    // Attach category videos to homepage
    if (page.barePath === '/' && homepageVideos.length > 0) {
      entries.push(renderLocalizedEntries({ ...page, videos: homepageVideos }));
    } else {
      entries.push(renderLocalizedEntries(page));
    }
  }

  // SEO landing pages
  for (const slug of LANDING_PAGE_SLUGS) {
    entries.push(
      renderLocalizedEntries({
        barePath: `/${slug}`,
        changefreq: 'monthly',
        priority: '0.9',
      })
    );
  }

  // Service categories (dynamic from DB)
  for (const cat of categories) {
    entries.push(
      renderLocalizedEntries({
        barePath: `/services/${encodeURIComponent(cat.name)}`,
        changefreq: 'weekly',
        priority: '0.8',
        images: cat.images,
      })
    );
  }

  // Blog posts (dynamic from DB)
  for (const row of blogRows) {
    const images: SitemapImage[] = row.coverImage
      ? [{ url: row.coverImage, title: `${row.title} – blog Katarzyna Brui` }]
      : [];
    entries.push(
      renderLocalizedEntries({
        barePath: `/blog/${encodeURIComponent(row.slug)}`,
        changefreq: 'weekly',
        priority: '0.7',
        lastmod: row.lastmod,
        images,
      })
    );
  }

  // Trainings (dynamic from DB)
  for (const row of trainingRows) {
    const images: SitemapImage[] = row.coverImage
      ? [{ url: row.coverImage, title: `${row.title} – szkolenia Katarzyna Brui` }]
      : [];
    entries.push(
      renderLocalizedEntries({
        barePath: `/training/${encodeURIComponent(row.slug)}`,
        changefreq: 'monthly',
        priority: '0.7',
        lastmod: row.lastmod,
        images,
      })
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries.join('\n')}
</urlset>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
    body: xml,
  };
};

export { handler };
