// scripts/fetch_appointments.mjs
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function loadSession() {
  const { data, error } = await supabase
    .from('booksy_session')
    .select('access_token, api_key, fingerprint, user_agent')
    .eq('id', 'default')
    .single();
  if (error || !data) throw new Error('No valid Booksy session');
  return data;
}

function buildHeaders(s) {
  const h = {
    accept: 'application/json',
    'content-type': 'application/json',
    'x-access-token': s.access_token,
    'x-api-key': s.api_key,
    'x-app-version': '3.0',
    origin: 'https://booksy.com',
    referer: 'https://booksy.com/',
  };
  if (s.fingerprint) h['x-fingerprint'] = s.fingerprint;
  if (s.user_agent) h['user-agent'] = s.user_agent;
  return h;
}

(async () => {
  try {
    const sess = await loadSession();
    const date = '2026-06-16';
    const base = process.env.BOOKSY_API_BASE || 'https://pl.booksy.com/core/v2/business_api/me';
    const url = `${base}/appointments_by_staffer?date_from=${date}&date_till=${date}&time_span=month`;
    console.log('[FETCH] GET', url);
    const resp = await fetch(url, { headers: buildHeaders(sess) });
    if (!resp.ok) {
      console.error('Error', resp.status, await resp.text());
      return;
    }
    const json = await resp.json();
    console.log('RESULT:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('FAIL', e);
  }
})();
