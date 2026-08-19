// scripts/check_booksy_reservation_poll.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const businessId = process.env.BOOKSY_BUSINESS_ID;
const booksyApiBase = `https://pl.booksy.com/core/v2/businesses/${businessId}`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getLatestBooking() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, booksy_reservation_id, start_time, end_time')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) { console.error('Error fetching booking', error); return null; }
  return data;
}

async function getSession() {
  const { data, error } = await supabase
    .from('booksy_session')
    .select('access_token, api_key, fingerprint, user_agent')
    .eq('id', 'default')
    .single();
  if (error) { console.error('Error loading Booksy session', error); return null; }
  return data;
}

async function fetchReservation(reservationId, session) {
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
  const resp = await fetch(url, { method: 'GET', headers });
  const text = await resp.text();
  console.log('Booksy GET status', resp.status);
  console.log('Response body', text);
}

(async () => {
  let booking = await getLatestBooking();
  if (!booking) return;
  console.log('Latest booking', booking);
  const maxAttempts = 12;
  for (let i = 0; i < maxAttempts; i++) {
    if (booking.booksy_reservation_id) break;
    console.log(`No reservation ID yet, waiting 5s (attempt ${i + 1}/${maxAttempts})`);
    await sleep(5000);
    booking = await getLatestBooking();
    if (!booking) return;
  }
  if (!booking.booksy_reservation_id) {
    console.log('Reservation not created after waiting');
    return;
  }
  const session = await getSession();
  if (!session) return;
  await fetchReservation(booking.booksy_reservation_id, session);
})();
