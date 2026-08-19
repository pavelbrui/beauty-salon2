// scripts/test_sync_local.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const businessId = process.env.BOOKSY_BUSINESS_ID || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BOOKSY_API_BASE = `https://pl.booksy.com/core/v2/business_api/me`;

// Custom error for 409 conflict
class BooksyConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BooksyConflictError';
  }
}

async function loadSession() {
  const { data, error } = await supabase
    .from('booksy_session')
    .select('access_token, api_key, fingerprint, user_agent, is_valid')
    .eq('id', 'default')
    .single();
  if (error || !data) {
    console.log('No session found in DB', error);
    return null;
  }
  if (!data.is_valid) {
    console.log('Session marked as invalid');
    return null;
  }
  return data;
}

async function getBooksynResourceId(stylistName) {
  if (!stylistName) return null;
  const { data: stylist } = await supabase
    .from('stylists')
    .select('id')
    .ilike('name', stylistName)
    .limit(1)
    .single();
  if (!stylist) return null;
  const { data: mapping } = await supabase
    .from('booksy_stylist_mapping')
    .select('booksy_resource_id')
    .eq('stylist_id', stylist.id)
    .limit(1)
    .single();
  return mapping?.booksy_resource_id || null;
}

function buildHeaders(session) {
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'pl',
    'content-type': 'application/json;charset=UTF-8',
    'x-access-token': session.access_token,
    'x-api-key': session.api_key,
    'x-app-version': '3.0',
    'origin': 'https://booksy.com',
    'referer': 'https://booksy.com/',
  };
  if (session.fingerprint) {
    headers['x-fingerprint'] = session.fingerprint;
  }
  if (session.user_agent) {
    headers['user-agent'] = session.user_agent;
  }
  headers['bksreqid'] = crypto.randomUUID();
  return headers;
}

function formatForBooksy(isoDate) {
  const d = new Date(isoDate);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type) => parts.find(p => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

async function createReservation(session, startTime, endTime, resourceId, reason = 'Rezerwacja ze strony katarzynabrui.pl') {
  const url = `${BOOKSY_API_BASE}/businesses/${businessId}/reservations/`;
  const body = {
    id: null,
    reserved_from: formatForBooksy(startTime),
    reserved_till: formatForBooksy(endTime),
    resources: [resourceId],
    overbooking: false,
    reason,
  };
  
  console.log(`[SYNC] POST ${url}`);
  console.log('[SYNC] Body:', JSON.stringify(body, null, 2));
  console.log('[SYNC] Headers:', JSON.stringify(buildHeaders(session), null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(session),
    body: JSON.stringify(body),
  });

  console.log(`[SYNC] Response Status: ${response.status}`);
  if (response.status === 409) {
    const text = await response.text();
    throw new BooksyConflictError(`Booksy API error 409: ${text}`);
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Booksy API error ${response.status}: ${text}`);
  }
  const data = await response.json();
  return data?.reservation ? { id: data.reservation.id } : null;
}

async function run() {
  const bookingId = '08f9fd27-4463-4088-8fee-199574f6aa12';
  
  // Fetch details
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('*, stylists(name)')
    .eq('id', bookingId)
    .single();
    
  if (bErr || !booking) {
    console.error('Booking not found in Supabase:', bErr);
    return;
  }
  
  console.log('Testing sync for booking:', booking);
  
  const session = await loadSession();
  if (!session) {
    console.error('No valid Booksy session loaded.');
    return;
  }
  
  const stylistName = booking.stylists?.name;
  const resourceId = await getBooksynResourceId(stylistName);
  console.log(`Stylist: ${stylistName}, Booksy Resource ID: ${resourceId}`);
  
  if (!resourceId) {
    console.error(`Booksy Resource ID not found for stylist: ${stylistName}`);
    return;
  }
  
  try {
    console.log('Attempting to create reservation on Booksy...');
    const result = await createReservation(session, booking.start_time, booking.end_time, resourceId);
    console.log('Reservation created successfully! Result:', result);
  } catch (err) {
    console.error('Reservation creation failed:', err);
  }
}

run().catch(console.error);
