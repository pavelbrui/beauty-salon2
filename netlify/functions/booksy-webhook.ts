import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// --- Supabase client with service_role (bypasses RLS) ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const webhookSecret = process.env.BOOKSY_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Polish month name → JS month index (0-based) ---
const POLISH_MONTHS: Record<string, number> = {
  stycznia: 0,
  lutego: 1,
  marca: 2,
  kwietnia: 3,
  maja: 4,
  czerwca: 5,
  lipca: 6,
  sierpnia: 7,
  września: 8,
  października: 9,
  listopada: 10,
  grudnia: 11,
};

// --- Poland timezone offset helper ---
// CET = +01:00, CEST = +02:00 (last Sunday of March to last Sunday of October)
function getPolandOffset(year: number, month: number, day: number): string {
  // Last Sunday of March
  const marchLast = new Date(year, 2, 31);
  const marchSunday = 31 - marchLast.getDay();
  // Last Sunday of October
  const octLast = new Date(year, 9, 31);
  const octSunday = 31 - octLast.getDay();

  const dateNum = month * 100 + day;
  const summerStart = 2 * 100 + marchSunday; // March is month index 2
  const summerEnd = 9 * 100 + octSunday; // October is month index 9

  if (dateNum >= summerStart && dateNum < summerEnd) {
    return '+02:00'; // CEST
  }
  return '+01:00'; // CET
}

// --- Types ---
interface ParsedBooking {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  serviceName: string;
  workerName?: string;
  priceText?: string;
  startTime: string; // ISO string with timezone
  endTime: string;
  emailType: 'new' | 'changed' | 'cancelled';
  oldStartTime?: string;
  oldEndTime?: string;
}

// --- Email type detection ---
function detectEmailType(subject: string, html: string): 'new' | 'changed' | 'cancelled' {
  if (subject.includes('odwołał swoją usługę') || html.includes('odwołał swoją usługę')) {
    return 'cancelled';
  }
  if (subject.includes('zmienił rezerwację') || html.includes('zmienił rezerwację') || html.includes('przesunął swoją wizytę')) {
    return 'changed';
  }
  return 'new';
}

// --- Polish date parsing ---
// Handles: "23 lutego 2026, 17:00 - 19:00"
// Also: "23 lutego 2026 o godzinie 15:45"
// Also: "23 lutego 2026 15:45"
function parsePolishDateTime(text: string): { start: string; end: string } | null {
  // Pattern with time range: day month year, HH:MM - HH:MM
  const rangePattern =
    /(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+(\d{4}),?\s+(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/i;
  const rangeMatch = text.match(rangePattern);

  if (rangeMatch) {
    const day = parseInt(rangeMatch[1]);
    const month = POLISH_MONTHS[rangeMatch[2].toLowerCase()];
    const year = parseInt(rangeMatch[3]);
    const startH = parseInt(rangeMatch[4]);
    const startM = parseInt(rangeMatch[5]);
    const endH = parseInt(rangeMatch[6]);
    const endM = parseInt(rangeMatch[7]);
    const offset = getPolandOffset(year, month, day);

    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${year}-${pad(month + 1)}-${pad(day)}T${pad(startH)}:${pad(startM)}:00${offset}`;
    const end = `${year}-${pad(month + 1)}-${pad(day)}T${pad(endH)}:${pad(endM)}:00${offset}`;
    return { start, end };
  }

  // Pattern with single time: day month year [o godzinie] HH:MM
  const singlePattern =
    /(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+(\d{4})\s+(?:o godzinie\s+)?(\d{1,2}):(\d{2})/i;
  const singleMatch = text.match(singlePattern);

  if (singleMatch) {
    const day = parseInt(singleMatch[1]);
    const month = POLISH_MONTHS[singleMatch[2].toLowerCase()];
    const year = parseInt(singleMatch[3]);
    const h = parseInt(singleMatch[4]);
    const m = parseInt(singleMatch[5]);
    const offset = getPolandOffset(year, month, day);

    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${year}-${pad(month + 1)}-${pad(day)}T${pad(h)}:${pad(m)}:00${offset}`;
    // Default 1hr duration for cancelled bookings where only start time is given
    const endH = h + 1;
    const end = `${year}-${pad(month + 1)}-${pad(day)}T${pad(endH)}:${pad(m)}:00${offset}`;
    return { start, end };
  }

  return null;
}

// --- Strip HTML tags ---
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// --- Main email parser ---
function parseBookingEmail(subject: string, html: string): ParsedBooking | null {
  const emailType = detectEmailType(subject, html);
  const text = stripHtml(html);

  // Extract client name from subject (handle "Fwd:" prefix in forwarded emails)
  let clientName = '';
  const cleanedSubject = subject.replace(/^(?:Fwd?|FW)\s*:\s*/i, '');
  const subjectNameMatch = cleanedSubject.match(/^(.+?):\s*(nowa rezerwacja|zmienił rezerwację)/);
  if (subjectNameMatch) {
    clientName = subjectNameMatch[1].trim();
  } else if (emailType === 'cancelled') {
    const cancelNameMatch = text.match(/Klient\s+(.+?)\s+odwołał/i);
    if (cancelNameMatch) clientName = cancelNameMatch[1].trim();
  }

  // Fallback: bold name in HTML
  if (!clientName) {
    const boldMatch = html.match(/<strong>([^<]+)<\/strong>/);
    if (boldMatch) clientName = boldMatch[1].trim();
    if (!clientName) {
      const bMatch = html.match(/<b>([^<]+)<\/b>/);
      if (bMatch) clientName = bMatch[1].trim();
    }
  }

  // Extract phone (Polish format: 9 digits, possibly with +48 prefix)
  const phoneMatch =
    text.match(/((?:\+48\s?)?(?:\d[\s-]?){9})/) ||
    text.match(/([\d\s+()-]{9,})/);
  const clientPhone = phoneMatch ? phoneMatch[1].replace(/\s+/g, ' ').trim() : undefined;

  // Extract client email (skip system emails like booksy, icloud forwarding headers)
  const allEmails = text.match(/[\w.+-]+@[\w.-]+\.\w+/g) || [];
  const clientEmail = allEmails.find(
    (e) => !e.includes('booksy.com') && !e.includes('icloud.com') && !e.includes('noreply')
  );

  // Extract worker name: "pracownik: Agnessa"
  const workerMatch = text.match(/pracownik\s*:\s*(.+?)(?:\n|$)/i);
  const workerName = workerMatch ? workerMatch[1].trim() : undefined;

  // Extract service name
  let serviceName = '';
  if (emailType === 'cancelled') {
    // "odwołał swoją usługę Lifting rzęs / laminacja rzęs w dniu..."
    const svcMatch = text.match(/odwołał swoją usługę\s+(.+?)\s+w dniu/i);
    if (svcMatch) serviceName = svcMatch[1].trim();
  } else if (emailType === 'changed') {
    // "przesunął swoją wizytę Uzupełnienie 1-1:2 z dnia"
    const svcMatch = text.match(/przesunął swoją wizytę\s+(.+?)\s+z dnia/i);
    if (svcMatch) serviceName = svcMatch[1].trim();
  } else {
    // New booking: look for service line with price
    // Pattern in HTML: "Service Name\n126,00 zł, 17:00 - 19:00"
    const svcLineMatch = text.match(/(.+?)\n\s*[\d,.]+\s*zł/);
    if (svcLineMatch) {
      serviceName = svcLineMatch[1].trim();
      // Clean up: remove "Category (Role): " prefix if present
      const cleanMatch = serviceName.match(/(?:.*?:\s*)?([^:]+)$/);
      if (cleanMatch) serviceName = cleanMatch[1].trim();
    }
  }

  // Extract price
  const priceMatch = text.match(/([\d,.\s]+)\s*zł/);
  const priceText = priceMatch ? priceMatch[0].trim() : undefined;

  // Extract dates/times based on email type
  let startTime: string | undefined;
  let endTime: string | undefined;
  let oldStartTime: string | undefined;
  let oldEndTime: string | undefined;

  if (emailType === 'new') {
    const dateTime = parsePolishDateTime(text);
    if (dateTime) {
      startTime = dateTime.start;
      endTime = dateTime.end;
    }
  } else if (emailType === 'changed') {
    // Old time: "z dnia środa, 4 marca 2026 15:45"
    // Use \S+ instead of \w+ because Polish day names contain diacritics (ś, etc.)
    const oldMatch = text.match(/z dnia\s+\S+,\s*(.+?)(?:\s*na inny termin|$)/s);
    if (oldMatch) {
      const oldDt = parsePolishDateTime(oldMatch[1]);
      if (oldDt) {
        oldStartTime = oldDt.start;
        oldEndTime = oldDt.end;
      }
    }
    // New time: after "Nowy termin wizyty:"
    const newMatch = text.match(/Nowy termin wizyty[:\s]*\n?([\s\S]+?)(?:\n\n|$)/);
    if (newMatch) {
      const newDt = parsePolishDateTime(newMatch[1]);
      if (newDt) {
        startTime = newDt.start;
        endTime = newDt.end;
      }
    }
  } else if (emailType === 'cancelled') {
    // "w dniu poniedziałek, 23 lutego 2026 o godzinie 15:45"
    // Use \S+ instead of \w+ because Polish day names contain diacritics (ł, ś, etc.)
    const cancelDateMatch = text.match(/w dniu\s+\S+,\s*(.+)/i);
    if (cancelDateMatch) {
      const dt = parsePolishDateTime(cancelDateMatch[1]);
      if (dt) {
        startTime = dt.start;
        endTime = dt.end;
      }
    }
  }

  if (!startTime || !clientName) {
    return null;
  }

  // Default end time if missing
  if (!endTime) {
    const d = new Date(startTime);
    d.setHours(d.getHours() + 1);
    endTime = d.toISOString();
  }

  return {
    clientName,
    clientPhone,
    clientEmail,
    serviceName: serviceName || 'Booksy',
    workerName,
    priceText,
    startTime,
    endTime,
    emailType,
    oldStartTime,
    oldEndTime,
  };
}

// --- Stylist mapping lookup ---
async function findStylistId(
  workerName: string | undefined
): Promise<{ stylistId: string | null; syncStatus: 'mapped' | 'unmapped' }> {
  if (!workerName) return { stylistId: null, syncStatus: 'unmapped' };

  const { data } = await supabase
    .from('booksy_stylist_mapping')
    .select('stylist_id')
    .eq('booksy_name', workerName)
    .single();

  if (data?.stylist_id) {
    return { stylistId: data.stylist_id, syncStatus: 'mapped' };
  }

  // Auto-create unmapped entry for admin to fill in later
  await supabase
    .from('booksy_stylist_mapping')
    .upsert({ booksy_name: workerName, stylist_id: null }, { onConflict: 'booksy_name' });

  return { stylistId: null, syncStatus: 'unmapped' };
}

// --- Time slot blocking ---
async function blockTimeSlot(
  stylistId: string | null,
  startTime: string,
  endTime: string,
  booksyBookingId: string
): Promise<string | null> {
  const insertData: Record<string, unknown> = {
    start_time: startTime,
    end_time: endTime,
    is_available: false,
    booksy_booking_id: booksyBookingId,
  };
  if (stylistId) insertData.stylist_id = stylistId;

  const { data, error } = await supabase
    .from('time_slots')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating blocking time slot:', error);
    return null;
  }
  return data?.id || null;
}

// --- Unblock time slot ---
async function unblockTimeSlot(booksyBookingId: string): Promise<void> {
  const { error } = await supabase
    .from('time_slots')
    .delete()
    .eq('booksy_booking_id', booksyBookingId);

  if (error) {
    console.error('Error removing blocking time slot:', error);
  }
}

// --- Handle new booking ---
async function handleNewBooking(
  parsed: ParsedBooking,
  subject: string,
  messageId: string,
  html: string
): Promise<{ status: number; body: string }> {
  const { stylistId, syncStatus } = await findStylistId(parsed.workerName);

  const { data: booking, error: insertError } = await supabase
    .from('booksy_bookings')
    .insert({
      booksy_client_name: parsed.clientName,
      booksy_client_phone: parsed.clientPhone,
      booksy_client_email: parsed.clientEmail,
      booksy_service_name: parsed.serviceName,
      booksy_worker_name: parsed.workerName,
      booksy_price_text: parsed.priceText,
      start_time: parsed.startTime,
      end_time: parsed.endTime,
      stylist_id: stylistId,
      status: 'active',
      sync_status: syncStatus,
      email_subject: subject,
      email_message_id: messageId,
      email_type: 'new',
      raw_email_html: html.substring(0, 50000),
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return { status: 200, body: 'Duplicate email, already processed' };
    }
    throw insertError;
  }

  if (booking) {
    const slotId = await blockTimeSlot(stylistId, parsed.startTime, parsed.endTime, booking.id);
    if (slotId) {
      await supabase.from('booksy_bookings').update({ time_slot_id: slotId }).eq('id', booking.id);
    }
  }

  return { status: 200, body: `New Booksy booking created: ${booking?.id}` };
}

// --- Handle changed booking ---
async function handleChangedBooking(
  parsed: ParsedBooking,
  subject: string,
  messageId: string,
  html: string
): Promise<{ status: number; body: string }> {
  const { stylistId, syncStatus } = await findStylistId(parsed.workerName);

  // Find the original booking by client name + old time
  let previousBookingId: string | null = null;
  if (parsed.oldStartTime) {
    const oldStart = new Date(parsed.oldStartTime);
    const oldStartPlus1 = new Date(oldStart.getTime() + 60000);

    const { data: oldBooking } = await supabase
      .from('booksy_bookings')
      .select('id')
      .eq('booksy_client_name', parsed.clientName)
      .eq('status', 'active')
      .gte('start_time', oldStart.toISOString())
      .lt('start_time', oldStartPlus1.toISOString())
      .single();

    if (oldBooking) {
      previousBookingId = oldBooking.id;
      await supabase.from('booksy_bookings').update({ status: 'changed' }).eq('id', oldBooking.id);
      await unblockTimeSlot(oldBooking.id);
    }
  }

  const { data: booking, error: insertError } = await supabase
    .from('booksy_bookings')
    .insert({
      booksy_client_name: parsed.clientName,
      booksy_client_phone: parsed.clientPhone,
      booksy_client_email: parsed.clientEmail,
      booksy_service_name: parsed.serviceName,
      booksy_worker_name: parsed.workerName,
      booksy_price_text: parsed.priceText,
      start_time: parsed.startTime,
      end_time: parsed.endTime,
      stylist_id: stylistId,
      status: 'active',
      sync_status: syncStatus,
      email_subject: subject,
      email_message_id: messageId,
      email_type: 'changed',
      previous_booking_id: previousBookingId,
      raw_email_html: html.substring(0, 50000),
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return { status: 200, body: 'Duplicate email, already processed' };
    }
    throw insertError;
  }

  if (booking) {
    const slotId = await blockTimeSlot(stylistId, parsed.startTime, parsed.endTime, booking.id);
    if (slotId) {
      await supabase.from('booksy_bookings').update({ time_slot_id: slotId }).eq('id', booking.id);
    }
  }

  return { status: 200, body: `Changed Booksy booking: ${booking?.id}` };
}

// --- Handle cancelled booking ---
async function handleCancelledBooking(
  parsed: ParsedBooking,
  subject: string,
  messageId: string,
  html: string
): Promise<{ status: number; body: string }> {
  // Find active booking by client name + time
  const startDate = new Date(parsed.startTime);
  const startPlus1 = new Date(startDate.getTime() + 60000);

  const { data: existing } = await supabase
    .from('booksy_bookings')
    .select('id')
    .eq('booksy_client_name', parsed.clientName)
    .eq('status', 'active')
    .gte('start_time', startDate.toISOString())
    .lt('start_time', startPlus1.toISOString())
    .single();

  if (existing) {
    await supabase.from('booksy_bookings').update({ status: 'cancelled' }).eq('id', existing.id);
    await unblockTimeSlot(existing.id);
  }

  // Store the cancellation email as a record
  await supabase
    .from('booksy_bookings')
    .insert({
      booksy_client_name: parsed.clientName,
      booksy_client_phone: parsed.clientPhone,
      booksy_client_email: parsed.clientEmail,
      booksy_service_name: parsed.serviceName,
      booksy_worker_name: parsed.workerName,
      start_time: parsed.startTime,
      end_time: parsed.endTime,
      status: 'cancelled',
      sync_status: 'mapped',
      email_subject: subject,
      email_message_id: messageId,
      email_type: 'cancelled',
      previous_booking_id: existing?.id || null,
      raw_email_html: html.substring(0, 50000),
    })
    .maybeSingle();

  return { status: 200, body: `Cancelled Booksy booking: ${existing?.id || 'not found'}` };
}

// --- Main handler ---
export const handler: Handler = async (event: HandlerEvent) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Validate webhook secret (query param or header)
  if (webhookSecret) {
    const providedSecret =
      event.queryStringParameters?.secret || event.headers['x-webhook-secret'];
    if (providedSecret !== webhookSecret) {
      return { statusCode: 401, body: 'Unauthorized' };
    }
  }

  try {
    // SendGrid Inbound Parse sends URL-encoded form data
    // Key fields: from, to, subject, html, text, headers
    const body = event.body || '';
    const decodedBody = event.isBase64Encoded
      ? Buffer.from(body, 'base64').toString('utf-8')
      : body;

    const params = new URLSearchParams(decodedBody);
    const subject = params.get('subject') || '';
    const html = params.get('html') || params.get('text') || '';
    const emailHeaders = params.get('headers') || '';
    const from = params.get('from') || '';

    // Validate sender is from Booksy (also accept forwarded emails that contain Booksy content)
    const isFromBooksy = from.toLowerCase().includes('booksy');
    const hasBooksyContent =
      subject.toLowerCase().includes('rezerwacj') ||
      subject.toLowerCase().includes('odwołał') ||
      html.toLowerCase().includes('booksy.com') ||
      html.toLowerCase().includes('booksy wiesz');
    if (!isFromBooksy && !hasBooksyContent) {
      return { statusCode: 200, body: 'Not a Booksy email, ignoring' };
    }

    // Strip "Fwd:" / "Fw:" / "FW:" prefix from subject (forwarded emails)
    const cleanSubject = subject.replace(/^(?:Fwd?|FW)\s*:\s*/i, '').trim();

    // Extract Message-ID for idempotency
    const msgIdMatch = emailHeaders.match(/Message-I[dD]:\s*<([^>]+)>/);
    const messageId =
      msgIdMatch?.[1] || `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Parse the email (use cleaned subject without Fwd: prefix)
    const parsed = parseBookingEmail(cleanSubject, html);
    if (!parsed) {
      console.error('Failed to parse Booksy email:', { subject, bodyLength: html.length });

      // Store as error record for admin review
      await supabase
        .from('booksy_bookings')
        .insert({
          booksy_client_name: 'PARSE ERROR',
          booksy_service_name: 'PARSE ERROR',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          status: 'cancelled',
          sync_status: 'error',
          email_subject: subject,
          email_message_id: messageId,
          email_type: 'new',
          raw_email_html: html.substring(0, 50000),
          parse_errors: ['Failed to parse email content'],
        })
        .maybeSingle();

      return { statusCode: 200, body: 'Email received but could not be parsed' };
    }

    // Route to the appropriate handler
    let result;
    switch (parsed.emailType) {
      case 'new':
        result = await handleNewBooking(parsed, subject, messageId, html);
        break;
      case 'changed':
        result = await handleChangedBooking(parsed, subject, messageId, html);
        break;
      case 'cancelled':
        result = await handleCancelledBooking(parsed, subject, messageId, html);
        break;
    }

    return { statusCode: result.status, body: result.body };
  } catch (error) {
    console.error('Booksy webhook error:', error);
    // Return 200 to prevent SendGrid from retrying
    return {
      statusCode: 200,
      body: `Error processing email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
