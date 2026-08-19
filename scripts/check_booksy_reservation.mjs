// scripts/check_booksy_reservation.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const businessId = process.env.BOOKSY_BUSINESS_ID;
const booksyApiBase = `https://pl.booksy.com/core/v2/businesses/${businessId}`;

async function main() {
  // Get latest booking
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (bErr || !booking) {
    console.error('Failed to fetch latest booking', bErr);
    return;
  }

  // Get latest sync log for that booking
  const { data: syncLog, error: sErr } = await supabase
    .from('booksy_sync_log')
    .select('booksy_reservation_id, status')
    .eq('booking_id', booking.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (sErr || !syncLog) {
    console.error('Failed to fetch sync log', sErr);
    return;
  }

  const reservationId = syncLog.booksy_reservation_id;
  if (!reservationId) {
    console.log('No Booksy reservation ID yet, status:', syncLog.status);
    return;
  }

  // Load Booksy session
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

  const url = `${booksyApiBase}/reservations/${reservationId}/`;
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  console.log('Booksy GET status', res.status);
  console.log('Response body', text);
}

main().catch(e => console.error('Unexpected error', e));
