/**
 * Test the Instagram sync function components.
 * Run: npx tsx scripts/test-instagram-sync.ts
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = dirname(__filename2);

// Load .env manually (no dotenv dependency)
try {
  const envPath = resolve(__dirname2, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) { console.log('Failed to load .env:', e); }

const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';

const FREE_MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-120b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'qwen/qwen3-coder:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
];

// --- Test 1: Check env vars ---
console.log('\n=== TEST 1: Environment Variables ===');
console.log(`  OPENROUTER_API_KEY: ${openRouterApiKey ? `set (${openRouterApiKey.length} chars)` : 'MISSING'}`);
console.log(`  SUPABASE_URL: ${supabaseUrl ? 'set' : 'MISSING'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING'}`);

if (!openRouterApiKey) {
  console.error('\n  OPENROUTER_API_KEY is required. Get one at https://openrouter.ai/keys');
  process.exit(1);
}

// --- Test 2: OpenRouter API connectivity ---
async function testOpenRouter(): Promise<boolean> {
  console.log('\n=== TEST 2: OpenRouter API Connectivity ===');

  for (const model of FREE_MODELS) {
    try {
      console.log(`  Trying model: ${model}...`);
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
          messages: [{ role: 'user', content: 'Reply with just "OK" and nothing else.' }],
          temperature: 0,
          max_tokens: 10,
        }),
      });

      if (!resp.ok) {
        const body = await resp.text();
        console.log(`  ${model}: HTTP ${resp.status} - ${body.substring(0, 200)}`);
        continue;
      }

      const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      console.log(`  ${model}: OK -> "${content}"`);
      return true;
    } catch (e) {
      console.log(`  ${model}: Error - ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log('  ALL models failed!');
  return false;
}

// --- Test 3: Blog generation with AI ---
async function testBlogGeneration(): Promise<boolean> {
  console.log('\n=== TEST 3: Blog Content Generation ===');

  const testCaption = 'Efekt makijazu permanentnego brwi pudrowych! Naturalne i delikatne brwi dla naszej klientki. Zapisz sie na konsultacje! #makijazpermanentny #brwi #bialystok #beauty';

  const prompt = `You are a content creator for "Katarzyna Brui" beauty salon in Bialystok, Poland.
The salon specializes in: permanent makeup, eyelash extensions, brow styling, manicure, carbon peeling, laser removal.

Account "katarzyna.brui_" posted on Instagram with this caption:
"""
${testCaption}
"""

The post has 1 image(s).
This is the main salon account - covers all services.

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

  for (const model of FREE_MODELS) {
    try {
      console.log(`  Trying ${model}...`);
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
        console.log(`  ${model}: HTTP ${resp.status}`);
        continue;
      }

      const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) {
        console.log(`  ${model}: empty response`);
        continue;
      }

      // Try to parse JSON
      let jsonStr = rawContent.trim();
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log(`  ${model}: no JSON found in response`);
        console.log(`  Raw (first 300 chars): ${rawContent.substring(0, 300)}`);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const required = ['title', 'title_en', 'title_ru', 'slug', 'category', 'excerpt', 'content_blocks'];
      const missing = required.filter(k => !parsed[k]);
      if (missing.length > 0) {
        console.log(`  ${model}: missing fields: ${missing.join(', ')}`);
        continue;
      }

      console.log(`\n  SUCCESS with model: ${model}`);
      console.log(`  Title (PL): ${parsed.title}`);
      console.log(`  Title (EN): ${parsed.title_en}`);
      console.log(`  Title (RU): ${parsed.title_ru}`);
      console.log(`  Slug: ${parsed.slug}`);
      console.log(`  Category: ${parsed.category}`);
      console.log(`  Keywords: ${JSON.stringify(parsed.seo_keywords)}`);
      console.log(`  Content blocks: ${parsed.content_blocks?.length}`);
      console.log(`  Gallery category: ${parsed.gallery_category}`);

      // Validate content blocks
      const blocks = parsed.content_blocks || [];
      const headings = blocks.filter((b: { type: string }) => b.type === 'heading');
      const texts = blocks.filter((b: { type: string }) => b.type === 'text');
      console.log(`  -> ${headings.length} headings, ${texts.length} text blocks`);

      // Check multilingual
      const allHaveEn = blocks.every((b: { text_en?: string }) => b.text_en);
      const allHaveRu = blocks.every((b: { text_ru?: string }) => b.text_ru);
      console.log(`  -> All blocks have EN: ${allHaveEn}, RU: ${allHaveRu}`);

      return true;
    } catch (e) {
      console.log(`  ${model}: parse error - ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log('  ALL models failed for blog generation!');
  return false;
}

// --- Test 4: Instagram oEmbed API ---
async function testOEmbed(): Promise<boolean> {
  console.log('\n=== TEST 4: Instagram oEmbed API ===');
  const testUrl = 'https://www.instagram.com/katarzyna.brui_/';
  try {
    const resp = await fetch(
      `https://api.instagram.com/oembed/?url=${encodeURIComponent(testUrl)}&omitscript=true`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    console.log(`  oEmbed status: ${resp.status}`);
    if (resp.ok) {
      const data = await resp.json() as Record<string, unknown>;
      console.log(`  oEmbed response keys: ${Object.keys(data).join(', ')}`);
      console.log(`  Author: ${data.author_name}`);
      return true;
    }
    return false;
  } catch (e) {
    console.log(`  oEmbed error: ${e instanceof Error ? e.message : String(e)}`);
    return false;
  }
}

// --- Test 5: Instagram profile fetch (HTTP, no Puppeteer) ---
async function testInstagramFetch(): Promise<boolean> {
  console.log('\n=== TEST 5: Instagram Profile Fetch (HTTP) ===');
  const username = 'katarzyna.brui_';

  const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pl-PL,pl;q=0.9',
  };

  // Try HTML fetch
  try {
    console.log(`  Fetching https://www.instagram.com/${username}/...`);
    const resp = await fetch(`https://www.instagram.com/${username}/`, {
      headers,
      redirect: 'follow',
    });
    console.log(`  Status: ${resp.status}`);
    console.log(`  Redirected: ${resp.redirected}, URL: ${resp.url}`);

    if (resp.ok) {
      const html = await resp.text();
      console.log(`  HTML length: ${html.length}`);

      const hasLogin = html.includes('loginForm') || html.includes('/accounts/login');
      console.log(`  Requires login: ${hasLogin}`);

      const sharedData = html.includes('_sharedData');
      console.log(`  Has _sharedData: ${sharedData}`);

      const shortcodes = [...html.matchAll(/href="\/p\/([A-Za-z0-9_-]+)\//g)].map(m => m[1]);
      console.log(`  Shortcodes found: ${shortcodes.length}`);
      if (shortcodes.length > 0) {
        console.log(`  First 3: ${shortcodes.slice(0, 3).join(', ')}`);
      }

      const hasEdgeMedia = html.includes('edge_owner_to_timeline_media');
      console.log(`  Has edge_owner_to_timeline_media: ${hasEdgeMedia}`);

      return shortcodes.length > 0 || hasEdgeMedia || sharedData;
    }
  } catch (e) {
    console.log(`  Fetch error: ${e instanceof Error ? e.message : String(e)}`);
  }

  return false;
}

// --- Run all tests ---
async function main() {
  console.log('==============================');
  console.log('  Instagram Sync Test Suite');
  console.log('==============================');

  const results: Record<string, boolean> = {};

  results['OpenRouter API'] = await testOpenRouter();
  results['Blog Generation'] = await testBlogGeneration();
  results['Instagram oEmbed'] = await testOEmbed();
  results['Instagram HTTP Fetch'] = await testInstagramFetch();

  console.log('\n==============================');
  console.log('  RESULTS');
  console.log('==============================');
  for (const [name, passed] of Object.entries(results)) {
    console.log(`  ${passed ? 'PASS' : 'FAIL'}: ${name}`);
  }

  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n  Overall: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);

  if (!results['Instagram HTTP Fetch']) {
    console.log('\n  NOTE: Instagram HTTP scraping failed (common - Instagram blocks bots).');
    console.log('  The function will still work if Instagram serves the data on Netlify\'s IPs.');
    console.log('  Alternative: Use Instagram Graph API with a Facebook App for reliable access.');
  }
}

main().catch(console.error);
