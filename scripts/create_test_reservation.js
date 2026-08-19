// scripts/create_test_reservation.js
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // Define booking details
  const startTime = new Date('2026-06-16T10:00:00+02:00').toISOString();
  const endTime = new Date('2026-06-16T11:00:00+02:00').toISOString();
  const stylistName = 'Manikiur'; // adjust exact name as in DB

  // Find stylist ID
  const { data: stylist, error: stylistErr } = await supabase
    .from('stylists')
    .select('id')
    .ilike('name', `%${stylistName}%`)
    .single();
  if (stylistErr || !stylist) {
    console.error('Stylist not found', stylistErr);
    return;
  }

  // Insert booking
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

  const bookingId = booking.id;
  console.log('Created booking', bookingId);

  // Trigger sync
  const syncUrl = `${process.env.URL || 'https://katarzynabrui.pl'}/.netlify/functions/booksy-sync-background`;
  const payload = {
    action: 'create_block',
    bookingId: bookingId.toString(),
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
  console.log('Sync response', await res.text());
}

main().catch(console.error);
