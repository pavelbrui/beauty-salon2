import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// --- Supabase client with service_role (bypasses RLS) ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const syncSecret = process.env.BOOKSY_SYNC_SECRET || '';
const businessId = process.env.BOOKSY_BUSINESS_ID || '';
const resendApiKey = process.env.RESEND_API_KEY || '';

const DEVELOPER_EMAIL = 'bpl_as@mail.ru';
const ADMIN_EMAIL = 'brui.katarzyna@gmail.com';
const FROM_EMAIL = 'Katarzyna Brui <studio@katarzynabrui.pl>';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BOOKSY_API_BASE = `https://pl.booksy.com/core/v2/business_api/me`;

// --- Types ---
interface SyncPayload {
  action: 'create_block' | 'update_block' | 'remove_block';
  bookingId: string;
  startTime: string;
  endTime: string;
  stylistName?: string;
  oldStartTime?: string;
  oldEndTime?: string;
  secret?: string;
  authToken?: string;
}

interface BooksySessionData {
  access_token: string;
  api_key: string;
  fingerprint?: string;
  user_agent?: string;
}

// --- Custom error for 409 conflict ---
class BooksyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BooksyConflictError';
  }
}

/** Constant-time string comparison to prevent timing attacks */
function timingSafeCompare(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let result = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}

/** Verify user is authenticated via Supabase JWT */
async function verifyAuthToken(token: string): Promise<boolean> {
  if (!token || !supabaseUrl || !supabaseAnonKey) return false;
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.auth.getUser(token);
    return !error && !!data.user;
  } catch {
    return false;
  }
}

// --- Email alert helper (via Resend) ---
async function sendAlertEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    console.error('[SYNC] RESEND_API_KEY not configured — cannot send alert email');
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error(`[SYNC] Resend error for ${to}:`, await res.text());
    } else {
      console.log(`[SYNC] Alert email sent to ${to}: ${subject}`);
    }
  } catch (err) {
    console.error(`[SYNC] Failed to send alert email to ${to}:`, err);
  }
}

// --- Confirmation email trigger (calls send-booking-email Netlify function) ---
async function triggerConfirmationEmail(bookingId: string) {
  const siteUrl = process.env.URL || 'https://katarzynabrui.pl';
  const notificationSecret = process.env.NOTIFICATION_SECRET || '';
  try {
    const url = `${siteUrl}/.netlify/functions/send-booking-email`;
    console.log(`[SYNC] Triggering confirmation email for ${bookingId} at ${url}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        type: 'confirmation',
        secret: notificationSecret,
      }),
    });
    if (!res.ok) {
      console.error(`[SYNC] Failed to trigger confirmation email: status ${res.status}`, await res.text());
    } else {
      console.log(`[SYNC] Confirmation email triggered successfully for ${bookingId}`);
    }
  } catch (err) {
    console.error(`[SYNC] Error triggering confirmation email for ${bookingId}:`, err);
  }
}

// --- Helpers ---
async function updateSyncLog(
  bookingId: string,
  status: 'pending' | 'processing' | 'success' | 'failed',
  extra?: { errorMessage?: string; booksyReservationId?: number }
) {
  const update: Record<string, unknown> = { status };
  if (status === 'processing') {
    update.attempts = 1;
  }
  if (status === 'success' || status === 'failed') {
    update.processed_at = new Date().toISOString();
  }
  if (extra?.errorMessage) {
    update.error_message = extra.errorMessage;
  }
  if (extra?.booksyReservationId) {
    update.booksy_reservation_id = extra.booksyReservationId;
  }
  const { error } = await supabase
    .from('booksy_sync_log')
    .update(update)
    .eq('booking_id', bookingId)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) {
    console.error('Error updating sync log:', error);
  }
}

async function loadSession(): Promise<BooksySessionData | null> {
  const { data, error } = await supabase
    .from('booksy_session')
    .select('access_token, api_key, fingerprint, user_agent, is_valid')
    .eq('id', 'default')
    .single();
  if (error || !data) {
    console.log('No session found in DB');
    return null;
  }
  if (!data.is_valid) {
    console.log('Session marked as invalid');
    return null;
  }
  if (!data.access_token) {
    console.log('No access_token in session');
    return null;
  }
  return {
    access_token: data.access_token,
    api_key: data.api_key || process.env.BOOKSY_API_KEY || '',
    fingerprint: data.fingerprint || undefined,
    user_agent: data.user_agent || undefined,
  };
}

async function markSessionInvalid() {
  const { error } = await supabase
    .from('booksy_session')
    .update({ is_valid: false })
    .eq('id', 'default');
  if (error) {
    console.error('Error marking session invalid:', error);
  }
}

async function touchSession() {
  await supabase
    .from('booksy_session')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', 'default');
}

async function getBooksynResourceId(stylistName?: string): Promise<number | null> {
  if (!stylistName) return null;
  
  // 1. Try to find stylist by name
  const { data: stylist } = await supabase
    .from('stylists')
    .select('id')
    .ilike('name', stylistName)
    .limit(1)
    .single();
    
  if (!stylist) return null;

  // 2. Look up mapping
  const { data: mapping } = await supabase
    .from('booksy_stylist_mapping')
    .select('booksy_resource_id')
    .eq('stylist_id', stylist.id)
    .limit(1)
    .single();

  return mapping?.booksy_resource_id || null;
}

function buildHeaders(session: BooksySessionData): Record<string, string> {
  const headers: Record<string, string> = {
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
  // Unique request ID
  headers['bksreqid'] = crypto.randomUUID();
  return headers;
}

// Format datetime for Booksy API: "2026-02-24T10:15"
function formatForBooksy(isoDate: string): string {
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
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

// --- Booksy API calls ---

async function createReservation(
  session: BooksySessionData,
  startTime: string,
  endTime: string,
  resourceId: number,
  reason: string = 'Rezerwacja ze strony katarzynabrui.pl'
): Promise<{ id: number } | null> {
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
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(session),
    body: JSON.stringify(body),
  });

  if (response.status === 401 || response.status === 403) {
    await markSessionInvalid();
    throw new Error(`Sesja Booksy wygasła (${response.status}). Zaktualizuj token w panelu admina.`);
  }
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

async function deleteReservation(
  session: BooksySessionData,
  reservationId: number
): Promise<void> {
  const url = `${BOOKSY_API_BASE}/reservations/${reservationId}/`;
  console.log(`[SYNC] DELETE ${url}`);
  const response = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(session),
  });
  if (response.status === 401 || response.status === 403) {
    await markSessionInvalid();
    throw new Error(`Sesja Booksy wygasła (${response.status}). Zaktualizuj token w panelu admina.`);
  }
}

// --- Sync logic ---

async function performSync(payload: SyncPayload): Promise<void> {
  const { action, bookingId, startTime, endTime, stylistName } = payload;
  await updateSyncLog(bookingId, 'processing');

  const session = await loadSession();
  if (!session) {
    await updateSyncLog(bookingId, 'failed', {
      errorMessage: 'Brak aktywnej sesji Booksy. Wklej access token w panelu admina.',
    });
    return;
  }

  const resourceId = await getBooksynResourceId(stylistName);
  if (!resourceId) {
    await updateSyncLog(bookingId, 'failed', {
      errorMessage: `Brak mapowania Booksy resource ID dla stylistki "${stylistName || 'N/A'}". Ustaw ID w panelu admina.`,
    });
    return;
  }

  try {
    if (action === 'create_block') {
      const result = await createReservation(session, startTime, endTime, resourceId);
      if (result) {
        await supabase
          .from('bookings')
          .update({ booksy_reservation_id: result.id, status: 'confirmed' })
          .eq('id', bookingId);
        await updateSyncLog(bookingId, 'success', { booksyReservationId: result.id });
        await triggerConfirmationEmail(bookingId);
      } else {
        await updateSyncLog(bookingId, 'failed', { errorMessage: 'Brak ID rezerwacji z Booksy.' });
      }
    } else if (action === 'remove_block') {
      const { data: booking } = await supabase
        .from('bookings')
        .select('booksy_reservation_id')
        .eq('id', bookingId)
        .single();
      if (booking?.booksy_reservation_id) {
        await deleteReservation(session, booking.booksy_reservation_id);
      }
      await updateSyncLog(bookingId, 'success');
    } else if (action === 'update_block') {
      const { data: booking } = await supabase
        .from('bookings')
        .select('booksy_reservation_id')
        .eq('id', bookingId)
        .single();
      if (booking?.booksy_reservation_id) {
        await deleteReservation(session, booking.booksy_reservation_id);
      }
      const result = await createReservation(session, startTime, endTime, resourceId);
      if (result) {
        await supabase
          .from('bookings')
          .update({ booksy_reservation_id: result.id, status: 'confirmed' })
          .eq('id', bookingId);
        await updateSyncLog(bookingId, 'success', { booksyReservationId: result.id });
      }
    }
    await touchSession();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SYNC] Error:`, errorMsg);
    await updateSyncLog(bookingId, 'failed', { errorMessage: errorMsg });
    
    // Load booking for alert emails
    const { data: bk } = await supabase
      .from('bookings')
      .select('contact_name, contact_phone, contact_email, start_time, services(name), stylists(name)')
      .eq('id', bookingId)
      .single();

    const clientName = bk?.contact_name || '—';
    const dateStr = startTime ? new Date(startTime).toLocaleString('pl-PL') : '—';
    const alertHtml = `<div style="font-family:sans-serif;">
      <h2 style="color:#dc2626;">Błąd synchronizacji Booksy</h2>
      <p>Rezerwacja: <b>${bk?.services?.name}</b></p>
      <p>Klient: <b>${clientName}</b> (${bk?.contact_phone})</p>
      <p>Termin: <b>${dateStr}</b></p>
      <p>Błąd: <span style="color:#dc2626;">${errorMsg}</span></p>
    </div>`;

    await sendAlertEmail(ADMIN_EMAIL, `Błąd Booksy: ${clientName}, ${dateStr}`, alertHtml);
    await sendAlertEmail(DEVELOPER_EMAIL, `Błąd Booksy: ${clientName}, ${dateStr}`, alertHtml);
  }
}

// --- Handler ---
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let payload: SyncPayload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Auth: accept either a valid Supabase JWT or the server-side secret
  let isAuthorized = false;
  if (payload.authToken) {
    isAuthorized = await verifyAuthToken(payload.authToken);
  }
  if (!isAuthorized && payload.secret && syncSecret) {
    isAuthorized = timingSafeCompare(payload.secret, syncSecret);
  }
  
  // Also check Authorization header for admin retry path compatibility
  const authHeader = event.headers['authorization'] || '';
  if (!isAuthorized && authHeader.includes(syncSecret) && syncSecret) {
    isAuthorized = true;
  }

  if (!isAuthorized) return { statusCode: 401, body: 'Unauthorized' };
  if (!payload.action || !payload.bookingId || !payload.startTime || !payload.endTime) {
    return { statusCode: 400, body: 'Missing fields' };
  }

  // Fire sync in background (up to 15 mins)
  performSync(payload).catch(console.error);

  return { statusCode: 202, body: JSON.stringify({ status: 'queued' }) };
};
