// scripts/check_specific_booksy_reservation.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const businessId = process.env.BOOKSY_BUSINESS_ID;
const reservationId = 631182723;

async function main() {
  const { data: session, error: sessErr } = await supabase
    .from('booksy_session')
    .select('access_token, api_key, fingerprint, user_agent')
    .eq('id', 'default')
    .single();
  if (sessErr || !session) {
    console.error('Failed to load Booksy session', sessErr);
    return;
  }

  const headers = {
    accept: 'application/json',
    'x-access-token': session.access_token,
    'x-api-key': session.api_key,
    origin: 'https://booksy.com',
    referer: 'https://booksy.com/',
  };
  if (session.fingerprint) headers['x-fingerprint'] = session.fingerprint;
  if (session.user_agent) headers['user-agent'] = session.user_agent;

  const url = `https://pl.booksy.com/core/v2/businesses/${businessId}/reservations/${reservationId}/`;
  console.log('Querying Booksy API for reservation ID', reservationId, 'at url', url);
  const res = await fetch(url, { method: 'GET', headers });
  console.log('Booksy GET status', res.status);
  const data = await res.json();
  console.log('Booksy reservation data:', JSON.stringify(data, null, 2));
}

main().catch(e => console.error(e));
