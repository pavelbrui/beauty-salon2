import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

// --- Config ---
const WEBHOOK_TOKEN = 'aseo_wh_ab859c43052d493114b179e72a35871e';
const SITE_URL = 'https://katarzynabrui.pl';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Helpers ---

function timingSafeCompare(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let result = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}

function verifyHmacSignature(rawBody: string, signature: string): boolean {
  const expected = createHmac('sha256', WEBHOOK_TOKEN)
    .update(rawBody)
    .digest('hex');
  return timingSafeCompare(expected, signature);
}

/** Map AutoSEO language code to our i18n field suffix */
function langSuffix(languageCode: string): '' | '_en' | '_ru' {
  if (languageCode === 'en') return '_en';
  if (languageCode === 'ru') return '_ru';
  return ''; // Polish default, or any other lang goes to main fields
}

/** Estimate reading time from HTML content */
function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Convert HTML string into content_blocks array compatible with our CMS */
function htmlToContentBlocks(
  html: string,
  suffix: '' | '_en' | '_ru',
  heroImageUrl?: string | null,
  heroImageAlt?: string | null,
  infographicUrl?: string | null
): any[] {
  const blocks: any[] = [];
  let blockId = 1;

  // Add hero image block if present
  if (heroImageUrl) {
    const block: any = {
      id: String(blockId++),
      type: 'image',
      url: heroImageUrl,
    };
    if (heroImageAlt) {
      const captionKey = suffix ? `caption${suffix}` : 'caption';
      block[captionKey] = heroImageAlt;
      if (!suffix) block.caption = heroImageAlt;
    }
    blocks.push(block);
  }

  // Parse HTML into blocks
  // Split on headings and paragraphs
  const parts = html.split(/(<h[2-6][^>]*>.*?<\/h[2-6]>|<p[^>]*>.*?<\/p>|<ul[^>]*>.*?<\/ul>|<ol[^>]*>.*?<\/ol>|<blockquote[^>]*>.*?<\/blockquote>|<img[^>]*\/?>)/gis);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Heading
    const headingMatch = trimmed.match(/<h([2-6])[^>]*>(.*?)<\/h[2-6]>/is);
    if (headingMatch) {
      const level = Math.min(parseInt(headingMatch[1]), 3) as 2 | 3;
      const text = headingMatch[2].replace(/<[^>]*>/g, '').trim();
      if (!text) continue;
      const block: any = {
        id: String(blockId++),
        type: 'heading',
        level,
      };
      const textKey = suffix ? `text${suffix}` : 'text';
      block[textKey] = text;
      if (!suffix) block.text = text;
      blocks.push(block);
      continue;
    }

    // List (ul or ol)
    const listMatch = trimmed.match(/<(ul|ol)[^>]*>(.*?)<\/(?:ul|ol)>/is);
    if (listMatch) {
      const style = listMatch[1] === 'ol' ? 'ordered' : 'bullet';
      const items = [...listMatch[2].matchAll(/<li[^>]*>(.*?)<\/li>/gis)]
        .map(m => m[1].replace(/<[^>]*>/g, '').trim())
        .filter(Boolean);
      if (items.length === 0) continue;
      const block: any = {
        id: String(blockId++),
        type: 'list',
        style,
      };
      const itemsKey = suffix ? `items${suffix}` : 'items';
      block[itemsKey] = items;
      if (!suffix) block.items = items;
      blocks.push(block);
      continue;
    }

    // Blockquote
    const quoteMatch = trimmed.match(/<blockquote[^>]*>(.*?)<\/blockquote>/is);
    if (quoteMatch) {
      const text = quoteMatch[1].replace(/<[^>]*>/g, '').trim();
      if (!text) continue;
      const block: any = {
        id: String(blockId++),
        type: 'quote',
      };
      const textKey = suffix ? `text${suffix}` : 'text';
      block[textKey] = text;
      if (!suffix) block.text = text;
      blocks.push(block);
      continue;
    }

    // Inline image
    const imgMatch = trimmed.match(/<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*\/?>/is);
    if (imgMatch) {
      const block: any = {
        id: String(blockId++),
        type: 'image',
        url: imgMatch[1],
      };
      if (imgMatch[2]) {
        const captionKey = suffix ? `caption${suffix}` : 'caption';
        block[captionKey] = imgMatch[2];
        if (!suffix) block.caption = imgMatch[2];
      }
      blocks.push(block);
      continue;
    }

    // Paragraph / text
    const pMatch = trimmed.match(/<p[^>]*>(.*?)<\/p>/is);
    const text = pMatch
      ? pMatch[1].replace(/<[^>]*>/g, '').trim()
      : trimmed.replace(/<[^>]*>/g, '').trim();
    if (!text) continue;
    const block: any = {
      id: String(blockId++),
      type: 'text',
    };
    const textKey = suffix ? `text${suffix}` : 'text';
    block[textKey] = text;
    if (!suffix) block.text = text;
    blocks.push(block);
  }

  // Add infographic image at the end if present
  if (infographicUrl) {
    const block: any = {
      id: String(blockId++),
      type: 'image',
      url: infographicUrl,
    };
    const captionKey = suffix ? `caption${suffix}` : 'caption';
    block[captionKey] = 'Infographic';
    if (!suffix) block.caption = 'Infographic';
    blocks.push(block);
  }

  return blocks;
}

/** Download an image from URL and upload to Supabase Storage. Returns public URL. */
async function downloadAndStoreImage(
  imageUrl: string,
  slug: string,
  suffix: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download image ${imageUrl}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png'
      : contentType.includes('webp') ? 'webp'
      : contentType.includes('gif') ? 'gif'
      : 'jpg';

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = `blog/${slug}/${suffix}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('service-images')
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`Failed to upload image to storage: ${uploadError.message}`);
      return null;
    }

    const { data } = supabase.storage
      .from('service-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error(`Error processing image ${imageUrl}:`, err);
    return null;
  }
}

// --- Main handler ---
const handler: Handler = async (event: HandlerEvent) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Verify Bearer token
  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token || !timingSafeCompare(token, WEBHOOK_TOKEN)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  // Optionally verify HMAC signature
  const signature = event.headers['x-autoseo-signature'] || '';
  if (signature && event.body) {
    if (!verifyHmacSignature(event.body, signature)) {
      console.warn('HMAC signature verification failed');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    // Handle test event
    if (payload.event === 'test') {
      return {
        statusCode: 200,
        body: JSON.stringify({ url: `${SITE_URL}/test` }),
      };
    }

    // Validate required fields
    if (!payload.title || !payload.slug || !payload.content_html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: title, slug, content_html' }),
      };
    }

    const suffix = langSuffix(payload.languageCode || 'pl');

    // Download and store images
    let storedHeroUrl: string | null = null;
    let storedInfographicUrl: string | null = null;

    if (payload.heroImageUrl) {
      storedHeroUrl = await downloadAndStoreImage(
        payload.heroImageUrl,
        payload.slug,
        'hero'
      );
    }

    if (payload.infographicImageUrl) {
      storedInfographicUrl = await downloadAndStoreImage(
        payload.infographicImageUrl,
        payload.slug,
        'infographic'
      );
    }

    // Build content blocks from HTML
    const contentBlocks = htmlToContentBlocks(
      payload.content_html,
      suffix,
      storedHeroUrl || payload.heroImageUrl,
      payload.heroImageAlt,
      storedInfographicUrl || payload.infographicImageUrl
    );

    // Build the row data — language-aware field mapping
    const titleKey = suffix ? `title${suffix}` : 'title';
    const excerptKey = suffix ? `excerpt${suffix}` : 'excerpt';

    const rowData: Record<string, any> = {
      slug: payload.slug,
      [titleKey]: payload.title,
      [excerptKey]: payload.metaDescription || '',
      cover_image_url: storedHeroUrl || payload.heroImageUrl || null,
      seo_keywords: payload.keywords || [],
      content_blocks: contentBlocks,
      is_published: true,
      published_at: payload.publishedAt || new Date().toISOString(),
      reading_time_minutes: estimateReadingTime(payload.content_html),
      autoseo_id: payload.id,
      updated_at: new Date().toISOString(),
    };

    // For the primary language (Polish), also set the main title
    if (!suffix) {
      rowData.title = payload.title;
      rowData.category = 'blog';
      rowData.author = 'Katarzyna Brui';
    }

    // Check if post already exists (by autoseo_id for dedup)
    let existingPost = null;
    if (payload.id) {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, content_blocks')
        .eq('autoseo_id', payload.id)
        .maybeSingle();
      existingPost = data;
    }

    // Also check by slug if no autoseo_id match
    if (!existingPost) {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, content_blocks')
        .eq('slug', payload.slug)
        .maybeSingle();
      existingPost = data;
    }

    if (existingPost) {
      // Update existing post — merge content blocks for non-default languages
      if (suffix) {
        // For EN/RU, merge new blocks into existing content_blocks
        // Keep existing blocks, add language-specific text to matching block ids
        const existingBlocks = existingPost.content_blocks || [];
        if (existingBlocks.length > 0) {
          // Replace content_blocks with existing ones updated with new language data
          rowData.content_blocks = existingBlocks;
          // Update language fields in existing blocks from new blocks
          for (let i = 0; i < Math.min(existingBlocks.length, contentBlocks.length); i++) {
            const newBlock = contentBlocks[i];
            for (const key of Object.keys(newBlock)) {
              if (key.endsWith(suffix)) {
                existingBlocks[i][key] = newBlock[key];
              }
            }
          }
        }
      }

      const { error } = await supabase
        .from('blog_posts')
        .update(rowData)
        .eq('id', existingPost.id);

      if (error) {
        console.error('Failed to update blog post:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to update blog post' }),
        };
      }

      const postSlug = existingPost.slug;
      const langPrefix = suffix === '_en' ? '/en' : suffix === '_ru' ? '/ru' : '';
      return {
        statusCode: 200,
        body: JSON.stringify({ url: `${SITE_URL}${langPrefix}/blog/${postSlug}` }),
      };
    }

    // Create new post — ensure title is set for non-default languages too
    if (suffix) {
      rowData.title = payload.title; // Need a title in the main field for the row
      rowData.category = 'blog';
      rowData.author = 'Katarzyna Brui';
    }

    const { data: newPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert(rowData)
      .select('slug')
      .single();

    if (insertError) {
      console.error('Failed to create blog post:', insertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create blog post' }),
      };
    }

    const langPrefix = suffix === '_en' ? '/en' : suffix === '_ru' ? '/ru' : '';
    return {
      statusCode: 200,
      body: JSON.stringify({ url: `${SITE_URL}${langPrefix}/blog/${newPost.slug}` }),
    };
  } catch (err: any) {
    console.error('AutoSEO webhook error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};

export { handler };
