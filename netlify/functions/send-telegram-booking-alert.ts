import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramBookingAlert } from './utils/telegramBookingAlerts';
import { getClientIp, isRateLimited } from './utils/rateLimit';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AlertRequestPayload {
  bookingId?: string;
  authToken?: string;
}

interface SiteBooking {
  id: string;
  user_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  start_time: string | null;
  end_time: string | null;
  services: { name: string | null } | null;
  stylists: { name: string | null } | null;
}

async function getAuthenticatedUserId(token: string | undefined): Promise<string | null> {
  if (!token || !supabaseUrl || !supabaseAnonKey) return null;

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await authClient.auth.getUser(token);
    return !error && data.user ? data.user.id : null;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const clientIp = getClientIp(event.headers);
  if (isRateLimited(clientIp, 10, 60_000)) {
    return { statusCode: 429, body: 'Too many requests' };
  }

  let payload: AlertRequestPayload;
  try {
    payload = JSON.parse(event.body || '{}') as AlertRequestPayload;
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!payload.bookingId) {
    return { statusCode: 400, body: 'Missing bookingId' };
  }

  const userId = await getAuthenticatedUserId(payload.authToken);
  if (!userId) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, user_id, contact_name, contact_phone, contact_email, start_time, end_time,
      services ( name ),
      stylists ( name )
    `)
    .eq('id', payload.bookingId)
    .eq('user_id', userId)
    .single();

  if (error || !booking) {
    console.error('Site booking not found for Telegram alert:', payload.bookingId, error);
    return { statusCode: 404, body: 'Booking not found' };
  }

  const siteBooking = booking as SiteBooking;
  await sendTelegramBookingAlert({
    source: 'site',
    bookingId: siteBooking.id,
    clientName: siteBooking.contact_name,
    clientPhone: siteBooking.contact_phone,
    clientEmail: siteBooking.contact_email,
    serviceName: siteBooking.services?.name || null,
    startTime: siteBooking.start_time,
    endTime: siteBooking.end_time,
    stylistName: siteBooking.stylists?.name || null,
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
