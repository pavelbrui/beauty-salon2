import { supabase } from '../lib/supabase';

/**
 * Translate text via server-side Netlify Function proxy.
 * API keys are kept on the server — never exposed to the browser.
 */
export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (!text.trim()) return '';

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || '';

    const response = await fetch('/.netlify/functions/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from, to, authToken }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error('Zbyt wiele prób tłumaczenia (limit 30/min). Spróbuj za chwilę.');
      if (response.status === 401) throw new Error('Brak uprawnień do tłumaczenia.');
      throw new Error(`Błąd serwera tłumaczeń (${response.status})`);
    }

    const data = await response.json();
    return data.translated || '';
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Nieznany błąd podczas tłumaczenia');
  }
}

export async function translateFromPolish(
  text: string,
  targetLangs: string[] = ['en', 'ru']
): Promise<Record<string, string>> {
  if (!text.trim() || targetLangs.length === 0) return {};

  const results = await Promise.all(
    targetLangs.map((lang) => translateText(text, 'pl', lang))
  );

  const out: Record<string, string> = {};
  targetLangs.forEach((lang, index) => {
    out[lang] = results[index];
  });
  return out;
}

/**
 * Helper to translate comma-separated lists individually (to prevent formatting loss)
 */
export async function translateArrayFromPolish(
  items: string[],
  targetLangs: string[] = ['en', 'ru']
): Promise<Record<string, string[]>> {
  const cleanItems = items.map(i => i.trim()).filter(Boolean);
  if (cleanItems.length === 0 || targetLangs.length === 0) return {};

  const out: Record<string, string[]> = {};
  for (const lang of targetLangs) {
    out[lang] = [];
  }

  // Translate each item individually for each language
  // Doing it sequentially per item, or parallel?
  // Parallel might hit rate limits faster if the list is long, but let's try Promise.all
  for (const lang of targetLangs) {
    const translations = await Promise.all(
      cleanItems.map(item => translateText(item, 'pl', lang))
    );
    out[lang] = translations;
  }

  return out;
}
