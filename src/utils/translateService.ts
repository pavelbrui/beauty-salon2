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

    if (!response.ok) return '';

    const data = await response.json();
    return data.translated || '';
  } catch {
    return '';
  }
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
