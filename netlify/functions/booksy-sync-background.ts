import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// --- Supabase client with service_role (bypasses RLS) ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const syncSecret = process.env.BOOKSY_SYNC_SECRET || '';
const businessId = process.env.BOOKSY_BUSINESS_ID || '162206';

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
  secret: string;
}

interface BooksySessionData {
  access_token: string;
  api_key: string;
  fingerprint?: string;
  user_agent?: string;
}

// --- Helpers ---

async function updateSyncLog(
  bookingId: string,
  status: 'processing' | 'success' | 'failed',
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
function formatForBooksy(isoDate: string): string {
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// --- Booksy API calls ---

async function createReservation(
  session: BooksySessionData,
  startTime: string,
  endTime: string,
  resourceId: number,
  reason: string = 'Rezerwacja ze strony'
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
        // Save the Booksy reservation ID on the booking for future delete/update
        await supabase
          .from('bookings')
          .update({ booksy_reservation_id: result.id })
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
          .update({ booksy_reservation_id: result.id })
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
    await updateSyncLog(bookingId, 'failed', { errorMessage: errorMsg });
  }
}

// --- Handler ---
const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload: SyncPayload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!syncSecret || payload.secret !== syncSecret) {
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
