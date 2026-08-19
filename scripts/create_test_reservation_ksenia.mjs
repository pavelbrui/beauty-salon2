// scripts/create_test_reservation_ksenia.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Find stylist Achnessa (case‑insensitive)
  const { data: stylist, error: stylistErr } = await supabase
    .from('stylists')
    .select('id, name')
    .ilike('name', `%Achnessa%`)
    .single();

  if (stylistErr || !stylist) {
    console.error('❌ Stylist Ksenia not found', stylistErr);
    return;
  }

  // Find a service called Manicure (or contains "paznokci")
  const { data: service, error: serviceErr } = await supabase
    .from('services')
    .select('id, name')
    .ilike('name', '%Manicure%')
    .limit(1)
    .single();

  if (serviceErr || !service) {
    console.error('❌ Service Manicure (or paznokci) not found', serviceErr);
    return;
  }

  // Booking times – 10:00‑11:00 on 16 June 2026 (Europe/Warsaw)
  const startTime = new Date('2026-06-16T10:00:00+02:00').toISOString();
  const endTime = new Date('2026-06-16T11:00:00+02:00').toISOString();

  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .insert({
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      stylist_id: stylist.id,
      service_id: service.id,
      contact_name: 'Test Client',
      contact_email: 'test@example.com',
      contact_phone: '+48123456789',
    })
    .select('id')
    .single();

  if (bookingErr || !booking) {
    console.error('❌ Failed to create booking', bookingErr);
    return;
  }

  console.log('✅ Created booking ID', booking.id);

  // Trigger Booksy sync (same as original script)
  const syncUrl = `${process.env.URL || 'https://katarzynabrui.pl'}/.netlify/functions/booksy-sync-background`;
  const payload = {
    action: 'create_block',
    bookingId: booking.id.toString(),
    startTime,
    endTime,
    stylistName: stylist.name,
    serviceName: service.name,
    secret: process.env.BOOKSY_SYNC_SECRET || '',
  };

  const res = await fetch(syncUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('📡 Sync response', res.status, 'body', text);
}

main().catch((e) => console.error('❌ Unexpected error', e));
