import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { isRateLimited, getClientIp } from './utils/rateLimit';

// --- Supabase client with service_role (bypasses RLS) ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const syncSecret = process.env.BOOKSY_SYNC_SECRET || '';
const businessId = process.env.BOOKSY_BUSINESS_ID || '';
const resendApiKey = process.env.RESEND_API_KEY || '';

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

const DEVELOPER_EMAIL = 'bpl_as@mail.ru';
const ADMIN_EMAIL = 'brui.katya@icloud.com';
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
    api_key: data.api_key || 'frontdesk-76661e2b-25f0-49b4-b33a-9d78957a58e3',
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

  // Find stylist by name
  const { data: stylist } = await supabase
    .from('stylists')
    .select('id')
    .ilike('name', `%${stylistName}%`)
    .limit(1)
    .single();

  if (!stylist) return null;

  // Find booksy resource ID from mapping
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
// IMPORTANT: Booksy expects Warsaw local time, but Netlify runs in UTC.
// We must explicitly convert to Europe/Warsaw timezone.
function formatForBooksy(isoDate: string): string {
  const d = new Date(isoDate);

  // Format in Warsaw timezone using Intl API (available in Node 18+)
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
  reason: string = 'Rezerwacja dla stylistki z roznych powodow'
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
  console.log(`[SYNC] Body:`, JSON.stringify(body));

  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(session),
    body: JSON.stringify(body),
  });

  if (response.status === 401 || response.status === 403) {
    console.log(`[SYNC] Auth failed (${response.status}) — marking session invalid`);
    await markSessionInvalid();
    throw new Error(`Sesja Booksy wygasła (${response.status}). Zaktualizuj token w panelu admina.`);
  }

  if (response.status === 409) {
    const text = await response.text();
    console.log(`[SYNC] Conflict (409) — time slot unavailable on Booksy`);
    throw new BooksyConflictError(`Booksy API error 409: ${text}`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Booksy API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  console.log(`[SYNC] Created reservation:`, JSON.stringify(data));

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
    console.log(`[SYNC] Auth failed (${response.status}) — marking session invalid`);
    await markSessionInvalid();
    throw new Error(`Sesja Booksy wygasła (${response.status}). Zaktualizuj token w panelu admina.`);
  }

  if (response.status === 404) {
    console.log(`[SYNC] Reservation ${reservationId} not found — already deleted?`);
    return;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Booksy API error ${response.status}: ${text}`);
  }

  console.log(`[SYNC] Deleted reservation ${reservationId}`);
}

// --- Main sync logic ---
async function performSync(payload: SyncPayload): Promise<void> {
  const { action, bookingId, startTime, endTime, stylistName } = payload;

  console.log(`[SYNC] Starting ${action} for booking ${bookingId}`);
  console.log(`[SYNC] Time: ${startTime} - ${endTime}, Stylist: ${stylistName || 'N/A'}`);

  await updateSyncLog(bookingId, 'processing');

  // Load session
  const session = await loadSession();
  if (!session) {
    await updateSyncLog(bookingId, 'failed', {
      errorMessage: 'Brak aktywnej sesji Booksy. Wklej access token w panelu admina.',
    });
    return;
  }

  // Look up Booksy resource ID for the stylist
  const resourceId = await getBooksynResourceId(stylistName);
  if (!resourceId) {
    await updateSyncLog(bookingId, 'failed', {
      errorMessage: `Brak mapowania Booksy resource ID dla stylistki "${stylistName || 'N/A'}". Ustaw ID w panelu admina → Booksy → Mapowanie.`,
    });
    return;
  }

  console.log(`[SYNC] Booksy resource ID: ${resourceId}`);

  try {
    if (action === 'create_block') {
      const result = await createReservation(session, startTime, endTime, resourceId);
      if (result) {
        // Save the Booksy reservation ID on the booking + set status confirmed
        await supabase
          .from('bookings')
          .update({ booksy_reservation_id: result.id, status: 'confirmed' })
          .eq('id', bookingId);

        await updateSyncLog(bookingId, 'success', { booksyReservationId: result.id });
      } else {
        await updateSyncLog(bookingId, 'failed', {
          errorMessage: 'Booksy API nie zwróciło ID rezerwacji.',
        });
      }
    } else if (action === 'remove_block') {
      // Get the stored Booksy reservation ID from the booking
      const { data: booking } = await supabase
        .from('bookings')
        .select('booksy_reservation_id')
        .eq('id', bookingId)
        .single();

      if (!booking?.booksy_reservation_id) {
        console.log('[SYNC] No booksy_reservation_id found — nothing to delete');
        await updateSyncLog(bookingId, 'success');
        return;
      }

      await deleteReservation(session, booking.booksy_reservation_id);

      // Clear the reservation ID
      await supabase
        .from('bookings')
        .update({ booksy_reservation_id: null })
        .eq('id', bookingId);

      await updateSyncLog(bookingId, 'success');
    } else if (action === 'update_block') {
      // Delete old reservation + create new one
      const { data: booking } = await supabase
        .from('bookings')
        .select('booksy_reservation_id')
        .eq('id', bookingId)
        .single();

      // Delete old if exists
      if (booking?.booksy_reservation_id) {
        await deleteReservation(session, booking.booksy_reservation_id);
      }

      // Create new
      const result = await createReservation(session, startTime, endTime, resourceId);
      if (result) {
        await supabase
          .from('bookings')
          .update({ booksy_reservation_id: result.id, status: 'confirmed' })
          .eq('id', bookingId);

        await updateSyncLog(bookingId, 'success', { booksyReservationId: result.id });
      } else {
        await updateSyncLog(bookingId, 'failed', {
          errorMessage: 'Booksy API nie zwróciło ID rezerwacji przy update.',
        });
      }
    }

    // Touch session last_used_at
    await touchSession();

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SYNC] Error during ${action}:`, errorMsg);

    if (err instanceof BooksyConflictError) {
      // 409 conflict — time slot taken on Booksy. CRITICAL: keep booking pending, notify admin
      console.log(`[SYNC] 409 Conflict — resetting booking ${bookingId} to pending, notifying admin`);

      await supabase
        .from('bookings')
        .update({ status: 'pending' })
        .eq('id', bookingId);

      await updateSyncLog(bookingId, 'pending', { errorMessage: errorMsg });

      // Load booking details for the alert email
      const { data: bk } = await supabase
        .from('bookings')
        .select('contact_name, contact_phone, start_time, end_time, notes, stylists ( name ), services ( name )')
        .eq('id', bookingId)
        .single();

      const clientName = (bk as any)?.contact_name || '—';
      const clientPhone = (bk as any)?.contact_phone || '—';
      const serviceName = (bk as any)?.services?.name || '—';
      const stylistNameDisplay = (bk as any)?.stylists?.name || stylistName || '—';
      const dateStr = startTime ? new Date(startTime).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' }) : '—';

      const alertHtml = `
<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:16px;">
  <h2 style="color:#dc2626;">KRYTYCZNE: Konflikt terminu w Booksy (409)</h2>
  <p style="color:#374151;">Rezerwacja ze strony <strong>NIE została dodana</strong> do kalendarza Booksy, bo ten termin jest już zajęty.</p>
  <p style="color:#dc2626;font-weight:600;">Rezerwacja została ustawiona na status PENDING — wymaga ręcznej interwencji!</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:6px 0;color:#666;width:110px;">Klient:</td><td>${clientName}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Telefon:</td><td>${clientPhone}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Usługa:</td><td>${serviceName}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Termin:</td><td>${dateStr}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Stylistka:</td><td>${stylistNameDisplay}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Booking ID:</td><td style="font-family:monospace;font-size:12px;">${bookingId}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Błąd:</td><td style="color:#dc2626;">${errorMsg}</td></tr>
  </table>
  <p><a href="https://katarzynabrui.pl/admin" style="color:#f59e0b;font-weight:600;">Otwórz panel admina</a></p>
</div>`;

      await sendAlertEmail(
        ADMIN_EMAIL,
        `KRYTYCZNE: Konflikt Booksy — ${clientName}, ${dateStr}`,
        alertHtml,
      );

    } else {
      // Any other error (not 409) — notify developer
      await updateSyncLog(bookingId, 'failed', { errorMessage: errorMsg });

      const devHtml = `
<div style="font-family:monospace;max-width:600px;margin:0 auto;padding:16px;">
  <h2 style="color:#dc2626;">Booksy Sync Error</h2>
  <p><strong>Action:</strong> ${action}</p>
  <p><strong>Booking ID:</strong> ${bookingId}</p>
  <p><strong>Time:</strong> ${startTime} — ${endTime}</p>
  <p><strong>Stylist:</strong> ${stylistName || 'N/A'}</p>
  <p><strong>Error:</strong></p>
  <pre style="background:#f3f4f6;padding:12px;border-radius:6px;overflow-x:auto;">${errorMsg}</pre>
  <p><a href="https://katarzynabrui.pl/admin" style="color:#f59e0b;">Admin panel</a></p>
</div>`;

      await sendAlertEmail(
        DEVELOPER_EMAIL,
        `Booksy Sync Error: ${action} — booking ${bookingId.substring(0, 8)}`,
        devHtml,
      );
    }
  }
}

// --- Handler ---
const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Rate limit: 10 sync calls per minute per IP
  const ip = getClientIp(event.headers);
  if (isRateLimited(ip, 10, 60_000)) {
    return { statusCode: 429, body: 'Too many requests' };
  }

  let payload: SyncPayload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Authenticate: accept either a valid Supabase JWT or the server-side secret
  let isAuthorized = false;
  if (payload.authToken) {
    isAuthorized = await verifyAuthToken(payload.authToken);
  }
  if (!isAuthorized && payload.secret && syncSecret) {
    isAuthorized = timingSafeCompare(payload.secret, syncSecret);
  }
  if (!isAuthorized) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  if (!payload.action || !payload.bookingId || !payload.startTime || !payload.endTime) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  console.log(`[SYNC] Received ${payload.action} for booking ${payload.bookingId}`);

  try {
    await performSync(payload);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SYNC] Unhandled error:`, errorMsg);
    await updateSyncLog(payload.bookingId, 'failed', { errorMessage: `Unhandled: ${errorMsg}` });
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

export { handler };
