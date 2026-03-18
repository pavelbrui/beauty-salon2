import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { isRateLimited, getClientIp } from './utils/rateLimit';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const businessId = process.env.BOOKSY_BUSINESS_ID || '162206';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Correct Booksy Stats API base URL (NOT core/v2)
const BOOKSY_STATS_API = `https://pl.booksy.com/api/pl/2/business_api/me/stats/businesses/${businessId}`;

// --- Types ---
interface BooksySessionData {
  access_token: string;
  api_key: string;
  fingerprint?: string;
  user_agent?: string;
}

interface ReportRow {
  booking_date: string;    // "DD.MM.YYYY HH:MM"
  customer_name: string;
  service_name: string;
  service_category_name?: string;
  status: string;
  service_value?: string;  // "160,00 zł"
}

interface ReportSection {
  title: string;           // Stylist name
  resource_id: string;     // e.g. "671988"
  pagination: {
    page: number;
    per_page: number;
    last_page: number;
  };
  table: {
    rows: ReportRow[];
  };
}

interface StatsReportResponse {
  sections: ReportSection[];
}

// Output types matching what AdminRetention.tsx expects
interface OutputClient {
  id: number;
  first_name: string;
  last_name: string;
  visits_count: number;
  last_visit?: string;
}

interface OutputAppointment {
  id: number;
  client_id: number;
  client: { id: number; first_name: string; last_name: string };
  resource_id: number;
  datetime: string;
  status: string;
  service: { name: string; id: number };
  stylist_name: string;
}

// --- Auth ---
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

async function loadSession(): Promise<BooksySessionData | null> {
  const { data, error } = await supabase
    .from('booksy_session')
    .select('access_token, api_key, fingerprint, user_agent, is_valid')
    .eq('id', 'default')
    .single();

  if (error || !data || !data.is_valid || !data.access_token) {
    return null;
  }

  return {
    access_token: data.access_token,
    api_key: data.api_key || 'frontdesk-76661e2b-25f0-49b4-b33a-9d78957a58e3',
    fingerprint: data.fingerprint || undefined,
    user_agent: data.user_agent || undefined,
  };
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
  headers['bksreqid'] = crypto.randomUUID();
  return headers;
}

// --- Date helpers ---

/** Parse "DD.MM.YYYY HH:MM" Polish date format into ISO string */
function parseBooksyDate(dateStr: string): string {
  // Format: "31.03.2026 16:00"
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return dateStr; // Return as-is if format doesn't match
  const [, day, month, year, hour, minute] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

/** Get first day of month N months ago, in YYYY-MM-DD format */
function monthStart(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

/** Get last day of a given month, in YYYY-MM-DD format */
function monthEnd(dateStr: string): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0); // Last day of previous month
  return d.toISOString().slice(0, 10);
}

// --- Booksy Stats API calls ---

/** Fetch one month of the appointments_by_staffer report, with pagination for each section */
async function fetchReportMonth(
  session: BooksySessionData,
  dateFrom: string,
  dateTill: string
): Promise<ReportSection[]> {
  const url = `${BOOKSY_STATS_API}/report?report_key=appointments_by_staffer&date_from=${dateFrom}&date_till=${dateTill}&time_span=month`;

  console.log(`[BOOKSY-CLIENTS] GET ${url}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(session),
  });

  if (response.status === 401 || response.status === 403) {
    await supabase.from('booksy_session').update({ is_valid: false }).eq('id', 'default');
    throw new Error(`Booksy session expired (${response.status}). Update token in admin panel.`);
  }

  if (!response.ok) {
    const text = await response.text();
    console.error(`[BOOKSY-CLIENTS] Error ${response.status}:`, text);
    throw new Error(`Booksy API error ${response.status}: ${text}`);
  }

  const data: StatsReportResponse = await response.json();
  const sections = data.sections || [];

  // For each section, check if there are more pages and fetch them
  for (const section of sections) {
    if (!section.pagination) continue;
    const lastPage = section.pagination.last_page || 1;

    if (lastPage > 1) {
      // Fetch remaining pages for this staffer
      for (let page = 2; page <= lastPage; page++) {
        const pageUrl = `${BOOKSY_STATS_API}/report?report_key=appointments_by_staffer&date_from=${dateFrom}&date_till=${dateTill}&time_span=month&page_${section.resource_id}=${page}`;

        console.log(`[BOOKSY-CLIENTS] Paginating staffer ${section.title} page ${page}/${lastPage}`);
        const pageResp = await fetch(pageUrl, {
          method: 'GET',
          headers: buildHeaders(session),
        });

        if (pageResp.ok) {
          const pageData: StatsReportResponse = await pageResp.json();
          // Find matching section in paginated response
          const matchSection = pageData.sections?.find(s => s.resource_id === section.resource_id);
          if (matchSection?.table?.rows) {
            section.table.rows.push(...matchSection.table.rows);
          }
        }
      }
    }
  }

  return sections;
}

/** Fetch multiple months of report data */
async function fetchRetentionReportData(
  session: BooksySessionData,
  monthsBack: number = 12
): Promise<ReportSection[]> {
  const allSections = new Map<string, ReportSection>();

  // Fetch month by month
  for (let i = 0; i < monthsBack; i++) {
    const from = monthStart(i);
    const till = monthEnd(from);

    try {
      const sections = await fetchReportMonth(session, from, till);

      for (const section of sections) {
        const rid = section.resource_id;
        if (allSections.has(rid)) {
          // Merge rows into existing section
          allSections.get(rid)!.table.rows.push(...section.table.rows);
        } else {
          allSections.set(rid, { ...section });
        }
      }
    } catch (err) {
      console.error(`[BOOKSY-CLIENTS] Error fetching ${from} to ${till}:`, err);
      // Continue with other months even if one fails
    }
  }

  return Array.from(allSections.values());
}

/** Transform Booksy report sections into RetentionData format */
function transformToRetentionData(sections: ReportSection[]): {
  clients: OutputClient[];
  appointments: OutputAppointment[];
  stylist_mappings: Record<string, string>;
} {
  const clientMap = new Map<string, OutputClient>();
  const appointments: OutputAppointment[] = [];
  const stylistMappings: Record<string, string> = {};
  let clientIdCounter = 1;
  let appointmentIdCounter = 1;

  for (const section of sections) {
    const stylistName = section.title;
    const resourceId = parseInt(section.resource_id) || 0;
    stylistMappings[resourceId] = stylistName;

    for (const row of section.table.rows) {
      const customerName = (row.customer_name || '').trim();
      if (!customerName) continue;

      const clientKey = customerName.toLowerCase();

      // Get or create client
      let client = clientMap.get(clientKey);
      if (!client) {
        const parts = customerName.split(' ');
        client = {
          id: clientIdCounter++,
          first_name: parts[0] || '',
          last_name: parts.slice(1).join(' ') || '',
          visits_count: 0,
          last_visit: undefined,
        };
        clientMap.set(clientKey, client);
      }

      client.visits_count++;

      // Parse date
      const isoDate = parseBooksyDate(row.booking_date);
      if (!client.last_visit || isoDate > client.last_visit) {
        client.last_visit = isoDate;
      }

      // Create appointment
      appointments.push({
        id: appointmentIdCounter++,
        client_id: client.id,
        client: { id: client.id, first_name: client.first_name, last_name: client.last_name },
        resource_id: resourceId,
        datetime: isoDate,
        status: row.status || '',
        service: { name: row.service_name || '', id: 0 },
        stylist_name: stylistName,
      });
    }
  }

  return {
    clients: Array.from(clientMap.values()),
    appointments,
    stylist_mappings: stylistMappings,
  };
}

// --- Handler ---
const handler: Handler = async (event: HandlerEvent) => {
  // CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Rate limit
  const ip = getClientIp(event.headers as Record<string, string>);
  if (isRateLimited(ip, 15, 60_000)) {
    return { statusCode: 429, headers: corsHeaders, body: JSON.stringify({ error: 'Rate limited' }) };
  }

  // Auth — require Supabase JWT
  const authHeader = event.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token || !(await verifyAuthToken(token))) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // Load Booksy session
  const session = await loadSession();
  if (!session) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Booksy session not configured or expired. Update token in admin panel.' }),
    };
  }

  const action = event.queryStringParameters?.action || 'retention_data';

  try {
    switch (action) {
      case 'retention_data': {
        const months = parseInt(event.queryStringParameters?.months || '12');
        const sections = await fetchRetentionReportData(session, Math.min(months, 24));
        const result = transformToRetentionData(sections);

        console.log(`[BOOKSY-CLIENTS] Retention data: ${result.clients.length} clients, ${result.appointments.length} appointments`);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result),
        };
      }

      case 'report_raw': {
        // Debug: return raw report for one month
        const dateFrom = event.queryStringParameters?.date_from || monthStart(0);
        const dateTill = event.queryStringParameters?.date_till || monthEnd(dateFrom);
        const sections = await fetchReportMonth(session, dateFrom, dateTill);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ sections, date_from: dateFrom, date_till: dateTill }),
        };
      }

      default:
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }
  } catch (err) {
    console.error('[BOOKSY-CLIENTS] Error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: String(err) }),
    };
  }
};

export { handler };
