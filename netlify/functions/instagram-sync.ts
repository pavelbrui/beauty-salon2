import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// --- Config ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';

const INSTAGRAM_ACCOUNTS = [
  'katarzyna.brui_',
  'katarzyna.brui_pm',
];

const FREE_MODELS = [
  'meta-llama/llama-4-maverick:free',
  'meta-llama/llama-4-scout:free',
  'google/gemini-2.0-flash-exp:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Types ---
interface ScrapedPost {
  id: string;
  caption: string;
  imageUrls: string[];
  videoUrl?: string;
  permalink: string;
  timestamp: string;
  mediaType: 'image' | 'video' | 'carousel';
}

interface GeneratedContent {
  title: string;
  title_en: string;
  title_ru: string;
  slug: string;
  category: string;
  excerpt: string;
  excerpt_en: string;
  excerpt_ru: string;
  seo_keywords: string[];
  content_blocks: ContentBlock[];
  gallery_category: string;
  gallery_description: string;
  gallery_description_en: string;
  gallery_description_ru: string;
}

interface ContentBlock {
  id: string;
  type: string;
  text?: string;
  text_en?: string;
  text_ru?: string;
  level?: number;
  url?: string;
  caption?: string;
  caption_en?: string;
  caption_ru?: string;
  items?: string[];
  items_en?: string[];
  items_ru?: string[];
  style?: string;
}

// --- Puppeteer Instagram Scraper ---
async function scrapeInstagramProfile(username: string): Promise<ScrapedPost[]> {
  console.log(`Launching browser for @${username}...`);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const posts: ScrapedPost[] = [];

  try {
    const page = await browser.newPage();

    // Set realistic headers to avoid detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Intercept API responses that contain post data
    const apiResponses: unknown[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (
        url.includes('/api/v1/users/') ||
        url.includes('/graphql/query') ||
        url.includes('web_profile_info')
      ) {
        try {
          const json = await response.json();
          apiResponses.push(json);
        } catch {
          // Not JSON, ignore
        }
      }
    });

    console.log(`Navigating to instagram.com/${username}...`);
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for posts to render
    await page.waitForSelector('article a[href*="/p/"]', { timeout: 15000 }).catch(() => {
      console.log('No article links found, trying alternative selectors...');
    });

    // Strategy 1: Try to extract from intercepted API responses
    for (const apiResp of apiResponses) {
      const extracted = extractPostsFromApi(apiResp, username);
      if (extracted.length > 0) {
        posts.push(...extracted);
        console.log(`Extracted ${extracted.length} posts from API response`);
      }
    }

    // Strategy 2: If no API data, scrape from DOM + embedded JSON
    if (posts.length === 0) {
      console.log('Trying DOM scraping...');
      const domPosts = await scrapeFromDom(page, username);
      posts.push(...domPosts);
    }

    // Strategy 3: Try __initialData or shared data in page scripts
    if (posts.length === 0) {
      console.log('Trying embedded script data...');
      const scriptPosts = await extractFromScripts(page, username);
      posts.push(...scriptPosts);
    }

  } catch (err) {
    console.error(`Scraping error for @${username}:`, err);
  } finally {
    await browser.close();
  }

  console.log(`Scraped ${posts.length} posts from @${username}`);
  return posts;
}

/** Extract posts from Instagram's internal API JSON responses */
function extractPostsFromApi(data: unknown, username: string): ScrapedPost[] {
  const posts: ScrapedPost[] = [];
  try {
    // Navigate deeply to find edge nodes (Instagram's GraphQL structure)
    const edges = findEdges(data);
    for (const edge of edges) {
      const node = edge?.node || edge;
      if (!node?.id) continue;

      const shortcode = node.shortcode || node.code || '';
      const imageUrls: string[] = [];

      // Main image
      if (node.display_url) imageUrls.push(node.display_url);
      else if (node.image_versions2?.candidates?.[0]?.url) {
        imageUrls.push(node.image_versions2.candidates[0].url);
      }
      else if (node.thumbnail_src) imageUrls.push(node.thumbnail_src);

      // Carousel children
      const sidecar = node.edge_sidecar_to_children?.edges ||
                       node.carousel_media || [];
      for (const child of sidecar) {
        const childNode = child?.node || child;
        const childUrl = childNode?.display_url ||
                         childNode?.image_versions2?.candidates?.[0]?.url;
        if (childUrl && !imageUrls.includes(childUrl)) {
          imageUrls.push(childUrl);
        }
      }

      const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text ||
                       node.caption?.text || '';

      const isVideo = node.__typename === 'GraphVideo' ||
                      node.media_type === 2 ||
                      node.is_video === true;

      const mediaType = sidecar.length > 0 ? 'carousel' :
                        isVideo ? 'video' : 'image';

      posts.push({
        id: String(node.id),
        caption,
        imageUrls,
        videoUrl: isVideo ? (node.video_url || node.video_versions?.[0]?.url) : undefined,
        permalink: shortcode ? `https://www.instagram.com/p/${shortcode}/` : `https://www.instagram.com/${username}/`,
        timestamp: node.taken_at_timestamp
          ? new Date(node.taken_at_timestamp * 1000).toISOString()
          : node.taken_at
            ? new Date(node.taken_at * 1000).toISOString()
            : new Date().toISOString(),
        mediaType,
      });
    }
  } catch (e) {
    console.error('Error extracting from API:', e);
  }
  return posts;
}

/** Recursively find arrays of edge/node objects in Instagram's JSON */
function findEdges(obj: unknown, depth = 0): unknown[] {
  if (depth > 10 || !obj || typeof obj !== 'object') return [];

  const record = obj as Record<string, unknown>;

  // Check common Instagram data paths
  if (Array.isArray(record)) {
    // Check if this is an edges array
    if (record.length > 0 && (record[0] as Record<string, unknown>)?.node) return record;
    // Check if array of media items
    if (record.length > 0 && (record[0] as Record<string, unknown>)?.id && (record[0] as Record<string, unknown>)?.caption !== undefined) return record;
  }

  // Known keys that hold post arrays
  const knownKeys = [
    'edge_owner_to_timeline_media',
    'edge_felix_video_timeline',
    'items',
    'feed_items',
    'media',
  ];

  for (const key of knownKeys) {
    if (record[key]) {
      const val = record[key] as Record<string, unknown>;
      if (val.edges && Array.isArray(val.edges)) return val.edges as unknown[];
      if (Array.isArray(val)) return val;
    }
  }

  // Recurse into object keys
  const results: unknown[] = [];
  for (const key of Object.keys(record)) {
    const found = findEdges(record[key], depth + 1);
    if (found.length > 0) {
      results.push(...found);
      if (results.length >= 12) break;
    }
  }
  return results;
}

/** Scrape post data directly from the DOM */
async function scrapeFromDom(page: puppeteer.Page, username: string): Promise<ScrapedPost[]> {
  return page.evaluate((uname: string) => {
    const posts: ScrapedPost[] = [];
    const links = document.querySelectorAll('article a[href*="/p/"]');

    links.forEach((link, i) => {
      if (i >= 12) return;
      const href = link.getAttribute('href') || '';
      const shortcode = href.match(/\/p\/([^/]+)/)?.[1] || '';

      const img = link.querySelector('img');
      const imageUrl = img?.getAttribute('src') || '';

      posts.push({
        id: shortcode || `dom_${i}`,
        caption: img?.getAttribute('alt') || '',
        imageUrls: imageUrl ? [imageUrl] : [],
        permalink: `https://www.instagram.com${href}`,
        timestamp: new Date().toISOString(),
        mediaType: 'image',
      });
    });

    return posts;
  }, username);
}

/** Try to extract data from embedded <script> tags */
async function extractFromScripts(page: puppeteer.Page, username: string): Promise<ScrapedPost[]> {
  const scriptData = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    for (const script of scripts) {
      const text = script.textContent || '';
      // Look for various Instagram data patterns
      if (text.includes('edge_owner_to_timeline_media') || text.includes('xdt_api__v1__feed__user_timeline_graphql_connection')) {
        try {
          // Try window._sharedData pattern
          const match = text.match(/window\._sharedData\s*=\s*({.+?});/);
          if (match) return JSON.parse(match[1]);
        } catch { /* continue */ }
        try {
          // Try require("ScheduledServerJS").handle pattern
          const jsonMatch = text.match(/\{[^{}]*"edge_owner_to_timeline_media"[^]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch { /* continue */ }
      }
    }
    return null;
  });

  if (scriptData) {
    return extractPostsFromApi(scriptData, username);
  }
  return [];
}

// --- Scrape individual post for full-res images ---
async function scrapePostDetail(permalink: string): Promise<string[]> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 900 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const imageUrls: string[] = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // Capture image responses
    page.on('response', async (response) => {
      const url = response.url();
      const ct = response.headers()['content-type'] || '';
      if (ct.startsWith('image/') && url.includes('instagram') && url.includes('scontent')) {
        // Filter for full-size images (not thumbnails)
        if (url.includes('1080x1080') || url.includes('1440x') || !url.includes('150x150')) {
          if (!imageUrls.includes(url)) imageUrls.push(url);
        }
      }
    });

    await page.goto(permalink, { waitUntil: 'networkidle2', timeout: 20000 });

    // Also get images from DOM
    const domImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('article img[src*="scontent"]');
      return Array.from(imgs).map(img => img.getAttribute('src')).filter(Boolean) as string[];
    });

    for (const url of domImages) {
      if (!imageUrls.includes(url)) imageUrls.push(url);
    }
  } catch (e) {
    console.error('Post detail scraping error:', e);
  } finally {
    await browser.close();
  }

  return imageUrls;
}

// --- OpenRouter AI ---
async function callOpenRouter(prompt: string): Promise<string | null> {
  for (const model of FREE_MODELS) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://katarzynabrui.pl',
          'X-Title': 'Katarzyna Brui Beauty Salon',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!resp.ok) {
        console.log(`Model ${model} returned ${resp.status}, trying next...`);
        continue;
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log(`Used model: ${model}`);
        return content;
      }
    } catch (e) {
      console.log(`Model ${model} error:`, e);
      continue;
    }
  }
  return null;
}

async function generateBlogContent(
  caption: string,
  mediaCount: number,
  account: string
): Promise<GeneratedContent | null> {
  const isMainAccount = account === 'katarzyna.brui_';

  const prompt = `You are a content creator for "Katarzyna Brui" beauty salon in Bialystok, Poland.
The salon specializes in: permanent makeup, eyelash extensions, brow styling, manicure, carbon peeling, laser removal.

Account "${account}" posted on Instagram with this caption:
"""
${caption || '(no caption - create content based on the account specialty)'}
"""

The post has ${mediaCount} image(s).
${isMainAccount ? 'This is the main salon account - covers all services.' : 'This is the permanent makeup specialized account.'}

Generate a blog post in JSON format. The blog should be SEO-optimized, engaging, and written as if by Katarzyna herself.
Include content in 3 languages: Polish (primary), English, Russian.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "Polish title",
  "title_en": "English title",
  "title_ru": "Russian title",
  "slug": "url-friendly-slug-no-polish-chars-max-60-chars",
  "category": "one of: makijaz-permanentny, stylizacja-rzes, pielegnacja-brwi, manicure, peeling-weglowy, laserowe-usuwanie, tips, inspiration",
  "excerpt": "Polish excerpt (2-3 sentences)",
  "excerpt_en": "English excerpt",
  "excerpt_ru": "Russian excerpt",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "content_blocks": [
    {"id": "h1", "type": "heading", "level": 2, "text": "Polish heading", "text_en": "English heading", "text_ru": "Russian heading"},
    {"id": "t1", "type": "text", "text": "Polish paragraph...", "text_en": "English paragraph...", "text_ru": "Russian paragraph..."}
  ],
  "gallery_category": "one of: permanent-makeup, eyelashes, brows, manicure, other",
  "gallery_description": "Polish image description for gallery",
  "gallery_description_en": "English image description",
  "gallery_description_ru": "Russian image description"
}

Make the content blocks array include 2-3 headings and 3-5 text paragraphs. Make it informative and SEO-rich.
The slug must be unique, lowercase, use hyphens, no special/polish characters.`;

  const result = await callOpenRouter(prompt);
  if (!result) return null;

  try {
    let jsonStr = result.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    console.error('Raw:', result.substring(0, 500));
    return null;
  }
}

// --- Upload media to Supabase Storage ---
async function uploadMediaToStorage(
  mediaUrl: string,
  filename: string
): Promise<string | null> {
  try {
    const resp = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.instagram.com/',
      },
    });
    if (!resp.ok) {
      console.error(`Failed to download image: ${resp.status}`);
      return null;
    }

    const buffer = await resp.arrayBuffer();
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const path = `instagram/${filename}.${ext}`;

    const { error } = await supabase.storage
      .from('service-images')
      .upload(path, Buffer.from(buffer), {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('service-images')
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (e) {
    console.error('Upload failed:', e);
    return null;
  }
}

// --- Google Business Profile Posting ---
async function postToGoogleBusiness(
  title: string,
  excerpt: string,
  blogUrl: string,
  imageUrl: string | null,
  instagramPostId: string
): Promise<boolean> {
  // Load saved session
  const { data: session } = await supabase
    .from('google_business_sessions')
    .select('*')
    .eq('is_valid', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session?.cookies || (session.cookies as unknown[]).length === 0) {
    console.log('No valid GBP session found. Run gbp-login first.');
    await supabase.from('instagram_posts')
      .update({ gbp_post_status: 'skipped', gbp_error: 'No GBP session' })
      .eq('instagram_id', instagramPostId);
    return false;
  }

  console.log('Posting to Google Business Profile...');

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 900 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(session.user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Restore cookies
    await page.setCookie(...(session.cookies as puppeteer.CookieParam[]));

    // Navigate to GBP create post page
    await page.goto('https://business.google.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Check if still logged in
    const isLoggedIn = !page.url().includes('accounts.google.com/signin');
    if (!isLoggedIn) {
      console.error('GBP session expired');
      await supabase.from('google_business_sessions')
        .update({ is_valid: false, error_message: 'Session expired' })
        .eq('id', session.id);
      await supabase.from('instagram_posts')
        .update({ gbp_post_status: 'error', gbp_error: 'GBP session expired - re-login needed' })
        .eq('instagram_id', instagramPostId);
      return false;
    }

    // Update cookies (extend session)
    const freshCookies = await page.cookies();
    await supabase.from('google_business_sessions')
      .update({ cookies: freshCookies, last_used_at: new Date().toISOString() })
      .eq('id', session.id);

    // Click "Add update" / "Create post" button
    // GBP interface varies, try multiple selectors
    const createPostSelectors = [
      'button[aria-label*="Add update"]',
      'button[aria-label*="Create post"]',
      'button[aria-label*="Dodaj aktualizację"]', // Polish
      'button[aria-label*="Utwórz post"]', // Polish
      '[data-test-id="create-post"]',
      'a[href*="create-post"]',
      'button:has-text("Add update")',
    ];

    let clicked = false;
    for (const selector of createPostSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          clicked = true;
          await new Promise(r => setTimeout(r, 3000));
          break;
        }
      } catch { /* try next */ }
    }

    if (!clicked) {
      // Try navigating directly to posts section
      const links = await page.$$('a');
      for (const link of links) {
        const text = await link.evaluate(el => el.textContent || '');
        if (text.toLowerCase().includes('post') || text.toLowerCase().includes('aktualizac')) {
          await link.click();
          clicked = true;
          await new Promise(r => setTimeout(r, 3000));
          break;
        }
      }
    }

    if (!clicked) {
      console.log('Could not find create post button, trying direct URL...');
      // Try direct URL pattern for GBP posts
      await page.goto('https://business.google.com/posts', {
        waitUntil: 'networkidle2',
        timeout: 15000,
      }).catch(() => {});
    }

    // Write the post content
    const postText = `${title}\n\n${excerpt}\n\nCzytaj wiecej: ${blogUrl}`;

    // Find the text editor area
    const textAreaSelectors = [
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
      '.post-editor textarea',
      'div[aria-label*="post"]',
      'div[aria-label*="update"]',
    ];

    let textEntered = false;
    for (const selector of textAreaSelectors) {
      try {
        const editor = await page.$(selector);
        if (editor) {
          await editor.click();
          await editor.type(postText, { delay: 10 });
          textEntered = true;
          break;
        }
      } catch { /* try next */ }
    }

    if (!textEntered) {
      console.error('Could not find post text editor');
      await supabase.from('instagram_posts')
        .update({ gbp_post_status: 'error', gbp_error: 'Could not find GBP post editor' })
        .eq('instagram_id', instagramPostId);
      return false;
    }

    // Upload image if available
    if (imageUrl) {
      const addPhotoSelectors = [
        'button[aria-label*="Add photo"]',
        'button[aria-label*="Dodaj zdjęcie"]',
        'button:has-text("Add photo")',
        'input[type="file"]',
      ];

      for (const selector of addPhotoSelectors) {
        try {
          const fileInput = await page.$(selector);
          if (fileInput) {
            if (selector === 'input[type="file"]') {
              // Download image to temp and upload
              const imgResp = await fetch(imageUrl);
              if (imgResp.ok) {
                const imgBuffer = Buffer.from(await imgResp.arrayBuffer());
                const fs = await import('fs');
                const tmpPath = '/tmp/gbp_upload.jpg';
                fs.writeFileSync(tmpPath, imgBuffer);
                await fileInput.uploadFile(tmpPath);
                await new Promise(r => setTimeout(r, 3000));
                fs.unlinkSync(tmpPath);
              }
            } else {
              await fileInput.click();
              await new Promise(r => setTimeout(r, 2000));
            }
            break;
          }
        } catch { /* continue */ }
      }
    }

    // Click publish/post button
    await new Promise(r => setTimeout(r, 2000));
    const publishSelectors = [
      'button[aria-label*="Publish"]',
      'button[aria-label*="Post"]',
      'button[aria-label*="Opublikuj"]',
      'button:has-text("Publish")',
      'button:has-text("Post")',
    ];

    let published = false;
    for (const selector of publishSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          published = true;
          await new Promise(r => setTimeout(r, 3000));
          break;
        }
      } catch { /* try next */ }
    }

    // Also try clicking any primary/submit button
    if (!published) {
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.evaluate(el => el.textContent || '');
        const cls = await btn.evaluate(el => el.className || '');
        if (
          (text.toLowerCase().includes('publish') || text.toLowerCase().includes('opublikuj') || text.toLowerCase().includes('post')) &&
          (cls.includes('primary') || cls.includes('submit') || cls.includes('action'))
        ) {
          await btn.click();
          published = true;
          await new Promise(r => setTimeout(r, 3000));
          break;
        }
      }
    }

    // Save updated cookies
    const postCookies = await page.cookies();
    await supabase.from('google_business_sessions')
      .update({ cookies: postCookies, last_used_at: new Date().toISOString() })
      .eq('id', session.id);

    if (published) {
      console.log('Successfully posted to Google Business Profile');
      await supabase.from('instagram_posts')
        .update({ gbp_post_status: 'posted' })
        .eq('instagram_id', instagramPostId);
      return true;
    } else {
      console.log('Post text entered but publish button not found');
      await supabase.from('instagram_posts')
        .update({ gbp_post_status: 'error', gbp_error: 'Publish button not found' })
        .eq('instagram_id', instagramPostId);
      return false;
    }
  } catch (e) {
    console.error('GBP posting error:', e);
    await supabase.from('instagram_posts')
      .update({ gbp_post_status: 'error', gbp_error: String(e) })
      .eq('instagram_id', instagramPostId);
    return false;
  } finally {
    await browser.close();
  }
}

// --- Main sync logic ---
async function syncInstagramPosts(): Promise<{ synced: number; skipped: number; errors: number }> {
  const stats = { synced: 0, skipped: 0, errors: 0 };

  for (const account of INSTAGRAM_ACCOUNTS) {
    console.log(`\n=== Scraping @${account} ===`);

    let posts: ScrapedPost[];
    try {
      posts = await scrapeInstagramProfile(account);
    } catch (err) {
      console.error(`Failed to scrape @${account}:`, err);
      stats.errors++;
      continue;
    }

    if (posts.length === 0) {
      console.log(`No posts found for @${account}`);
      continue;
    }

    // Process max 3 new posts per account per run (to stay within time limits)
    let processedCount = 0;

    for (const post of posts) {
      if (processedCount >= 3) break;

      // Check if already synced
      const { data: existing } = await supabase
        .from('instagram_posts')
        .select('id')
        .eq('instagram_id', post.id)
        .maybeSingle();

      if (existing) {
        stats.skipped++;
        continue;
      }

      console.log(`\nProcessing new post ${post.id} from @${account}`);
      processedCount++;

      // If we only have thumbnail-quality images, try scraping the post detail page
      let imageUrls = post.imageUrls;
      if (imageUrls.length > 0 && imageUrls[0].includes('150x150')) {
        console.log('Thumbnail detected, scraping full-res from post page...');
        const fullRes = await scrapePostDetail(post.permalink);
        if (fullRes.length > 0) imageUrls = fullRes;
      }

      // Generate blog content with AI
      const content = await generateBlogContent(
        post.caption,
        imageUrls.length,
        account
      );

      if (!content) {
        console.error(`AI generation failed for post ${post.id}`);
        await supabase.from('instagram_posts').insert({
          instagram_id: post.id,
          instagram_account: account,
          permalink: post.permalink,
          media_type: post.mediaType,
          media_url: imageUrls[0] || null,
          caption: post.caption,
          instagram_timestamp: post.timestamp,
          sync_status: 'error',
          error_message: 'AI content generation failed',
        });
        stats.errors++;
        continue;
      }

      // Upload images to Supabase Storage
      let coverImageUrl: string | null = null;
      const uploadedUrls: string[] = [];

      for (let i = 0; i < Math.min(imageUrls.length, 5); i++) {
        const uploaded = await uploadMediaToStorage(
          imageUrls[i],
          `${post.id}_${i}_${Date.now()}`
        );
        if (uploaded) {
          uploadedUrls.push(uploaded);
          if (i === 0) coverImageUrl = uploaded;
        }
      }

      // Build content blocks with images interspersed
      const textBlocks = content.content_blocks;
      const imageBlocks: ContentBlock[] = uploadedUrls.slice(1).map((url, i) => ({
        id: `img_${i}`,
        type: 'image',
        url,
        caption: content.gallery_description,
        caption_en: content.gallery_description_en,
        caption_ru: content.gallery_description_ru,
      }));

      const midpoint = Math.ceil(textBlocks.length / 2);
      const finalBlocks = [
        ...textBlocks.slice(0, midpoint),
        ...imageBlocks,
        ...textBlocks.slice(midpoint),
      ];

      // Ensure unique slug
      let slug = content.slug;
      const { data: slugExists } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }

      // Create blog post
      const { data: blogPost, error: blogError } = await supabase
        .from('blog_posts')
        .insert({
          title: content.title,
          title_en: content.title_en,
          title_ru: content.title_ru,
          slug,
          category: content.category,
          excerpt: content.excerpt,
          excerpt_en: content.excerpt_en,
          excerpt_ru: content.excerpt_ru,
          author: 'Katarzyna Brui',
          cover_image_url: coverImageUrl,
          seo_keywords: content.seo_keywords,
          content_blocks: finalBlocks,
          is_published: true,
          published_at: new Date().toISOString(),
          reading_time_minutes: Math.max(3, Math.ceil(
            (JSON.stringify(finalBlocks).length / 1000) * 2
          )),
        })
        .select('id')
        .single();

      if (blogError) {
        console.error('Blog insert error:', blogError);
        await supabase.from('instagram_posts').insert({
          instagram_id: post.id,
          instagram_account: account,
          permalink: post.permalink,
          media_type: post.mediaType,
          media_url: imageUrls[0] || null,
          caption: post.caption,
          instagram_timestamp: post.timestamp,
          sync_status: 'error',
          error_message: `Blog insert: ${blogError.message}`,
        });
        stats.errors++;
        continue;
      }

      // Add images to gallery (service_images)
      let galleryImageId: string | null = null;
      for (const uploadedUrl of uploadedUrls) {
        const { data: galleryData } = await supabase
          .from('service_images')
          .insert({
            url: uploadedUrl,
            category: content.gallery_category,
            description: content.gallery_description,
            description_en: content.gallery_description_en,
            description_ru: content.gallery_description_ru,
          })
          .select('id')
          .single();

        if (galleryData && !galleryImageId) {
          galleryImageId = galleryData.id;
        }
      }

      // Track the sync
      await supabase.from('instagram_posts').insert({
        instagram_id: post.id,
        instagram_account: account,
        permalink: post.permalink,
        media_type: post.mediaType,
        media_url: imageUrls[0] || null,
        thumbnail_url: post.imageUrls[0] || null,
        caption: post.caption,
        instagram_timestamp: post.timestamp,
        blog_post_id: blogPost?.id,
        gallery_image_id: galleryImageId,
        sync_status: 'synced',
        gbp_post_status: 'pending',
      });

      // Post to Google Business Profile
      const blogUrl = `https://katarzynabrui.pl/blog/${slug}`;
      await postToGoogleBusiness(
        content.title,
        content.excerpt,
        blogUrl,
        coverImageUrl,
        post.id
      );

      stats.synced++;
      console.log(`Synced post ${post.id} -> blog "${slug}" + ${uploadedUrls.length} gallery images`);
    }
  }

  return stats;
}

// --- Netlify Scheduled Function ---
// Runs daily at 8:00 AM UTC (10:00 AM Poland time)
export const handler: Handler = async () => {
  console.log('Instagram sync started at', new Date().toISOString());

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase config' }) };
  }
  if (!openRouterApiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing OPENROUTER_API_KEY' }) };
  }

  try {
    const stats = await syncInstagramPosts();
    console.log('\nInstagram sync completed:', stats);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Instagram sync completed',
        ...stats,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Instagram sync failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Sync failed',
        message: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
