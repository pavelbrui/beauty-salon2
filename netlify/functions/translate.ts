import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { isRateLimited, getClientIp } from './utils/rateLimit';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const DEEPL_API_URL = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate';
const DEEPL_API_KEYS = (process.env.DEEPL_API_KEYS || '').split(',').filter(Boolean);
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

let currentKeyIndex = 0;

function getNextDeeplKey(): string | null {
  if (DEEPL_API_KEYS.length === 0) return null;
  const key = DEEPL_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % DEEPL_API_KEYS.length;
  return key;
}

const LANG_MAP: Record<string, string> = { pl: 'PL', en: 'EN', ru: 'RU' };

/** Verify user is authenticated (admin) via Supabase JWT */
async function verifyAdmin(token: string): Promise<boolean> {
  if (!token || !supabaseUrl || !supabaseAnonKey) return false;
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return false;
    // Check admin role from app_metadata
    return data.user.app_metadata?.role === 'admin';
  } catch {
    return false;
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Rate limit: 30 translations per minute per IP
  const ip = getClientIp(event.headers);
  if (isRateLimited(ip, 30, 60_000)) {
    return { statusCode: 429, body: 'Too many requests' };
  }

  let body: { text: string; from: string; to: string; authToken?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!body.text || !body.from || !body.to) {
    return { statusCode: 400, body: 'Missing text, from, or to' };
  }

  // Only authenticated admins can use translate
  if (!body.authToken || !(await verifyAdmin(body.authToken))) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // Try DeepL first
  const startIndex = currentKeyIndex;
  for (let i = 0; i < DEEPL_API_KEYS.length; i++) {
    const key = getNextDeeplKey();
    if (!key) break;

    try {
      const response = await fetch(DEEPL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          auth_key: key,
          text: body.text,
          source_lang: LANG_MAP[body.from] || body.from.toUpperCase(),
          target_lang: LANG_MAP[body.to] || body.to.toUpperCase(),
        }).toString(),
      });

      if (response.status === 456 || response.status === 429) continue;
      if (!response.ok) continue;

      const data = await response.json();
      if (data.translations?.[0]?.text) {
        return {
          statusCode: 200,
          body: JSON.stringify({ translated: data.translations[0].text }),
        };
      }
    } catch {
      continue;
    }
  }
  currentKeyIndex = startIndex;

  // Fallback to MyMemory
  try {
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(body.text)}&langpair=${body.from}|${body.to}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return {
        statusCode: 200,
        body: JSON.stringify({ translated: data.responseData.translatedText }),
      };
    }
  } catch {
    // fall through
  }

  return { statusCode: 502, body: JSON.stringify({ translated: '' }) };
};
