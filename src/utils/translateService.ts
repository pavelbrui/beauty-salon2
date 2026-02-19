const DEEPL_API_URL = import.meta.env.VITE_DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate';
const DEEPL_API_KEYS = (import.meta.env.VITE_DEEPL_API_KEYS || '').split(',').filter(Boolean);
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

let currentKeyIndex = 0;

function getNextDeeplKey(): string | null {
  if (DEEPL_API_KEYS.length === 0) return null;
  const key = DEEPL_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % DEEPL_API_KEYS.length;
  return key;
}

const LANG_MAP_DEEPL: Record<string, string> = {
  pl: 'PL',
  en: 'EN',
  ru: 'RU',
};

async function translateWithDeepl(
  text: string,
  from: string,
  to: string
): Promise<string> {
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
          text,
          source_lang: LANG_MAP_DEEPL[from] || from.toUpperCase(),
          target_lang: LANG_MAP_DEEPL[to] || to.toUpperCase(),
        }),
      });

      if (response.status === 456 || response.status === 429) {
        // Quota exceeded or rate limited — try next key
        continue;
      }

      if (!response.ok) continue;

      const data = await response.json();
      if (data.translations?.[0]?.text) {
        return data.translations[0].text;
      }
    } catch {
      continue;
    }
  }

  // Reset to where we started if all keys failed
  currentKeyIndex = startIndex;
  return '';
}

async function translateWithMyMemory(
  text: string,
  from: string,
  to: string
): Promise<string> {
  try {
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return '';
  } catch {
    return '';
  }
}

export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (!text.trim()) return '';

  // Try DeepL first, then MyMemory as fallback
  const deeplResult = await translateWithDeepl(text, from, to);
  if (deeplResult) return deeplResult;

  console.warn(`DeepL failed for "${text}" (${from}->${to}), falling back to MyMemory`);
  return translateWithMyMemory(text, from, to);
}

export async function translateFromPolish(
  text: string
): Promise<{ en: string; ru: string }> {
  const [en, ru] = await Promise.all([
    translateText(text, 'pl', 'en'),
    translateText(text, 'pl', 'ru'),
  ]);
  return { en, ru };
}
