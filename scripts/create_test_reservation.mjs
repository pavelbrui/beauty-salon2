// scripts/create_test_reservation.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // booking times (June 16 2026 10:00-11:00 Europe/Warsaw)
  const startTime = new Date('2026-06-16T10:00:00+02:00').toISOString();
  const endTime = new Date('2026-06-16T11:00:00+02:00').toISOString();
  const stylistName = 'Agnessa';

  // find stylist id
  const { data: stylist, error: stylistErr } = await supabase
    .from('stylists')
    .select('id')
    .order('id')
    .limit(1)
    .single();
  if (stylistErr || !stylist) {
    console.error('Stylist not found', stylistErr);
    return;
  }

  // create booking record
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .insert({
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      stylist_id: stylist.id,
      contact_name: 'Test Client',
      contact_email: 'test@example.com',
      contact_phone: '+48123456789',
    })
    .select('id')
    .single();
  if (bookingErr || !booking) {
    console.error('Failed to create booking', bookingErr);
    return;
  }

  console.log('Created booking ID', booking.id);

  // trigger Booksy sync
  const syncUrl = `${process.env.URL || 'https://katarzynabrui.pl'}/.netlify/functions/booksy-sync-background`;
  const payload = {
    action: 'create_block',
    bookingId: booking.id.toString(),
    startTime,
    endTime,
    stylistName,
    secret: process.env.BOOKSY_SYNC_SECRET || '',
  };
  const res = await fetch(syncUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log('Sync response status', res.status, 'body', text);
}

main().catch((e) => console.error('Error:', e));
