import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { isRateLimited, getClientIp } from './utils/rateLimit';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const businessId = process.env.BOOKSY_BUSINESS_ID || '162206';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BOOKSY_API_BASE = 'https://pl.booksy.com/core/v2/business_api/me';

// --- Types ---
interface BooksySessionData {
  access_token: string;
  api_key: string;
  fingerprint?: string;
  user_agent?: string;
}

interface BooksyClient {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  visits_count: number;
  no_shows_count?: number;
  last_visit?: string;
  created?: string;
  note?: string;
  image_url?: string;
  stats?: {
    total_amount?: number;
    visits_count?: number;
  };
}

interface BooksyAppointment {
  id: number;
  client_id?: number;
  client?: { id: number; first_name: string; last_name: string };
  staff_id?: number;
  resource_id?: number;
  resource?: { id: number; name: string };
  datetime?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  service?: { name: string; id: number };
  created?: string;
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

// --- Booksy API calls ---

/** Fetch clients list with pagination */
async function fetchClients(
  session: BooksySessionData,
  page: number = 1,
  perPage: number = 100,
  search?: string
): Promise<{ clients: BooksyClient[]; total: number; page: number; pages: number }> {
  let url = `${BOOKSY_API_BASE}/businesses/${businessId}/clients/?page=${page}&per_page=${perPage}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

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

  const data = await response.json();
  console.log(`[BOOKSY-CLIENTS] Response keys:`, Object.keys(data));

  // Booksy API might return data in different formats
  // Try common patterns
  const clients = data.clients || data.results || data.data || [];
  const total = data.total || data.count || data.meta?.total || clients.length;
  const pages = data.pages || data.meta?.pages || Math.ceil(total / perPage);

  return { clients, total, page, pages };
}

/** Fetch all clients (paginated) */
async function fetchAllClients(session: BooksySessionData): Promise<BooksyClient[]> {
  const allClients: BooksyClient[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchClients(session, page, perPage);
    allClients.push(...result.clients);

    if (page >= result.pages || result.clients.length < perPage) {
      hasMore = false;
    } else {
      page++;
    }

    // Safety limit — max 50 pages (5000 clients)
    if (page > 50) break;
  }

  return allClients;
}

/** Fetch client detail with visit history */
async function fetchClientDetail(
  session: BooksySessionData,
  clientId: number
): Promise<unknown> {
  const url = `${BOOKSY_API_BASE}/businesses/${businessId}/clients/${clientId}/`;
  console.log(`[BOOKSY-CLIENTS] GET ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(session),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Booksy API error ${response.status}: ${text}`);
  }

  return await response.json();
}

/** Fetch appointments/bookings history */
async function fetchAppointments(
  session: BooksySessionData,
  page: number = 1,
  perPage: number = 100,
  dateFrom?: string,
  dateTo?: string
): Promise<{ appointments: BooksyAppointment[]; total: number; pages: number }> {
  let url = `${BOOKSY_API_BASE}/businesses/${businessId}/appointments/?page=${page}&per_page=${perPage}`;
  if (dateFrom) url += `&date_from=${dateFrom}`;
  if (dateTo) url += `&date_to=${dateTo}`;

  console.log(`[BOOKSY-CLIENTS] GET ${url}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(session),
  });

  if (response.status === 401 || response.status === 403) {
    await supabase.from('booksy_session').update({ is_valid: false }).eq('id', 'default');
    throw new Error(`Booksy session expired (${response.status})`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Booksy API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  console.log(`[BOOKSY-CLIENTS] Appointments response keys:`, Object.keys(data));

  const appointments = data.appointments || data.results || data.data || [];
  const total = data.total || data.count || appointments.length;
  const pages = data.pages || data.meta?.pages || Math.ceil(total / perPage);

  return { appointments, total, pages };
}

/** Fetch all appointments (paginated) */
async function fetchAllAppointments(
  session: BooksySessionData,
  dateFrom?: string,
  dateTo?: string
): Promise<BooksyAppointment[]> {
  const all: BooksyAppointment[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchAppointments(session, page, perPage, dateFrom, dateTo);
    all.push(...result.appointments);

    if (page >= result.pages || result.appointments.length < perPage) {
      hasMore = false;
    } else {
      page++;
    }

    if (page > 100) break; // Safety: max 10000 appointments
  }

  return all;
}

/** Try to discover available API endpoints (for debugging) */
async function discoverEndpoints(session: BooksySessionData): Promise<Record<string, unknown>> {
  const endpoints = [
    `/businesses/${businessId}/clients/`,
    `/businesses/${businessId}/appointments/`,
    `/businesses/${businessId}/bookings/`,
    `/businesses/${businessId}/stats/`,
    `/businesses/${businessId}/reports/`,
    `/businesses/${businessId}/reviews/`,
    `/businesses/${businessId}/resources/`,
    `/businesses/${businessId}/services/`,
  ];

  const results: Record<string, unknown> = {};

  for (const ep of endpoints) {
    const url = `${BOOKSY_API_BASE}${ep}?page=1&per_page=1`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(session),
      });
      const text = await response.text();
      let json: unknown = null;
      try { json = JSON.parse(text); } catch { json = text.substring(0, 200); }

      results[ep] = {
        status: response.status,
        ok: response.ok,
        keys: json && typeof json === 'object' ? Object.keys(json as Record<string, unknown>) : null,
        sample: json,
      };
    } catch (err) {
      results[ep] = { error: String(err) };
    }
  }

  return results;
}

// --- Load stylist mappings for enrichment ---
async function loadStylistMappings(): Promise<Map<number, string>> {
  const { data } = await supabase
    .from('booksy_stylist_mapping')
    .select('booksy_resource_id, stylists(name)')
    .not('booksy_resource_id', 'is', null);

  const map = new Map<number, string>();
  if (data) {
    for (const row of data) {
      if (row.booksy_resource_id && (row as any).stylists?.name) {
        map.set(row.booksy_resource_id, (row as any).stylists.name);
      }
    }
  }
  return map;
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

  const action = event.queryStringParameters?.action || 'clients';

  try {
    switch (action) {
      case 'clients': {
        const page = parseInt(event.queryStringParameters?.page || '1');
        const search = event.queryStringParameters?.search;
        const result = await fetchClients(session, page, 100, search);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
      }

      case 'all_clients': {
        const clients = await fetchAllClients(session);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ clients, total: clients.length }) };
      }

      case 'client_detail': {
        const clientId = parseInt(event.queryStringParameters?.clientId || '0');
        if (!clientId) {
          return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'clientId required' }) };
        }
        const detail = await fetchClientDetail(session, clientId);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(detail) };
      }

      case 'appointments': {
        const dateFrom = event.queryStringParameters?.date_from;
        const dateTo = event.queryStringParameters?.date_to;
        const allAppts = await fetchAllAppointments(session, dateFrom, dateTo);
        const stylistMap = await loadStylistMappings();

        // Enrich with stylist names
        const enriched = allAppts.map(a => ({
          ...a,
          stylist_name: (a.resource_id && stylistMap.get(a.resource_id))
            || a.resource?.name
            || undefined,
        }));

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ appointments: enriched, total: enriched.length }),
        };
      }

      case 'retention_data': {
        // Fetch both clients and appointments for retention analysis
        const [clients, appointments] = await Promise.all([
          fetchAllClients(session),
          fetchAllAppointments(session),
        ]);
        const stylistMap = await loadStylistMappings();

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            clients,
            appointments: appointments.map(a => ({
              ...a,
              stylist_name: (a.resource_id && stylistMap.get(a.resource_id))
                || a.resource?.name
                || undefined,
            })),
            stylist_mappings: Object.fromEntries(stylistMap),
          }),
        };
      }

      case 'discover': {
        // Debug: discover available Booksy API endpoints
        const results = await discoverEndpoints(session);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(results) };
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
