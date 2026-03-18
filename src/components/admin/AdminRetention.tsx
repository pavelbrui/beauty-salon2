import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../hooks/useLanguage';
import { translations } from '../../i18n/translations';
import {
  ArrowPathIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarDaysIcon,
  StarIcon,
  ClockIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

// --- Types ---
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
  stylist_name?: string;
}

interface RetentionData {
  clients: BooksyClient[];
  appointments: BooksyAppointment[];
  stylist_mappings: Record<number, string>;
}

interface StylistRetention {
  name: string;
  resourceId: number;
  totalClients: number;
  returningClients: number;
  returnRate: number;
  avgVisits: number;
  totalAppointments: number;
  topClients: { name: string; visits: number }[];
  // Lost/overdue clients breakdown
  lostAfter1m: number;  // didn't return after 30 days
  lostAfter2m: number;  // didn't return after 60 days
  lostAfter3m: number;  // didn't return after 90+ days
  avgReturnDays: number;
  // Clients who properly returned on schedule
  onScheduleRate: number; // % who returned within expected timeframe
}

type DataSource = 'booksy_api' | 'local_db';
type TimeRange = 'all' | '12m' | '6m' | '3m';

export const AdminRetention: React.FC = () => {
  const { language } = useLanguage();
  const t = (translations[language] as any).admin_retention || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RetentionData | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('booksy_api');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [expandedStylist, setExpandedStylist] = useState<number | null>(null);

  // --- Fetch from Booksy API ---
  const fetchFromBooksyApi = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(
      `/.netlify/functions/booksy-clients?action=retention_data`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return (await res.json()) as RetentionData;
  };

  // --- Fetch from local DB (booksy_bookings + bookings tables) ---
  const fetchFromLocalDb = async (): Promise<RetentionData> => {
    // Get booksy_bookings (inbound from Booksy emails)
    const { data: booksyBookings, error: err1 } = await supabase
      .from('booksy_bookings')
      .select('*, stylists(name)')
      .eq('status', 'active')
      .order('start_time', { ascending: false });

    if (err1) throw new Error(`DB error: ${err1.message}`);

    // Get local bookings with user info
    const { error: err2 } = await supabase
      .from('bookings')
      .select('*, time_slots(stylist_id, start_time, end_time), services(name), stylists:time_slots(stylists(name, id))')
      .in('status', ['confirmed', 'completed'])
      .order('created_at', { ascending: false });

    if (err2) throw new Error(`DB error: ${err2.message}`);

    // Get stylist mappings
    const { data: mappings } = await supabase
      .from('booksy_stylist_mapping')
      .select('booksy_resource_id, booksy_name, stylist_id, stylists(name)');

    const stylistMap: Record<number, string> = {};
    if (mappings) {
      for (const m of mappings) {
        if (m.booksy_resource_id && (m as any).stylists?.name) {
          stylistMap[m.booksy_resource_id] = (m as any).stylists.name;
        }
      }
    }

    // Build unified client list from booksy_bookings
    const clientMap = new Map<string, BooksyClient>();
    let clientIdCounter = 1;

    for (const b of booksyBookings || []) {
      const key = (b.booksy_client_name || '').toLowerCase().trim();
      if (!key) continue;

      const existing = clientMap.get(key);
      if (existing) {
        existing.visits_count++;
        if (b.start_time > (existing.last_visit || '')) {
          existing.last_visit = b.start_time;
        }
      } else {
        clientMap.set(key, {
          id: clientIdCounter++,
          first_name: b.booksy_client_name?.split(' ')[0] || '',
          last_name: b.booksy_client_name?.split(' ').slice(1).join(' ') || '',
          phone: b.booksy_client_phone,
          email: b.booksy_client_email,
          visits_count: 1,
          last_visit: b.start_time,
          created: b.created_at,
        });
      }
    }

    // Build appointments from booksy_bookings
    const appointments: BooksyAppointment[] = (booksyBookings || []).map((b, i) => {
      const key = (b.booksy_client_name || '').toLowerCase().trim();
      const client = clientMap.get(key);
      return {
        id: i + 1,
        client_id: client?.id,
        client: client ? { id: client.id, first_name: client.first_name, last_name: client.last_name } : undefined,
        datetime: b.start_time,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status,
        stylist_name: b.booksy_worker_name || (b as any).stylists?.name,
        service: b.booksy_service_name ? { name: b.booksy_service_name, id: 0 } : undefined,
      };
    });

    return {
      clients: Array.from(clientMap.values()),
      appointments,
      stylist_mappings: stylistMap,
    };
  };

  // --- Load data ---
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = dataSource === 'booksy_api'
        ? await fetchFromBooksyApi()
        : await fetchFromLocalDb();
      setData(result);
    } catch (err) {
      console.error('Error loading retention data:', err);
      setError(String(err));

      // If Booksy API fails, suggest local DB
      if (dataSource === 'booksy_api') {
        setError(`${String(err)}\n\nTip: Try switching to "Local DB" data source.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dataSource]);

  // --- Compute metrics ---
  const filteredAppointments = useMemo(() => {
    if (!data) return [];
    let appts = data.appointments;

    // Time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      const months = timeRange === '12m' ? 12 : timeRange === '6m' ? 6 : 3;
      const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
      appts = appts.filter(a => {
        const d = new Date(a.datetime || a.start_time || a.date || '');
        return d >= cutoff;
      });
    }

    return appts;
  }, [data, timeRange]);

  const overallMetrics = useMemo(() => {
    if (!data) return null;

    const clients = data.clients;
    const appts = filteredAppointments;

    // Count visits per client from appointments
    const visitsPerClient = new Map<number | string, number>();
    for (const a of appts) {
      const cid = a.client_id || a.client?.id;
      if (cid) {
        visitsPerClient.set(cid, (visitsPerClient.get(cid) || 0) + 1);
      }
    }

    const totalClients = clients.length || visitsPerClient.size;
    const totalWithVisits = visitsPerClient.size;

    // Clients with 2+ visits = returning clients
    let returningClients = 0;
    let totalVisits = 0;
    for (const [, count] of visitsPerClient) {
      totalVisits += count;
      if (count >= 2) returningClients++;
    }

    // If we have visits_count from client objects (Booksy API), use those too
    if (clients.length > 0 && timeRange === 'all') {
      const fromClientData = clients.filter(c => (c.visits_count || c.stats?.visits_count || 0) >= 2).length;
      if (fromClientData > returningClients) {
        returningClients = fromClientData;
      }
      const totalVisitsFromClients = clients.reduce((s, c) => s + (c.visits_count || c.stats?.visits_count || 0), 0);
      if (totalVisitsFromClients > totalVisits) {
        totalVisits = totalVisitsFromClients;
      }
    }

    const returnRate = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;
    const avgVisits = totalClients > 0 ? totalVisits / totalClients : 0;

    // Clients who visited in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentClients = new Set<number | string>();
    for (const a of appts) {
      const d = new Date(a.datetime || a.start_time || a.date || '');
      if (d >= thirtyDaysAgo) {
        const cid = a.client_id || a.client?.id;
        if (cid) recentClients.add(cid);
      }
    }

    // New clients (1 visit only)
    const newClients = totalWithVisits - returningClients;

    return {
      totalClients,
      returningClients,
      newClients: Math.max(0, newClients),
      returnRate,
      avgVisits,
      totalVisits,
      recentActiveClients: recentClients.size,
    };
  }, [data, filteredAppointments, timeRange]);

  // --- Per-stylist metrics ---
  const stylistMetrics = useMemo((): StylistRetention[] => {
    if (!data) return [];

    const appts = filteredAppointments;
    const now = new Date();

    // Group appointments by stylist
    const stylistGroups = new Map<string, BooksyAppointment[]>();
    for (const a of appts) {
      const name = a.stylist_name
        || (a.resource?.name)
        || (a.resource_id ? (data.stylist_mappings[a.resource_id] || `Resource #${a.resource_id}`) : null);
      if (!name) continue;
      if (!stylistGroups.has(name)) stylistGroups.set(name, []);
      stylistGroups.get(name)!.push(a);
    }

    const results: StylistRetention[] = [];

    for (const [name, apptsList] of stylistGroups) {
      // Track per-client: visits, dates, last visit
      const clientData = new Map<string, { name: string; visits: number; dates: Date[]; lastVisit: Date }>();

      for (const a of apptsList) {
        const cid = String(a.client_id || a.client?.id || '');
        if (!cid) continue;
        const clientName = a.client
          ? `${a.client.first_name} ${a.client.last_name}`.trim()
          : `Client #${cid}`;
        const dt = new Date(a.datetime || a.start_time || a.date || '');
        if (isNaN(dt.getTime())) continue;

        const existing = clientData.get(cid);
        if (existing) {
          existing.visits++;
          existing.dates.push(dt);
          if (dt > existing.lastVisit) existing.lastVisit = dt;
        } else {
          clientData.set(cid, { name: clientName, visits: 1, dates: [dt], lastVisit: dt });
        }
      }

      const totalClients = clientData.size;
      let returningClients = 0;
      let totalVisitSum = 0;
      let lostAfter1m = 0;
      let lostAfter2m = 0;
      let lostAfter3m = 0;
      const allReturnGaps: number[] = [];

      for (const [, cd] of clientData) {
        totalVisitSum += cd.visits;
        if (cd.visits >= 2) returningClients++;

        // Calculate return gaps for this client at this stylist
        if (cd.dates.length >= 2) {
          const sorted = cd.dates.sort((a, b) => a.getTime() - b.getTime());
          for (let i = 1; i < sorted.length; i++) {
            const gap = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
            allReturnGaps.push(gap);
          }
        }

        // How long since last visit? (lost client analysis)
        const daysSinceLastVisit = (now.getTime() - cd.lastVisit.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastVisit > 90) {
          lostAfter3m++;
        } else if (daysSinceLastVisit > 60) {
          lostAfter2m++;
        } else if (daysSinceLastVisit > 30) {
          lostAfter1m++;
        }
      }

      const avgReturnDays = allReturnGaps.length > 0
        ? allReturnGaps.reduce((s, g) => s + g, 0) / allReturnGaps.length
        : 0;

      // On-schedule rate: % of clients whose last visit is within 1.5x the average return time
      // (or within 45 days if no avg available) — these are "healthy" returning clients
      const expectedReturnDays = avgReturnDays > 0 ? avgReturnDays * 1.5 : 45;
      let onScheduleCount = 0;
      for (const [, cd] of clientData) {
        const daysSince = (now.getTime() - cd.lastVisit.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince <= expectedReturnDays || cd.visits >= 2) {
          // Client either visited recently or has proven return history
          if (daysSince <= expectedReturnDays) onScheduleCount++;
        }
      }

      const topClients = Array.from(clientData.values())
        .map(cd => ({ name: cd.name, visits: cd.visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5);

      results.push({
        name,
        resourceId: 0,
        totalClients,
        returningClients,
        returnRate: totalClients > 0 ? (returningClients / totalClients) * 100 : 0,
        avgVisits: totalClients > 0 ? totalVisitSum / totalClients : 0,
        totalAppointments: apptsList.length,
        topClients,
        lostAfter1m,
        lostAfter2m,
        lostAfter3m,
        avgReturnDays,
        onScheduleRate: totalClients > 0 ? (onScheduleCount / totalClients) * 100 : 0,
      });
    }

    return results.sort((a, b) => b.returnRate - a.returnRate);
  }, [data, filteredAppointments]);

  // --- Per-service average return time ---
  interface ServiceReturnMetric {
    serviceName: string;
    avgReturnDays: number;
    medianReturnDays: number;
    totalReturns: number;
    totalClients: number;
    immediateRebookRate: number; // % who booked next visit within 7 days of procedure
  }

  const serviceReturnMetrics = useMemo((): ServiceReturnMetric[] => {
    if (!data) return [];
    const appts = filteredAppointments;

    // Group appointments by client+service, sorted by date
    // key = clientId|serviceName
    const clientServiceVisits = new Map<string, { dates: Date[]; serviceName: string; clientId: string }>();

    for (const a of appts) {
      const cid = String(a.client_id || a.client?.id || '');
      const svc = a.service?.name;
      if (!cid || !svc) continue;

      const dt = new Date(a.datetime || a.start_time || a.date || '');
      if (isNaN(dt.getTime())) continue;

      const key = `${cid}|${svc}`;
      const existing = clientServiceVisits.get(key);
      if (existing) {
        existing.dates.push(dt);
      } else {
        clientServiceVisits.set(key, { dates: [dt], serviceName: svc, clientId: cid });
      }
    }

    // Group by service
    const serviceGroups = new Map<string, { gaps: number[]; immediateRebooks: number; totalWithMultiple: number; totalClients: number }>();

    for (const [, entry] of clientServiceVisits) {
      const svc = entry.serviceName;
      if (!serviceGroups.has(svc)) {
        serviceGroups.set(svc, { gaps: [], immediateRebooks: 0, totalWithMultiple: 0, totalClients: 0 });
      }
      const group = serviceGroups.get(svc)!;
      group.totalClients++;

      if (entry.dates.length < 2) continue;

      // Sort dates ascending
      const sorted = entry.dates.sort((a, b) => a.getTime() - b.getTime());
      group.totalWithMultiple++;

      for (let i = 1; i < sorted.length; i++) {
        const gapDays = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        group.gaps.push(gapDays);

        // "Immediate rebook" = next visit booked within 7 days of previous visit date
        // (approximation: we check if the booking was created close to the previous visit)
        if (gapDays <= 7) {
          group.immediateRebooks++;
        }
      }
    }

    // Also check for immediate rebooking globally per service:
    // A better approximation — look at all appointments grouped by client+service,
    // check if there's a future appointment scheduled (regardless of gap)
    // For now, use "booked within 7 days" as the proxy for "signed up right after"

    const results: ServiceReturnMetric[] = [];

    for (const [serviceName, group] of serviceGroups) {
      if (group.totalClients < 2) continue; // Skip services with very few clients

      const gaps = group.gaps;
      if (gaps.length === 0) {
        results.push({
          serviceName,
          avgReturnDays: 0,
          medianReturnDays: 0,
          totalReturns: 0,
          totalClients: group.totalClients,
          immediateRebookRate: 0,
        });
        continue;
      }

      const avgDays = gaps.reduce((s, g) => s + g, 0) / gaps.length;
      const sortedGaps = [...gaps].sort((a, b) => a - b);
      const medianDays = sortedGaps[Math.floor(sortedGaps.length / 2)];

      // Immediate rebook rate: % of return gaps that are ≤ 7 days
      const immediateRate = gaps.length > 0
        ? (group.immediateRebooks / gaps.length) * 100
        : 0;

      results.push({
        serviceName,
        avgReturnDays: avgDays,
        medianReturnDays: medianDays,
        totalReturns: gaps.length,
        totalClients: group.totalClients,
        immediateRebookRate: immediateRate,
      });
    }

    return results.sort((a, b) => b.totalReturns - a.totalReturns);
  }, [data, filteredAppointments]);

  // --- Overall immediate rebooking rate ---
  const immediateRebookingMetrics = useMemo(() => {
    if (!data) return null;
    const appts = filteredAppointments;

    // Group all appointments by client, sorted by date
    const clientVisits = new Map<string, Date[]>();
    for (const a of appts) {
      const cid = String(a.client_id || a.client?.id || '');
      if (!cid) continue;
      const dt = new Date(a.datetime || a.start_time || a.date || '');
      if (isNaN(dt.getTime())) continue;
      if (!clientVisits.has(cid)) clientVisits.set(cid, []);
      clientVisits.get(cid)!.push(dt);
    }

    let totalGaps = 0;
    let immediateGaps = 0; // within 7 days
    let quickGaps = 0; // within 14 days

    for (const [, dates] of clientVisits) {
      if (dates.length < 2) continue;
      const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
      for (let i = 1; i < sorted.length; i++) {
        const gapDays = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        totalGaps++;
        if (gapDays <= 7) immediateGaps++;
        if (gapDays <= 14) quickGaps++;
      }
    }

    return {
      totalGaps,
      immediateGaps,
      quickGaps,
      immediateRate: totalGaps > 0 ? (immediateGaps / totalGaps) * 100 : 0,
      quickRate: totalGaps > 0 ? (quickGaps / totalGaps) * 100 : 0,
    };
  }, [data, filteredAppointments]);

  // --- Top returning clients ---
  const topReturningClients = useMemo(() => {
    if (!data) return [];

    // Use client data if available (from Booksy API)
    if (data.clients.length > 0 && timeRange === 'all') {
      return [...data.clients]
        .sort((a, b) => (b.visits_count || 0) - (a.visits_count || 0))
        .slice(0, 20)
        .map(c => ({
          name: `${c.first_name} ${c.last_name}`.trim(),
          visits: c.visits_count || c.stats?.visits_count || 0,
          lastVisit: c.last_visit,
          phone: c.phone,
        }));
    }

    // Otherwise compute from appointments
    const clientVisits = new Map<string, { name: string; visits: number; lastVisit?: string }>();
    for (const a of filteredAppointments) {
      const cid = String(a.client_id || a.client?.id || '');
      if (!cid) continue;
      const clientName = a.client
        ? `${a.client.first_name} ${a.client.last_name}`.trim()
        : `Client #${cid}`;
      const dt = a.datetime || a.start_time || a.date;

      const existing = clientVisits.get(cid);
      if (existing) {
        existing.visits++;
        if (dt && dt > (existing.lastVisit || '')) existing.lastVisit = dt;
      } else {
        clientVisits.set(cid, { name: clientName, visits: 1, lastVisit: dt });
      }
    }

    return Array.from(clientVisits.values())
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 20);
  }, [data, filteredAppointments, timeRange]);

  // --- Render ---
  const labels = {
    title: t.title || 'Analityka powrotów klientów',
    subtitle: t.subtitle || 'Analiza lojalności i powracalności klientów',
    loading: t.loading || 'Ładowanie danych...',
    refresh: t.refresh || 'Odśwież',
    dataSource: t.dataSource || 'Źródło danych',
    booksyApi: t.booksyApi || 'Booksy API',
    localDb: t.localDb || 'Lokalna baza',
    timeRange: t.timeRange || 'Okres',
    all: t.all || 'Cały czas',
    months12: t.months12 || '12 miesięcy',
    months6: t.months6 || '6 miesięcy',
    months3: t.months3 || '3 miesiące',
    totalClients: t.totalClients || 'Klienci łącznie',
    returningClients: t.returningClients || 'Powracający',
    newClients: t.newClients || 'Nowi klienci',
    returnRate: t.returnRate || 'Wskaźnik powrotów',
    avgVisits: t.avgVisits || 'Śr. wizyty / klient',
    totalVisits: t.totalVisits || 'Wizyty łącznie',
    recentActive: t.recentActive || 'Aktywni (30 dni)',
    perStylist: t.perStylist || 'Według mastera',
    stylist: t.stylist || 'Master',
    clients: t.clients || 'Klienci',
    returning: t.returning || 'Powroty',
    rate: t.rate || 'Wskaźnik',
    visits: t.visits || 'Wizyty',
    topClients: t.topClients || 'Top lojalni klienci',
    name: t.name || 'Imię',
    visitCount: t.visitCount || 'Liczba wizyt',
    lastVisit: t.lastVisit || 'Ostatnia wizyta',
    noData: t.noData || 'Brak danych. Kliknij "Odśwież" aby załadować.',
    topClientsForStylist: t.topClientsForStylist || 'Top klienci mastera',
    appointments: t.appointments || 'Rezerwacje',
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString(language === 'pl' ? 'pl-PL' : language === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{labels.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{labels.subtitle}</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          {labels.refresh}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-gray-50 rounded-xl p-4">
        {/* Data source */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{labels.dataSource}:</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setDataSource('booksy_api')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                dataSource === 'booksy_api'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {labels.booksyApi}
            </button>
            <button
              onClick={() => setDataSource('local_db')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                dataSource === 'local_db'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {labels.localDb}
            </button>
          </div>
        </div>

        {/* Time range */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{labels.timeRange}:</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            {(['all', '12m', '6m', '3m'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range === 'all' ? labels.all : range === '12m' ? labels.months12 : range === '6m' ? labels.months6 : labels.months3}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-amber-500 animate-spin" />
          <span className="ml-3 text-gray-600">{labels.loading}</span>
        </div>
      )}

      {/* No data */}
      {!loading && !data && !error && (
        <div className="text-center py-12 text-gray-500">{labels.noData}</div>
      )}

      {/* Metrics */}
      {!loading && overallMetrics && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<UserGroupIcon className="h-6 w-6" />}
              label={labels.totalClients}
              value={overallMetrics.totalClients.toString()}
              color="blue"
            />
            <MetricCard
              icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
              label={labels.returnRate}
              value={`${overallMetrics.returnRate.toFixed(1)}%`}
              color="green"
            />
            <MetricCard
              icon={<UserIcon className="h-6 w-6" />}
              label={labels.returningClients}
              value={overallMetrics.returningClients.toString()}
              subtitle={`${labels.newClients}: ${overallMetrics.newClients}`}
              color="amber"
            />
            <MetricCard
              icon={<ChartBarIcon className="h-6 w-6" />}
              label={labels.avgVisits}
              value={overallMetrics.avgVisits.toFixed(1)}
              subtitle={`${labels.totalVisits}: ${overallMetrics.totalVisits}`}
              color="purple"
            />
          </div>

          {/* Return rate bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{labels.returnRate}</h3>
            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(overallMetrics.returnRate, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
                {overallMetrics.returnRate.toFixed(1)}% ({overallMetrics.returningClients} / {overallMetrics.totalClients})
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Immediate rebooking rate */}
          {immediateRebookingMetrics && immediateRebookingMetrics.totalGaps > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BoltIcon className="h-5 w-5 text-amber-500" />
                Natychmiastowa rezerwacja po wizycie
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Procent klientów, którzy zapisali się na następną wizytę w ciągu 7 lub 14 dni od ostatniej procedury
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <div className="text-3xl font-bold text-green-600">{immediateRebookingMetrics.immediateRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-600 mt-1">w ciągu 7 dni</div>
                  <div className="text-xs text-gray-400">({immediateRebookingMetrics.immediateGaps} z {immediateRebookingMetrics.totalGaps})</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{immediateRebookingMetrics.quickRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-600 mt-1">w ciągu 14 dni</div>
                  <div className="text-xs text-gray-400">({immediateRebookingMetrics.quickGaps} z {immediateRebookingMetrics.totalGaps})</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600">{immediateRebookingMetrics.totalGaps}</div>
                  <div className="text-xs text-gray-600 mt-1">powrotów łącznie</div>
                </div>
              </div>
              {/* Visual bar */}
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-blue-300 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(immediateRebookingMetrics.quickRate, 100)}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(immediateRebookingMetrics.immediateRate, 100)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                  <span className="bg-white/70 px-2 rounded">
                    7d: {immediateRebookingMetrics.immediateRate.toFixed(0)}% · 14d: {immediateRebookingMetrics.quickRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Per-service return time */}
          {serviceReturnMetrics.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-amber-500" />
                Średni czas powrotu wg usługi
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Średnia i mediana dni między wizytami tego samego klienta na tę samą usługę. Kolumna "Szybka rez." — procent powrotów w ciągu 7 dni.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">Usługa</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">Śr. dni</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">Mediana</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">Powroty</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">Klienci</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">Szybka rez.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceReturnMetrics.map((sm) => (
                      <tr key={sm.serviceName} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium text-gray-900 max-w-[200px] truncate" title={sm.serviceName}>
                          {sm.serviceName}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {sm.totalReturns > 0 ? (
                            <span className="font-semibold text-gray-700">
                              {sm.avgReturnDays.toFixed(0)}
                              <span className="text-xs text-gray-400 ml-1">
                                {sm.avgReturnDays >= 365
                                  ? `(~${(sm.avgReturnDays / 365).toFixed(1)} lat)`
                                  : sm.avgReturnDays >= 30
                                    ? `(~${(sm.avgReturnDays / 30).toFixed(1)} mies.)`
                                    : ''}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600">
                          {sm.totalReturns > 0 ? `${sm.medianReturnDays.toFixed(0)} d` : '—'}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600">{sm.totalReturns}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{sm.totalClients}</td>
                        <td className="py-3 px-2 text-center">
                          {sm.totalReturns > 0 ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              sm.immediateRebookRate >= 50
                                ? 'bg-green-100 text-green-800'
                                : sm.immediateRebookRate >= 20
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-600'
                            }`}>
                              {sm.immediateRebookRate.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per-stylist breakdown */}
          {stylistMetrics.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <StarIcon className="h-5 w-5 text-amber-500" />
                {labels.perStylist}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Kliknij na mastera, aby zobaczyć szczegółową analizę powrotów i utraconych klientów
              </p>

              {/* Stylist cards */}
              <div className="space-y-4">
                {stylistMetrics.map((sm, idx) => {
                  const isExpanded = expandedStylist === idx;
                  const lostTotal = sm.lostAfter1m + sm.lostAfter2m + sm.lostAfter3m;
                  const activeClients = sm.totalClients - lostTotal;

                  return (
                    <div
                      key={sm.name}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        isExpanded ? 'border-amber-300 shadow-md' : 'border-gray-200 hover:border-amber-200'
                      }`}
                    >
                      {/* Stylist header row */}
                      <div
                        className={`p-4 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-amber-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setExpandedStylist(isExpanded ? null : idx)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{sm.name}</div>
                              <div className="text-xs text-gray-500">
                                {sm.totalAppointments} rezerwacji · {sm.totalClients} klientów
                              </div>
                            </div>
                          </div>

                          {/* Key metrics inline */}
                          <div className="flex flex-wrap gap-3 text-sm">
                            <div className="text-center px-3">
                              <div className="font-bold text-green-600">{sm.returnRate.toFixed(0)}%</div>
                              <div className="text-[10px] text-gray-500">powroty</div>
                            </div>
                            <div className="text-center px-3">
                              <div className="font-bold text-blue-600">{sm.avgVisits.toFixed(1)}</div>
                              <div className="text-[10px] text-gray-500">śr. wizyt</div>
                            </div>
                            <div className="text-center px-3">
                              <div className="font-bold text-purple-600">
                                {sm.avgReturnDays > 0 ? `${sm.avgReturnDays.toFixed(0)}d` : '—'}
                              </div>
                              <div className="text-[10px] text-gray-500">śr. powrót</div>
                            </div>
                            {lostTotal > 0 && (
                              <div className="text-center px-3">
                                <div className="font-bold text-red-500">{lostTotal}</div>
                                <div className="text-[10px] text-gray-500">utraceni</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Return rate bar */}
                        <div className="mt-3 relative h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                            style={{ width: `${Math.min(sm.returnRate, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                          {/* Lost clients breakdown */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              Status klientów
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-green-600">{activeClients}</div>
                                <div className="text-[10px] text-gray-600">Aktywni</div>
                                <div className="text-[10px] text-gray-400">(&lt;30 dni)</div>
                              </div>
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-yellow-600">{sm.lostAfter1m}</div>
                                <div className="text-[10px] text-gray-600">Nie wrócili</div>
                                <div className="text-[10px] text-gray-400">30-60 dni</div>
                              </div>
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-orange-600">{sm.lostAfter2m}</div>
                                <div className="text-[10px] text-gray-600">Nie wrócili</div>
                                <div className="text-[10px] text-gray-400">60-90 dni</div>
                              </div>
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-red-600">{sm.lostAfter3m}</div>
                                <div className="text-[10px] text-gray-600">Utraceni</div>
                                <div className="text-[10px] text-gray-400">&gt;90 dni</div>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-blue-600">{sm.returningClients}</div>
                                <div className="text-[10px] text-gray-600">Powracający</div>
                                <div className="text-[10px] text-gray-400">2+ wizyty</div>
                              </div>
                            </div>

                            {/* Stacked bar: client status distribution */}
                            {sm.totalClients > 0 && (
                              <div className="mt-3">
                                <div className="flex h-4 rounded-full overflow-hidden">
                                  {activeClients > 0 && (
                                    <div
                                      className="bg-green-500"
                                      style={{ width: `${(activeClients / sm.totalClients) * 100}%` }}
                                      title={`Aktywni: ${activeClients}`}
                                    />
                                  )}
                                  {sm.lostAfter1m > 0 && (
                                    <div
                                      className="bg-yellow-400"
                                      style={{ width: `${(sm.lostAfter1m / sm.totalClients) * 100}%` }}
                                      title={`30-60 dni: ${sm.lostAfter1m}`}
                                    />
                                  )}
                                  {sm.lostAfter2m > 0 && (
                                    <div
                                      className="bg-orange-400"
                                      style={{ width: `${(sm.lostAfter2m / sm.totalClients) * 100}%` }}
                                      title={`60-90 dni: ${sm.lostAfter2m}`}
                                    />
                                  )}
                                  {sm.lostAfter3m > 0 && (
                                    <div
                                      className="bg-red-500"
                                      style={{ width: `${(sm.lostAfter3m / sm.totalClients) * 100}%` }}
                                      title={`>90 dni: ${sm.lostAfter3m}`}
                                    />
                                  )}
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                                  <span>Aktywni {((activeClients / sm.totalClients) * 100).toFixed(0)}%</span>
                                  <span>Utraceni {((lostTotal / sm.totalClients) * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Additional stats */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="text-xs text-gray-500">Śr. czas powrotu</div>
                              <div className="font-bold text-gray-800">
                                {sm.avgReturnDays > 0
                                  ? sm.avgReturnDays >= 30
                                    ? `${(sm.avgReturnDays / 30).toFixed(1)} mies.`
                                    : `${sm.avgReturnDays.toFixed(0)} dni`
                                  : '—'}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="text-xs text-gray-500">Powracalność</div>
                              <div className="font-bold text-gray-800">{sm.returnRate.toFixed(1)}%</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="text-xs text-gray-500">Śr. wizyty / klient</div>
                              <div className="font-bold text-gray-800">{sm.avgVisits.toFixed(1)}</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="text-xs text-gray-500">Prawidłowe powroty</div>
                              <div className="font-bold text-gray-800">{sm.onScheduleRate.toFixed(0)}%</div>
                            </div>
                          </div>

                          {/* Top clients */}
                          {sm.topClients.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-gray-600 mb-2">
                                {labels.topClientsForStylist}:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {sm.topClients.map((tc, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-xs"
                                  >
                                    <UserIcon className="h-3 w-3 text-gray-400" />
                                    <span className="font-medium">{tc.name}</span>
                                    <span className="text-amber-600 font-bold">×{tc.visits}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top returning clients */}
          {topReturningClients.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-amber-500" />
                {labels.topClients}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">#</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">{labels.name}</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">{labels.visitCount}</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700">{labels.lastVisit}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReturningClients.map((c, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-2 text-gray-400 font-medium">{i + 1}</td>
                        <td className="py-2.5 px-2 font-medium text-gray-900">{c.name}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            c.visits >= 10
                              ? 'bg-amber-100 text-amber-800'
                              : c.visits >= 5
                                ? 'bg-green-100 text-green-800'
                                : c.visits >= 2
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-600'
                          }`}>
                            {c.visits}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-gray-500">{formatDate(c.lastVisit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// --- Metric Card component ---
function MetricCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  color: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const iconColors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    amber: 'text-amber-500',
    purple: 'text-purple-500',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={iconColors[color]}>{icon}</span>
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
