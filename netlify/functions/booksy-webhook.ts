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

type MirrorStatus = 'confirmed' | 'cancelled';

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

const WORKER_LABEL_PATTERN =
  '(?:pracownik|pracownica|stylista|stylistka|wykonawca|specjalista|employee|staff|worker)';

function normalizeWhitespace(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

function normalizePersonName(value: string): string {
  return normalizeWhitespace(value).replace(/[.,;:!?]+$/, '');
}

function extractWorkerName(text: string, html: string): string | undefined {
  const workerRegexes = [
    new RegExp(`${WORKER_LABEL_PATTERN}\\s*:\\s*([^\\n<,;|]+)`, 'i'),
    new RegExp(`${WORKER_LABEL_PATTERN}\\s*-\\s*([^\\n<,;|]+)`, 'i'),
  ];

  for (const regex of workerRegexes) {
    const fromText = text.match(regex);
    if (fromText?.[1]) {
      return normalizePersonName(fromText[1]);
    }
    const fromHtml = html.match(regex);
    if (fromHtml?.[1]) {
      return normalizePersonName(fromHtml[1]);
    }
  }

  // Fallback: worker name can be inside service prefix, e.g. "(Top-stylistka Agnessa): ...".
  const fromServiceLine = text.match(
    /\((?:[^)]*?(?:stylistka|stylista|pracownik|worker|employee)\s+([^()]+))\)\s*:/i
  );
  if (fromServiceLine?.[1]) {
    return normalizePersonName(fromServiceLine[1]);
  }

  return undefined;
}

function cleanServiceNameForNewBooking(rawServiceName: string): string {
  const value = normalizeWhitespace(rawServiceName)
    .replace(new RegExp(`\\s*(?:,|\\|)?\\s*${WORKER_LABEL_PATTERN}\\s*[:\\-].*$`, 'i'), '')
    .trim();

  return value;
}

function isServiceNoise(candidate: string, clientName: string): boolean {
  const normalized = candidate.toLowerCase();

  if (!candidate || candidate.length < 3) return true;
  if (!/[a-ząćęłńóśźż]/i.test(candidate)) return true;
  if (normalized === 'booksy') return true;
  if (new RegExp(`^${WORKER_LABEL_PATTERN}\\s*[:\\-]`, 'i').test(candidate)) return true;
  if (/\d[\d\s,.]*\s*zł/i.test(candidate)) return true;
  if (clientName && normalized === clientName.toLowerCase()) return true;

  if (
    normalized.includes('nowa rezerwacja') ||
    normalized.includes('zmienił rezerwację') ||
    normalized.includes('odwołał swoją usługę') ||
    normalized.includes('nowy termin wizyty') ||
    normalized.includes('dzięki booksy')
  ) {
    return true;
  }

  if (
    /(poniedziałek|wtorek|środa|czwartek|piątek|sobota|niedziela)/i.test(candidate) ||
    /\b(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\b/i.test(
      candidate
    )
  ) {
    return true;
  }

  return false;
}

function scoreServiceCandidate(candidate: string): number {
  return (
    candidate.length +
    (candidate.includes(':') ? 4 : 0) +
    (candidate.includes('+') ? 2 : 0) +
    (candidate.split(' ').length >= 2 ? 3 : 0)
  );
}

function extractNewBookingServiceName(text: string, html: string, clientName: string): string {
  const normalizedText = text.replace(/\r/g, '\n');
  const lines = normalizedText
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const serviceCandidates: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!/\d[\d\s,.]*\s*zł/i.test(line)) continue;

    const inlineServiceMatch = line.match(/^(.*?)\s+\d[\d\s,.]*\s*zł/i);
    if (inlineServiceMatch?.[1]) {
      serviceCandidates.push(inlineServiceMatch[1]);
    }

    for (let prev = i - 1; prev >= 0; prev -= 1) {
      if (lines[prev]) {
        serviceCandidates.push(lines[prev]);
        break;
      }
    }
  }

  // Fallback for HTML where service and price are rendered in one table cell.
  const htmlCandidates = Array.from(
    html.matchAll(/([^<>\n]{3,200}?)<br\s*\/?>\s*[\d,.]+\s*zł/gi),
    (match) => match[1]
  );
  serviceCandidates.push(...htmlCandidates);

  const bestCandidate = serviceCandidates
    .map((candidate) => cleanServiceNameForNewBooking(candidate))
    .filter((candidate) => !isServiceNoise(candidate, clientName))
    .sort((a, b) => scoreServiceCandidate(b) - scoreServiceCandidate(a))[0];

  return bestCandidate || '';
}

function decodeQuotedPrintable(value: string): string {
  // Decode only if quoted-printable markers are present.
  if (!/=\r?\n|=[0-9A-Fa-f]{2}/.test(value)) {
    return value;
  }

  return value
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
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

  // Extract worker name (supports multiple labels and separators).
  const workerName = extractWorkerName(text, html);

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
    serviceName = extractNewBookingServiceName(text, html, clientName);
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

// --- Mirror Booksy bookings into main admin bookings list ---
async function createMirrorAdminBooking(
  parsed: ParsedBooking,
  stylistId: string | null,
  status: MirrorStatus = 'confirmed'
): Promise<void> {
  const notes = `[Booksy] ${parsed.serviceName}`;
  const payload = {
    service_id: null,
    user_id: null,
    time_slot_id: null,
    stylist_id: stylistId,
    status,
    contact_name: parsed.clientName || '',
    contact_phone: parsed.clientPhone || '',
    contact_email: parsed.clientEmail || '',
    notes,
    start_time: parsed.startTime,
    end_time: parsed.endTime,
  };

  const { error } = await supabase.from('bookings').insert(payload);
  if (error) {
    console.error('Error creating mirrored admin booking:', error);
  }
}

async function cancelMirrorAdminBookingByTime(
  clientName: string,
  startTime: string | undefined
): Promise<void> {
  if (!startTime || !clientName) return;

  const startDate = new Date(startTime);
  const startPlus1 = new Date(startDate.getTime() + 60000);

  const { data: mirrors, error: selectError } = await supabase
    .from('bookings')
    .select('id')
    .eq('contact_name', clientName)
    .like('notes', '[Booksy]%')
    .neq('status', 'cancelled')
    .gte('start_time', startDate.toISOString())
    .lt('start_time', startPlus1.toISOString());

  if (selectError) {
    console.error('Error finding mirrored admin booking to cancel:', selectError);
    return;
  }

  const mirrorIds = (mirrors || []).map((m) => m.id).filter(Boolean);
  if (mirrorIds.length === 0) return;

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .in('id', mirrorIds);

  if (updateError) {
    console.error('Error cancelling mirrored admin booking:', updateError);
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
  await createMirrorAdminBooking(parsed, stylistId, 'confirmed');

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
  await cancelMirrorAdminBookingByTime(parsed.clientName, parsed.oldStartTime);

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
  await createMirrorAdminBooking(parsed, stylistId, 'confirmed');

  return { status: 200, body: `Changed Booksy booking: ${booking?.id}` };
}

// --- Handle cancelled booking ---
async function handleCancelledBooking(
  parsed: ParsedBooking,
  subject: string,
  messageId: string,
  html: string
): Promise<{ status: number; body: string }> {
  await cancelMirrorAdminBookingByTime(parsed.clientName, parsed.startTime);

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

// --- Parse multipart/form-data (SendGrid Inbound Parse format) ---
function parseMultipartFormData(body: string, boundary: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = body.split(`--${boundary}`);

  for (const part of parts) {
    // Skip preamble and closing boundary
    if (!part || part.trim() === '--' || part.trim() === '') continue;

    // Find the end of headers (double newline, handle both \r\n and \n)
    let headerEnd = part.indexOf('\r\n\r\n');
    let valueStart = headerEnd + 4;
    if (headerEnd === -1) {
      headerEnd = part.indexOf('\n\n');
      valueStart = headerEnd + 2;
    }
    if (headerEnd === -1) continue;

    const headers = part.substring(0, headerEnd);
    let value = part.substring(valueStart);

    // Remove trailing \r\n or \n
    value = value.replace(/\r?\n$/, '');

    const nameMatch = headers.match(/name="([^"]+)"/);
    if (nameMatch) {
      result[nameMatch[1]] = value;
    }
  }

  return result;
}

// --- Extract form fields from request body (supports both URL-encoded and multipart) ---
function extractFormFields(event: HandlerEvent): Record<string, string> {
  const body = event.body || '';
  const decodedBody = event.isBase64Encoded
    ? Buffer.from(body, 'base64').toString('utf-8')
    : body;

  // Check content-type for multipart/form-data
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/);

  if (boundaryMatch) {
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    return parseMultipartFormData(decodedBody, boundary);
  }

  // Fallback: try URL-encoded parsing
  const params = new URLSearchParams(decodedBody);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });

  // If URL-encoded parsing yielded no useful fields, try multipart heuristic
  // (some proxies strip content-type but body is still multipart)
  if (!result['subject'] && !result['from'] && !result['html']) {
    const heuristicBoundary = decodedBody.match(/^--([^\r\n]+)/);
    if (heuristicBoundary) {
      return parseMultipartFormData(decodedBody, heuristicBoundary[1]);
    }
  }

  return result;
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

  // Log ID for tracking through the pipeline
  let logId: string | null = null;

  try {
    // SendGrid Inbound Parse sends multipart/form-data (or sometimes URL-encoded)
    // Key fields: from, to, subject, html, text, headers
    const fields = extractFormFields(event);
    const subject = decodeQuotedPrintable(fields['subject'] || '');
    const html = decodeQuotedPrintable(fields['html'] || fields['text'] || '');
    const rawText = decodeQuotedPrintable(fields['text'] || '');
    const emailHeaders = decodeQuotedPrintable(fields['headers'] || '');
    const from = decodeQuotedPrintable(fields['from'] || '');

    // --- LOG EVERY INCOMING EMAIL (before any validation) ---
    const { data: logEntry } = await supabase
      .from('booksy_email_log')
      .insert({
        from_address: from.substring(0, 500),
        subject: subject.substring(0, 1000),
        raw_html: html.substring(0, 100000),
        raw_text: rawText.substring(0, 50000),
        raw_headers: emailHeaders.substring(0, 10000),
        processing_status: 'received',
        is_base64: event.isBase64Encoded || false,
        body_length: (event.body || '').length,
      })
      .select('id')
      .single();
    logId = logEntry?.id || null;

    // Validate sender is from Booksy (also accept forwarded emails that contain Booksy content)
    const isFromBooksy = from.toLowerCase().includes('booksy');
    const hasBooksyContent =
      subject.toLowerCase().includes('rezerwacj') ||
      subject.toLowerCase().includes('odwołał') ||
      html.toLowerCase().includes('booksy.com') ||
      html.toLowerCase().includes('booksy wiesz');
    if (!isFromBooksy && !hasBooksyContent) {
      // Update log: rejected
      if (logId) {
        await supabase
          .from('booksy_email_log')
          .update({ processing_status: 'rejected', rejection_reason: 'Not a Booksy email' })
          .eq('id', logId);
      }
      return { statusCode: 200, body: 'Not a Booksy email, ignoring' };
    }

    // Strip "Fwd:" / "Fw:" / "FW:" prefix from subject (forwarded emails)
    const cleanSubject = subject.replace(/^(?:Fwd?|FW)\s*:\s*/i, '').trim();

    // Extract Message-ID for idempotency
    const msgIdMatch = emailHeaders.match(/Message-I[dD]:\s*<([^>]+)>/);
    const messageId =
      msgIdMatch?.[1] || `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Update log with message ID
    if (logId) {
      await supabase.from('booksy_email_log').update({ message_id: messageId }).eq('id', logId);
    }

    // Parse the email (use cleaned subject without Fwd: prefix)
    const parsed = parseBookingEmail(cleanSubject, html);
    if (!parsed) {
      console.error('Failed to parse Booksy email:', { subject, bodyLength: html.length });

      // Update log: parse error
      if (logId) {
        await supabase
          .from('booksy_email_log')
          .update({ processing_status: 'parse_error', error_message: 'Failed to parse email content' })
          .eq('id', logId);
      }

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

    // Update log: processed successfully
    if (logId) {
      await supabase
        .from('booksy_email_log')
        .update({
          processing_status: 'processed',
          parsed_email_type: parsed.emailType,
          parsed_client_name: parsed.clientName,
          parsed_service_name: parsed.serviceName,
        })
        .eq('id', logId);
    }

    return { statusCode: result.status, body: result.body };
  } catch (error) {
    console.error('Booksy webhook error:', error);

    // Update log: error
    if (logId) {
      await supabase
        .from('booksy_email_log')
        .update({
          processing_status: 'parse_error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', logId)
        .then(() => {});
    }

    // Return 200 to prevent SendGrid from retrying
    return {
      statusCode: 200,
      body: `Error processing email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
