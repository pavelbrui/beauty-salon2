import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// --- Config ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';

const INSTAGRAM_ACCOUNTS = [
  'katarzyna.brui_',
  'katarzyna.brui_pm',
];

const FREE_MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-120b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'qwen/qwen3-coder:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
];

// Lazy init — avoids crash when env vars are empty at module load
let _sb: ReturnType<typeof createClient> | null = null;
const getDb = () => { if (!_sb) _sb = createClient(supabaseUrl, supabaseServiceKey); return _sb; };

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

// --- Instagram HTTP Scraper (no Puppeteer) ---

const INSTAGRAM_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
};

interface IgEdgeNode {
  id?: string;
  shortcode?: string;
  display_url?: string;
  thumbnail_src?: string;
  is_video?: boolean;
  video_url?: string;
  taken_at_timestamp?: number;
  __typename?: string;
  edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> };
  edge_sidecar_to_children?: { edges?: Array<{ node?: { display_url?: string } }> };
}

interface IgProfileData {
  graphql?: {
    user?: {
      edge_owner_to_timeline_media?: {
        edges?: Array<{ node?: IgEdgeNode }>;
      };
    };
  };
  data?: {
    user?: {
      edge_owner_to_timeline_media?: {
        edges?: Array<{ node?: IgEdgeNode }>;
      };
    };
  };
}

async function scrapeInstagramProfile(username: string): Promise<ScrapedPost[]> {
  console.log(`Fetching posts for @${username} via HTTP...`);
  const posts: ScrapedPost[] = [];

  // Strategy 1: Try the web profile page and extract embedded JSON
  try {
    const profilePosts = await fetchProfileViaHtml(username);
    if (profilePosts.length > 0) {
      posts.push(...profilePosts);
      console.log(`Strategy 1 (HTML embed): got ${profilePosts.length} posts`);
      return posts;
    }
  } catch (e) {
    console.log('Strategy 1 failed:', e instanceof Error ? e.message : String(e));
  }

  // Strategy 2: Try the ?__a=1&__d=dis JSON endpoint
  try {
    const jsonPosts = await fetchProfileViaJsonEndpoint(username);
    if (jsonPosts.length > 0) {
      posts.push(...jsonPosts);
      console.log(`Strategy 2 (JSON endpoint): got ${jsonPosts.length} posts`);
      return posts;
    }
  } catch (e) {
    console.log('Strategy 2 failed:', e instanceof Error ? e.message : String(e));
  }

  // Strategy 3: Try the GraphQL endpoint
  try {
    const gqlPosts = await fetchProfileViaGraphQL(username);
    if (gqlPosts.length > 0) {
      posts.push(...gqlPosts);
      console.log(`Strategy 3 (GraphQL): got ${gqlPosts.length} posts`);
      return posts;
    }
  } catch (e) {
    console.log('Strategy 3 failed:', e instanceof Error ? e.message : String(e));
  }

  // Strategy 4: Use a public embed/oembed approach for known recent post shortcodes
  // This is a fallback that works but requires we know the shortcodes
  console.log(`All strategies failed for @${username}`);
  return posts;
}

async function fetchProfileViaHtml(username: string): Promise<ScrapedPost[]> {
  const resp = await fetch(`https://www.instagram.com/${username}/`, {
    headers: INSTAGRAM_HEADERS,
    redirect: 'follow',
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }

  const html = await resp.text();

  // Try to extract embedded JSON data from page scripts
  // Pattern 1: window._sharedData
  const sharedDataMatch = html.match(/window\._sharedData\s*=\s*(\{.+?\});\s*<\/script>/s);
  if (sharedDataMatch) {
    try {
      const data = JSON.parse(sharedDataMatch[1]) as IgProfileData;
      const edges = data?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];
      return edgesToPosts(edges, username);
    } catch { /* continue */ }
  }

  // Pattern 2: __additionalDataLoaded or require("ScheduledServerJS")
  const additionalMatch = html.match(/"edge_owner_to_timeline_media"\s*:\s*(\{[^]*?"edges"\s*:\s*\[[^]*?\]\s*\})/);
  if (additionalMatch) {
    try {
      const mediaData = JSON.parse(additionalMatch[1]) as { edges?: Array<{ node?: IgEdgeNode }> };
      return edgesToPosts(mediaData.edges || [], username);
    } catch { /* continue */ }
  }

  // Pattern 3: Extract shortcodes from <a href="/p/XXXXX/"> links
  const shortcodeMatches = html.matchAll(/href="\/p\/([A-Za-z0-9_-]+)\//g);
  const shortcodes = [...shortcodeMatches].map(m => m[1]).slice(0, 12);
  if (shortcodes.length > 0) {
    console.log(`Found ${shortcodes.length} shortcodes in HTML`);
    return shortcodes.map((code, i) => ({
      id: code,
      caption: '',
      imageUrls: [],
      permalink: `https://www.instagram.com/p/${code}/`,
      timestamp: new Date().toISOString(),
      mediaType: 'image' as const,
    }));
  }

  return [];
}

async function fetchProfileViaJsonEndpoint(username: string): Promise<ScrapedPost[]> {
  const resp = await fetch(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
    headers: {
      ...INSTAGRAM_HEADERS,
      'X-Requested-With': 'XMLHttpRequest',
    },
    redirect: 'follow',
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const data = await resp.json() as IgProfileData;
  const edges = data?.graphql?.user?.edge_owner_to_timeline_media?.edges
    || data?.data?.user?.edge_owner_to_timeline_media?.edges
    || [];

  return edgesToPosts(edges, username);
}

async function fetchProfileViaGraphQL(username: string): Promise<ScrapedPost[]> {
  // First get the user ID from the profile page
  const profileResp = await fetch(`https://www.instagram.com/${username}/`, {
    headers: INSTAGRAM_HEADERS,
  });
  if (!profileResp.ok) throw new Error(`Profile HTTP ${profileResp.status}`);

  const html = await profileResp.text();
  const userIdMatch = html.match(/"profilePage_(\d+)"/) || html.match(/"user_id":"(\d+)"/) || html.match(/"owner":\{"id":"(\d+)"/);
  if (!userIdMatch) throw new Error('Could not find user ID');

  const userId = userIdMatch[1];
  const queryHash = '69cba40317214236af40e7efa697781d'; // timeline_media query hash
  const variables = JSON.stringify({ id: userId, first: 12 });

  const resp = await fetch(
    `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(variables)}`,
    {
      headers: {
        ...INSTAGRAM_HEADERS,
        'X-Requested-With': 'XMLHttpRequest',
      },
    }
  );

  if (!resp.ok) throw new Error(`GraphQL HTTP ${resp.status}`);
  const data = await resp.json() as { data?: { user?: { edge_owner_to_timeline_media?: { edges?: Array<{ node?: IgEdgeNode }> } } } };
  const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges || [];
  return edgesToPosts(edges, username);
}

function edgesToPosts(edges: Array<{ node?: IgEdgeNode }>, username: string): ScrapedPost[] {
  return edges
    .filter(e => e?.node?.id || e?.node?.shortcode)
    .slice(0, 12)
    .map(edge => {
      const node = edge.node!;
      const imageUrls: string[] = [];

      if (node.display_url) imageUrls.push(node.display_url);
      else if (node.thumbnail_src) imageUrls.push(node.thumbnail_src);

      // Carousel children
      const sidecar = node.edge_sidecar_to_children?.edges || [];
      for (const child of sidecar) {
        const childUrl = child?.node?.display_url;
        if (childUrl && !imageUrls.includes(childUrl)) {
          imageUrls.push(childUrl);
        }
      }

      const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
      const isVideo = node.__typename === 'GraphVideo' || node.is_video === true;
      const mediaType = sidecar.length > 0 ? 'carousel' : isVideo ? 'video' : 'image';

      return {
        id: String(node.id || node.shortcode),
        caption,
        imageUrls,
        videoUrl: isVideo ? node.video_url : undefined,
        permalink: node.shortcode
          ? `https://www.instagram.com/p/${node.shortcode}/`
          : `https://www.instagram.com/${username}/`,
        timestamp: node.taken_at_timestamp
          ? new Date(node.taken_at_timestamp * 1000).toISOString()
          : new Date().toISOString(),
        mediaType,
      };
    });
}

// --- Fetch post details via oEmbed (works without auth) ---
async function fetchPostCaption(permalink: string): Promise<string> {
  try {
    const resp = await fetch(
      `https://api.instagram.com/oembed/?url=${encodeURIComponent(permalink)}&omitscript=true`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!resp.ok) return '';
    const data = await resp.json() as { title?: string };
    return data.title || '';
  } catch {
    return '';
  }
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
          max_tokens: 6000,
        }),
      });

      if (!resp.ok) {
        console.log(`Model ${model} returned ${resp.status}, trying next...`);
        continue;
      }

      const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
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

Make the content blocks array include 2 headings and 3 text paragraphs. Keep each paragraph under 150 words. Make it informative and SEO-rich.
The slug must be unique, lowercase, use hyphens, no special/polish characters.
IMPORTANT: Return ONLY the JSON object. No explanations, no markdown fences.`;

  const result = await callOpenRouter(prompt);
  if (!result) return null;

  try {
    let jsonStr = result.trim();
    // Remove markdown code fences if present
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr) as GeneratedContent;
  } catch {
    // Try to fix truncated JSON (output cut mid-generation)
    try {
      let jsonStr = result.trim();
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      const jsonMatch = jsonStr.match(/\{[\s\S]*/);
      if (jsonMatch) {
        let truncated = jsonMatch[0];
        // Remove trailing incomplete string/value
        truncated = truncated.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
        // Close open arrays and objects
        const opens = (truncated.match(/\[/g) || []).length;
        const closes = (truncated.match(/\]/g) || []).length;
        for (let i = 0; i < opens - closes; i++) truncated += ']';
        const openBraces = (truncated.match(/\{/g) || []).length;
        const closeBraces = (truncated.match(/\}/g) || []).length;
        for (let i = 0; i < openBraces - closeBraces; i++) truncated += '}';
        console.log('Attempting truncated JSON recovery...');
        return JSON.parse(truncated) as GeneratedContent;
      }
    } catch (e2) {
      console.error('Failed to parse AI response (even with recovery):', e2);
    }
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

    const { error } = await getDb().storage
      .from('service-images')
      .upload(path, Buffer.from(buffer), {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    const { data: urlData } = getDb().storage
      .from('service-images')
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (e) {
    console.error('Upload failed:', e);
    return null;
  }
}

// --- Main sync logic ---
async function syncInstagramPosts(): Promise<{ synced: number; skipped: number; errors: number }> {
  const stats = { synced: 0, skipped: 0, errors: 0 };

  for (const account of INSTAGRAM_ACCOUNTS) {
    console.log(`\n=== Fetching @${account} ===`);

    let posts: ScrapedPost[];
    try {
      posts = await scrapeInstagramProfile(account);
    } catch (err) {
      console.error(`Failed to fetch @${account}:`, err);
      stats.errors++;
      continue;
    }

    if (posts.length === 0) {
      console.log(`No posts found for @${account}`);
      continue;
    }

    // Process max 3 new posts per account per run
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

      // If we have no caption, try fetching via oEmbed
      let caption = post.caption;
      if (!caption && post.permalink.includes('/p/')) {
        caption = await fetchPostCaption(post.permalink);
      }

      // Generate blog content with AI
      const content = await generateBlogContent(
        caption,
        post.imageUrls.length,
        account
      );

      if (!content) {
        console.error(`AI generation failed for post ${post.id}`);
        await getDb().from('instagram_posts').insert({
          instagram_id: post.id,
          instagram_account: account,
          permalink: post.permalink,
          media_type: post.mediaType,
          media_url: post.imageUrls[0] || null,
          caption,
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

      for (let i = 0; i < Math.min(post.imageUrls.length, 5); i++) {
        const uploaded = await uploadMediaToStorage(
          post.imageUrls[i],
          `${post.id}_${i}_${Date.now()}`
        );
        if (uploaded) {
          uploadedUrls.push(uploaded);
          if (i === 0) coverImageUrl = uploaded;
        }
      }

      // Build content blocks with images interspersed
      const textBlocks = content.content_blocks;
      const imageBlocks: ContentBlock[] = uploadedUrls.slice(1).map((url, idx) => ({
        id: `img_${idx}`,
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
        await getDb().from('instagram_posts').insert({
          instagram_id: post.id,
          instagram_account: account,
          permalink: post.permalink,
          media_type: post.mediaType,
          media_url: post.imageUrls[0] || null,
          caption,
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
      await getDb().from('instagram_posts').insert({
        instagram_id: post.id,
        instagram_account: account,
        permalink: post.permalink,
        media_type: post.mediaType,
        media_url: post.imageUrls[0] || null,
        thumbnail_url: post.imageUrls[0] || null,
        caption,
        instagram_timestamp: post.timestamp,
        blog_post_id: blogPost?.id,
        gallery_image_id: galleryImageId,
        sync_status: 'synced',
      });

      stats.synced++;
      console.log(`Synced post ${post.id} -> blog "${slug}" + ${uploadedUrls.length} gallery images`);
    }
  }

  return stats;
}

// --- Manual import: generate blog from caption/URL ---
async function manualImport(body: {
  caption?: string;
  permalink?: string;
  account?: string;
  imageUrls?: string[];
}): Promise<{ success: boolean; blogSlug?: string; error?: string }> {
  const account = body.account || 'katarzyna.brui_';
  let caption = body.caption || '';
  const permalink = body.permalink || '';
  const imageUrls = body.imageUrls || [];

  // If only a permalink was given, try to get caption via oEmbed
  if (!caption && permalink) {
    caption = await fetchPostCaption(permalink);
  }

  if (!caption) {
    return { success: false, error: 'No caption provided and could not extract from URL' };
  }

  // Generate a unique post ID from permalink or timestamp
  const postId = permalink
    ? permalink.match(/\/p\/([A-Za-z0-9_-]+)/)?.[1] || `manual_${Date.now()}`
    : `manual_${Date.now()}`;

  // Check if already synced
  const { data: existing } = await supabase
    .from('instagram_posts')
    .select('id')
    .eq('instagram_id', postId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: `Post ${postId} already synced` };
  }

  // Generate blog content
  const content = await generateBlogContent(caption, Math.max(imageUrls.length, 1), account);
  if (!content) {
    return { success: false, error: 'AI content generation failed' };
  }

  // Upload images if provided
  let coverImageUrl: string | null = null;
  const uploadedUrls: string[] = [];

  for (let i = 0; i < Math.min(imageUrls.length, 5); i++) {
    const uploaded = await uploadMediaToStorage(imageUrls[i], `${postId}_${i}_${Date.now()}`);
    if (uploaded) {
      uploadedUrls.push(uploaded);
      if (i === 0) coverImageUrl = uploaded;
    }
  }

  // Build content blocks
  const textBlocks = content.content_blocks;
  const imageBlocks: ContentBlock[] = uploadedUrls.slice(1).map((url, idx) => ({
    id: `img_${idx}`,
    type: 'image',
    url,
    caption: content.gallery_description,
    caption_en: content.gallery_description_en,
    caption_ru: content.gallery_description_ru,
  }));

  const midpoint = Math.ceil(textBlocks.length / 2);
  const finalBlocks = [...textBlocks.slice(0, midpoint), ...imageBlocks, ...textBlocks.slice(midpoint)];

  // Ensure unique slug
  let slug = content.slug;
  const { data: slugExists } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (slugExists) slug = `${slug}-${Date.now()}`;

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
      reading_time_minutes: Math.max(3, Math.ceil((JSON.stringify(finalBlocks).length / 1000) * 2)),
    })
    .select('id')
    .single();

  if (blogError) {
    return { success: false, error: `Blog insert: ${blogError.message}` };
  }

  // Add images to gallery
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
    if (galleryData && !galleryImageId) galleryImageId = galleryData.id;
  }

  // Track the sync
  await getDb().from('instagram_posts').insert({
    instagram_id: postId,
    instagram_account: account,
    permalink: permalink || null,
    media_type: imageUrls.length > 1 ? 'carousel' : 'image',
    media_url: imageUrls[0] || null,
    caption,
    instagram_timestamp: new Date().toISOString(),
    blog_post_id: blogPost?.id,
    gallery_image_id: galleryImageId,
    sync_status: 'synced',
  });

  return { success: true, blogSlug: slug };
}

// --- Netlify Function Handler ---
// Scheduled: runs daily at 8:00 AM UTC (10:00 AM Poland time)
// Manual: POST /api/instagram-sync with JSON body
// Test: GET /api/instagram-sync?test=1
export const handler: Handler = async (event) => {
  console.log('Instagram sync started at', new Date().toISOString());

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing Supabase config' }) };
  }
  if (!openRouterApiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing OPENROUTER_API_KEY' }) };
  }

  try {
    // --- Manual import mode (POST with JSON body) ---
    if (event?.httpMethod === 'POST' && event.body) {
      const body = JSON.parse(event.body);

      // Verify admin access via auth header
      const authHeader = event.headers?.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await getDb().auth.getUser(token);
        if (!user) {
          return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }
      }

      console.log('=== MANUAL IMPORT ===');
      const result = await manualImport(body);
      return {
        statusCode: result.success ? 200 : 400,
        body: JSON.stringify(result),
      };
    }

    // --- Test mode ---
    if (event?.queryStringParameters?.test === '1') {
      console.log('=== TEST MODE ===');
      const testCaption = 'Nowy efekt makijazu permanentnego brwi! Naturalne brwi pudrowe dla naszej klientki. #makijazpermanentny #brwi #bialystok';
      const content = await generateBlogContent(testCaption, 1, 'katarzyna.brui_');

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Test completed',
          aiGenerated: !!content,
          content: content ? {
            title: content.title,
            title_en: content.title_en,
            title_ru: content.title_ru,
            slug: content.slug,
            category: content.category,
            blocksCount: content.content_blocks.length,
            keywords: content.seo_keywords,
          } : null,
          timestamp: new Date().toISOString(),
        }, null, 2),
      };
    }

    // --- Auto sync mode (scheduled or GET without params) ---
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
