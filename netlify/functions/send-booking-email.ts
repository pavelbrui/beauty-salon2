import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// --- Config ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY || '';
const notificationSecret = process.env.NOTIFICATION_SECRET || '';

const ADMIN_EMAIL = 'brui.katya@icloud.com';
const FROM_EMAIL = 'Katarzyna Brui <studio@katarzynabrui.pl>';
const SALON_PHONE = '+48 733 407 981';
const SALON_ADDRESS = 'ul. Młynowa 46, local U11, Białystok';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Types ---
type NotificationType = 'confirmation' | 'cancellation' | 'reschedule' | 'deleted';

interface NotificationPayload {
  bookingId: string;
  type: NotificationType;
  secret: string;
  extraMessage?: string;
}

interface BookingData {
  id: string;
  status: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  services: { name: string; price: number; duration: number } | null;
  stylists: { name: string } | null;
}

// --- Polish date formatting ---
function formatPolishDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const months = [
      'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
      'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
    ];
    const days = [
      'niedziela', 'poniedziałek', 'wtorek', 'środa',
      'czwartek', 'piątek', 'sobota',
    ];

    const opts: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Warsaw',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
    };
    const parts = new Intl.DateTimeFormat('pl-PL', opts).formatToParts(d);
    const p: Record<string, string> = {};
    for (const part of parts) p[part.type] = part.value;

    return `${p.weekday}, ${p.day} ${months[d.getMonth()]} ${p.year}, ${p.hour}:${p.minute}`;
  } catch {
    return isoString;
  }
}

// --- Email templates ---
function clientConfirmationHtml(b: BookingData): string {
  const dateStr = b.start_time ? formatPolishDateTime(b.start_time) : '—';
  const serviceName = b.services?.name || 'Usługa';
  const stylistName = b.stylists?.name || '—';
  const price = b.services?.price ? `${(b.services.price / 100).toFixed(0)} PLN` : '—';
  const duration = b.services?.duration ? `${b.services.duration} min` : '—';

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:22px;">Katarzyna Brui Studio</h1>
    <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:14px;">Potwierdzenie rezerwacji</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
    <p style="font-size:16px;color:#374151;">Cześć, <strong>${b.contact_name || 'Klientko'}</strong>!</p>
    <p style="color:#6b7280;">Twoja rezerwacja została potwierdzona:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 0;color:#9ca3af;width:120px;">Usługa:</td><td style="padding:8px 0;font-weight:600;color:#111827;">${serviceName}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;">Data:</td><td style="padding:8px 0;color:#111827;">${dateStr}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;">Stylistka:</td><td style="padding:8px 0;color:#111827;">${stylistName}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;">Cena:</td><td style="padding:8px 0;color:#111827;">${price}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;">Czas trwania:</td><td style="padding:8px 0;color:#111827;">${duration}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
    <p style="color:#6b7280;font-size:14px;">Adres: ${SALON_ADDRESS}</p>
    <p style="color:#6b7280;font-size:14px;">W razie pytań: ${SALON_PHONE}</p>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
      Aby anulować lub zmienić termin, wejdź na
      <a href="https://katarzynabrui.pl/profile" style="color:#f59e0b;">katarzynabrui.pl</a>
    </p>
  </div>
</div>`;
}

function adminNotificationHtml(
  b: BookingData,
  actionTitle: string,
  extraMessage?: string,
): string {
  const dateStr = b.start_time ? formatPolishDateTime(b.start_time) : '—';
  const serviceName = b.services?.name || '—';
  const stylistName = b.stylists?.name || '—';
  const price = b.services?.price ? `${(b.services.price / 100).toFixed(0)} PLN` : '—';

  const notesRow = b.notes
    ? `<tr><td style="padding:6px 0;color:#666;width:110px;">Uwagi:</td><td>${b.notes}</td></tr>`
    : '';
  const extraRow = extraMessage
    ? `<tr><td style="padding:6px 0;color:#666;width:110px;">Info:</td><td style="font-weight:600;">${extraMessage}</td></tr>`
    : '';

  return `
<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:16px;">
  <h2 style="color:#d97706;margin-bottom:12px;">${actionTitle}</h2>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:6px 0;color:#666;width:110px;">Klient:</td><td>${b.contact_name || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Telefon:</td><td>${b.contact_phone || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Email:</td><td>${b.contact_email || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Usługa:</td><td>${serviceName}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Termin:</td><td>${dateStr}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Stylistka:</td><td>${stylistName}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Cena:</td><td>${price}</td></tr>
    ${notesRow}
    ${extraRow}
  </table>
  <p style="margin-top:16px;"><a href="https://katarzynabrui.pl/admin" style="color:#f59e0b;">Otwórz panel admina</a></p>
</div>`;
}

// --- Build emails based on notification type ---
function buildEmails(
  booking: BookingData,
  type: NotificationType,
  extraMessage?: string,
): Array<{ to: string; subject: string; html: string }> {
  const emails: Array<{ to: string; subject: string; html: string }> = [];
  const serviceName = booking.services?.name || 'Usługa';
  const clientName = booking.contact_name || 'Klient';

  switch (type) {
    case 'confirmation':
      // Email to client
      if (booking.contact_email) {
        emails.push({
          to: booking.contact_email,
          subject: `Potwierdzenie rezerwacji — ${serviceName}`,
          html: clientConfirmationHtml(booking),
        });
      }
      // Email to admin
      emails.push({
        to: ADMIN_EMAIL,
        subject: `Nowa rezerwacja: ${clientName} — ${serviceName}`,
        html: adminNotificationHtml(booking, 'Nowa rezerwacja'),
      });
      break;

    case 'cancellation':
      emails.push({
        to: ADMIN_EMAIL,
        subject: `Anulowana rezerwacja: ${clientName} — ${serviceName}`,
        html: adminNotificationHtml(booking, 'Anulowana rezerwacja'),
      });
      break;

    case 'reschedule':
      emails.push({
        to: ADMIN_EMAIL,
        subject: `Zmiana terminu: ${clientName} — ${serviceName}`,
        html: adminNotificationHtml(booking, 'Zmiana terminu rezerwacji', extraMessage),
      });
      break;

    case 'deleted':
      emails.push({
        to: ADMIN_EMAIL,
        subject: `Usunięta rezerwacja: ${clientName} — ${serviceName}`,
        html: adminNotificationHtml(booking, 'Usunięta rezerwacja'),
      });
      break;
  }

  return emails;
}

// --- Handler ---
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Parse payload
  let payload: NotificationPayload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Validate secret
  if (!notificationSecret || payload.secret !== notificationSecret) {
    console.error('Invalid or missing notification secret');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // Validate required fields
  if (!payload.bookingId || !payload.type) {
    return { statusCode: 400, body: 'Missing bookingId or type' };
  }

  // Check Resend key
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return { statusCode: 500, body: 'Email service not configured' };
  }

  // Fetch booking with service and stylist
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, status, contact_name, contact_phone, contact_email,
      start_time, end_time, notes,
      services ( name, price, duration ),
      stylists ( name )
    `)
    .eq('id', payload.bookingId)
    .single();

  if (error || !booking) {
    console.error('Booking not found:', payload.bookingId, error);
    return { statusCode: 404, body: 'Booking not found' };
  }

  // Build and send emails
  const emails = buildEmails(booking as BookingData, payload.type, payload.extraMessage);
  const results: Array<{ to: string; ok: boolean; error?: string }> = [];

  for (const email of emails) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email.to],
          subject: email.subject,
          html: email.html,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Resend error for ${email.to}:`, errBody);
        results.push({ to: email.to, ok: false, error: errBody });
      } else {
        console.log(`Email sent to ${email.to}: ${email.subject}`);
        results.push({ to: email.to, ok: true });
      }
    } catch (fetchErr) {
      console.error(`Fetch error for ${email.to}:`, fetchErr);
      results.push({ to: email.to, ok: false, error: String(fetchErr) });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, results }),
  };
};
