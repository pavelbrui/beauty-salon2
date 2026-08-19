// scripts/check_booksy_real.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Get latest booking
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id,start_time,end_time,stylist_name,status,booksy_reservation_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (bErr || !booking) {
    console.error('Failed to fetch latest booking', bErr);
    return;
  }
  console.log('Latest booking', booking);

  // Trigger sync if not yet confirmed
  if (!booking.booksy_reservation_id) {
    const payload = {
      action: 'create_block',
      bookingId: booking.id,
      startTime: booking.start_time,
      endTime: booking.end_time,
      stylistName: booking.stylist_name,
      secret: process.env.BOOKSY_SYNC_SECRET,
    };
    const syncUrl = `${process.env.URL || 'https://katarzynabrui.pl'}/.netlify/functions/booksy-sync-background`;
    console.log('Calling sync function', syncUrl);
    const res = await fetch(syncUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('Sync response', res.status, await res.text());
  }

  // Wait a few seconds for async processing
  await new Promise(r => setTimeout(r, 8000));

  // Refresh booking
  const { data: updatedBooking, error: ubErr } = await supabase
    .from('bookings')
    .select('id,status,booksy_reservation_id')
    .eq('id', booking.id)
    .single();
  if (ubErr) {
    console.error('Error re-fetching booking', ubErr);
    return;
  }
  console.log('Updated booking', updatedBooking);

  if (!updatedBooking.booksy_reservation_id) {
    console.log('Booksy reservation ID still missing. Sync may have failed.');
    return;
  }

  // Load Booksy session
  const { data: session, error: sErr } = await supabase
    .from('booksy_session')
    .select('access_token,api_key,fingerprint,user_agent')
    .eq('id', 'default')
    .single();
  if (sErr || !session) {
    console.error('Failed to load Booksy session', sErr);
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

  const reservationUrl = `https://pl.booksy.com/core/v2/businesses/${process.env.BOOKSY_BUSINESS_ID}/reservations/${updatedBooking.booksy_reservation_id}/`;
  const res = await fetch(reservationUrl, { method: 'GET', headers });
  const body = await res.text();
  console.log('Booksy reservation GET status', res.status);
  console.log('Booksy reservation body', body);
}

main().catch(e => console.error('Unexpected error', e));
