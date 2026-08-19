// scripts/get_latest_reservation.mjs
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
    // Get the most recent booking with a Booksy reservation ID
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, booksy_reservation_id, start_time')
      .neq('booksy_reservation_id', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();
    if (bErr) throw bErr;
    console.log('Latest booking:', booking);

    const session = await loadSession();
    const base = process.env.BOOKSY_API_BASE || 'https://pl.booksy.com/core/v2/business_api/me';
    const url = `${base}/reservations/${booking.booksy_reservation_id}/`;
    console.log('Fetching reservation info from Booksy API:', url);
    const resp = await fetch(url, { method: 'GET', headers: buildHeaders(session) });
    if (!resp.ok) {
      console.error('Error fetching reservation:', resp.status, await resp.text());
      return;
    }
    const json = await resp.json();
    console.log('Reservation data:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('FAIL', e);
  }
})();
