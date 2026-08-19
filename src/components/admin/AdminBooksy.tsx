import React, { useState, useEffect } from 'react';
import { supabase, cleanOldEmailLogs } from '../../lib/supabase';
import { BooksyBooking, BooksyStylistMapping, BooksySyncLog, BooksySession, BooksyComplexService, Stylist } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { translations } from '../../i18n/translations';
import { format } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  PhoneIcon,
  EnvelopeIcon,
  InboxIcon,
  EyeIcon,
  EyeSlashIcon,
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const dateLocales = { pl, en: enUS, ru };

export const AdminBooksy: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const ab = (t as any).admin_booksy || {};
  const locale = dateLocales[language as keyof typeof dateLocales] || pl;

  const [mappings, setMappings] = useState<BooksyStylistMapping[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [bookings, setBookings] = useState<BooksyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailPage, setEmailPage] = useState(1);
  const [emailPageSize] = useState(20);
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingPageSize] = useState(20);

  // Complex services state
  const [complexServices, setComplexServices] = useState<BooksyComplexService[]>([]);
  const [showComplexModal, setShowComplexModal] = useState(false);
  const [editingComplex, setEditingComplex] = useState<BooksyComplexService | null>(null);
  const [complexServiceNameInput, setComplexServiceNameInput] = useState('');
  const [complexStylistIdInput, setComplexStylistIdInput] = useState('');
  const [complexIsActiveInput, setComplexIsActiveInput] = useState(true);
  const [complexNotesInput, setComplexNotesInput] = useState('');
  const [savingComplex, setSavingComplex] = useState(false);
  const [suggestedServiceNames, setSuggestedServiceNames] = useState<string[]>([]);

  // Email log state
  interface EmailLogEntry {
    id: string;
    received_at: string;
    from_address: string | null;
    subject: string | null;
    processing_status: string;
    rejection_reason: string | null;
    parsed_email_type: string | null;
    parsed_client_name: string | null;
    parsed_service_name: string | null;
    error_message: string | null;
    message_id: string | null;
    body_length: number | null;
    raw_html: string | null;
  }
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [showEmailLog, setShowEmailLog] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSync, setFilterSync] = useState<string>('all');

  // Mapping edit state
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [editingStylistId, setEditingStylistId] = useState<string>('');
  const [savingMapping, setSavingMapping] = useState(false);

  // Booksy sync state
  const [syncLogs, setSyncLogs] = useState<BooksySyncLog[]>([]);
  const [booksySession, setBooksySession] = useState<BooksySession | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [savingToken, setSavingToken] = useState(false);
  const [syncFilterStatus, setSyncFilterStatus] = useState<string>('all');

  // Resource ID editing
  const [editingResourceMappingId, setEditingResourceMappingId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string>('');
  const [savingResourceId, setSavingResourceId] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const clearOldLogs = async () => {
    setLoading(true);
    const { error } = await cleanOldEmailLogs(10);
    if (error) console.error('Cleanup error:', error);
    await loadData();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [mappingsRes, stylistsRes, bookingsRes, logsRes, syncLogsRes, sessionRes, complexRes, servicesRes] = await Promise.all([
        supabase
          .from('booksy_stylist_mapping')
          .select('*, stylists(name, image_url)')
          .order('booksy_name'),
        supabase.from('stylists').select('*').order('name'),
        supabase
          .from('booksy_bookings')
          .select('*, stylists(name)')
          .order('start_time', { ascending: false })
          .limit(200),
        supabase
          .from('booksy_email_log')
          .select('id, received_at, from_address, subject, processing_status, rejection_reason, parsed_email_type, parsed_client_name, parsed_service_name, error_message, message_id, body_length, raw_html')
          .order('received_at', { ascending: false })
          .limit(50),
        supabase
          .from('booksy_sync_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('booksy_session')
          .select('*')
          .eq('id', 'default')
          .maybeSingle(),
        supabase
          .from('booksy_complex_services')
          .select('*, stylists:additional_stylist_id(name, image_url)')
          .order('booksy_service_name'),
        supabase
          .from('services')
          .select('name')
          .order('name'),
      ]);

      if (mappingsRes.error) console.error('Error loading mappings:', mappingsRes.error);
      if (stylistsRes.error) console.error('Error loading stylists:', stylistsRes.error);
      if (bookingsRes.error) console.error('Error loading booksy bookings:', bookingsRes.error);
      if (logsRes.error) console.error('Error loading email logs:', logsRes.error);
      if (syncLogsRes.error) console.error('Error loading sync logs:', syncLogsRes.error);
      if (complexRes.error) console.error('Error loading complex services:', complexRes.error);

      if (mappingsRes.data) setMappings(mappingsRes.data);
      if (stylistsRes.data) setStylists(stylistsRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (logsRes.data) setEmailLogs(logsRes.data);
      if (syncLogsRes.data) setSyncLogs(syncLogsRes.data);
      if (complexRes.data) setComplexServices(complexRes.data as unknown as BooksyComplexService[]);
      setBooksySession(sessionRes.data as BooksySession | null);

      // Build suggested service names from services table + past booksy bookings
      const siteNames = (servicesRes.data || []).map((s) => s.name);
      const booksyNames = (bookingsRes.data || []).map((b) => b.booksy_service_name);
      const uniqueNames = Array.from(new Set([...siteNames, ...booksyNames])).filter(Boolean);
      setSuggestedServiceNames(uniqueNames);
    } finally {
      setLoading(false);
    }
  };

  // Complex service management handlers
  const openAddComplexModal = () => {
    setEditingComplex(null);
    setComplexServiceNameInput('');
    setComplexStylistIdInput(stylists[0]?.id || '');
    setComplexIsActiveInput(true);
    setComplexNotesInput('');
    setShowComplexModal(true);
  };

  const openEditComplexModal = (item: BooksyComplexService) => {
    setEditingComplex(item);
    setComplexServiceNameInput(item.booksy_service_name);
    setComplexStylistIdInput(item.additional_stylist_id);
    setComplexIsActiveInput(item.is_active);
    setComplexNotesInput(item.notes || '');
    setShowComplexModal(true);
  };

  const saveComplexService = async () => {
    const serviceName = complexServiceNameInput.trim();
    if (!serviceName || !complexStylistIdInput) {
      alert(language === 'pl' ? 'Podaj nazwę usługi i wybierz 2. stylistkę.' : 'Provide service name and select 2nd stylist.');
      return;
    }
    setSavingComplex(true);
    try {
      if (editingComplex) {
        const { error } = await supabase
          .from('booksy_complex_services')
          .update({
            booksy_service_name: serviceName,
            additional_stylist_id: complexStylistIdInput,
            is_active: complexIsActiveInput,
            notes: complexNotesInput.trim() || null,
          })
          .eq('id', editingComplex.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('booksy_complex_services')
          .insert({
            booksy_service_name: serviceName,
            additional_stylist_id: complexStylistIdInput,
            is_active: complexIsActiveInput,
            notes: complexNotesInput.trim() || null,
          });
        if (error) throw error;
      }
      setShowComplexModal(false);
      loadData();
    } catch (err: any) {
      console.error('Error saving complex service:', err);
      alert(err.message || 'Error saving complex service');
    } finally {
      setSavingComplex(false);
    }
  };

  const toggleComplexActive = async (item: BooksyComplexService) => {
    const { error } = await supabase
      .from('booksy_complex_services')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    if (error) console.error('Error toggling active state:', error);
    else loadData();
  };

  const deleteComplexService = async (id: string) => {
    if (!confirm(language === 'pl' ? 'Czy na pewno chcesz usunąć tę usługę kompleksową?' : 'Are you sure you want to delete this complex service?')) return;
    const { error } = await supabase
      .from('booksy_complex_services')
      .delete()
      .eq('id', id);
    if (error) console.error('Error deleting complex service:', error);
    else loadData();
  };

  const startEditMapping = (mapping: BooksyStylistMapping) => {
    setEditingMappingId(mapping.id);
    setEditingStylistId(mapping.stylist_id || '');
  };

  const cancelEditMapping = () => {
    setEditingMappingId(null);
    setEditingStylistId('');
  };

  const saveMapping = async (mapping: BooksyStylistMapping) => {
    setSavingMapping(true);
    try {
      const newStylistId = editingStylistId || null;

      const { error } = await supabase
        .from('booksy_stylist_mapping')
        .update({ stylist_id: newStylistId })
        .eq('id', mapping.id);

      if (error) {
        console.error('Error saving mapping:', error);
        return;
      }

      // Cascade: update all booksy_bookings with this worker name
      await supabase
        .from('booksy_bookings')
        .update({
          stylist_id: newStylistId,
          sync_status: newStylistId ? 'mapped' : 'unmapped',
        })
        .eq('booksy_worker_name', mapping.booksy_name);

      // Cascade: update linked time_slots stylist_id
      if (newStylistId) {
        const { data: relatedBookings } = await supabase
          .from('booksy_bookings')
          .select('time_slot_id')
          .eq('booksy_worker_name', mapping.booksy_name)
          .not('time_slot_id', 'is', null);

        if (relatedBookings) {
          const slotIds = relatedBookings
            .map((b) => b.time_slot_id)
            .filter(Boolean) as string[];
          if (slotIds.length > 0) {
            await supabase
              .from('time_slots')
              .update({ stylist_id: newStylistId })
              .in('id', slotIds);
          }
        }
      }

      setEditingMappingId(null);
      setEditingStylistId('');
      loadData();
    } finally {
      setSavingMapping(false);
    }
  };

  // Save access token from admin input
  const saveToken = async () => {
    setSavingToken(true);
    try {
      const token = tokenInput.trim();
      if (!token) {
        alert(language === 'pl' ? 'Wklej access token.' : 'Paste access token.');
        return;
      }

      const parts = token.split('|').map(s => s.trim());
      const accessToken = parts[0];
      const apiKey = parts[1] || '';

      const { error } = await supabase
        .from('booksy_session')
        .upsert({
          id: 'default',
          access_token: accessToken,
          api_key: apiKey || null,
          cookies: [],
          last_used_at: new Date().toISOString(),
          is_valid: true,
        });

      if (error) {
        console.error('Error saving token:', error);
        alert(language === 'pl' ? 'Błąd zapisu tokenu' : 'Error saving token');
        return;
      }

      setShowTokenModal(false);
      setTokenInput('');
      loadData();
    } finally {
      setSavingToken(false);
    }
  };

  // Save Booksy resource ID for a mapping
  const saveResourceId = async (mapping: BooksyStylistMapping) => {
    setSavingResourceId(true);
    try {
      const resId = editingResourceId ? parseInt(editingResourceId, 10) : null;
      const { error } = await supabase
        .from('booksy_stylist_mapping')
        .update({ booksy_resource_id: resId })
        .eq('id', mapping.id);

      if (error) {
        console.error('Error saving resource ID:', error);
        return;
      }

      setEditingResourceMappingId(null);
      setEditingResourceId('');
      loadData();
    } finally {
      setSavingResourceId(false);
    }
  };

  // Retry a failed sync
  const retrySyncItem = async (log: BooksySyncLog) => {
    const secret = import.meta.env.VITE_BOOKSY_SYNC_SECRET;
    if (!secret) {
      alert('VITE_BOOKSY_SYNC_SECRET not configured');
      return;
    }

    // Reset status to pending
    await supabase
      .from('booksy_sync_log')
      .update({ status: 'pending', error_message: null })
      .eq('id', log.id);

    // Fire background function
    fetch('/.netlify/functions/booksy-sync-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: log.action,
        bookingId: log.booking_id,
        startTime: log.start_time,
        endTime: log.end_time,
        stylistName: log.stylist_name || undefined,
        secret,
      }),
    }).catch(() => {});

    loadData();
  };

  // Filtered sync logs
  const filteredSyncLogs = syncLogs.filter((s) => {
    if (syncFilterStatus !== 'all' && s.status !== syncFilterStatus) return false;
    return true;
  });

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (filterSync !== 'all' && b.sync_status !== filterSync) return false;
    return true;
  });

  const pagedBookings = filteredBookings.slice((bookingPage - 1) * bookingPageSize, bookingPage * bookingPageSize);
  const pagedEmailLogs = emailLogs.slice((emailPage - 1) * emailPageSize, emailPage * emailPageSize);

  const unmappedCount = mappings.filter((m) => !m.stylist_id).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3" />
            {ab.statusActive || 'Active'}
          </span>
        );
      case 'changed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <ArrowPathIcon className="h-3 w-3" />
            {ab.statusChanged || 'Changed'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3" />
            {ab.statusCancelled || 'Cancelled'}
          </span>
        );
      default:
        return null;
    }
  };

  const getSyncBadge = (sync: string) => {
    switch (sync) {
      case 'mapped':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <LinkIcon className="h-3 w-3" />
            {ab.syncMapped || 'Synced'}
          </span>
        );
      case 'unmapped':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-3 w-3" />
            {ab.syncUnmapped || 'Unmapped'}
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3" />
            {ab.syncError || 'Error'}
          </span>
        );
      default:
        return null;
    }
  };

  const getEmailTypeBadge = (emailType: string) => {
    switch (emailType) {
      case 'new':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
            {ab.emailNew || 'New'}
          </span>
        );
      case 'changed':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            {ab.emailChanged || 'Change'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
            {ab.emailCancelled || 'Cancel'}
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <ArrowPathIcon className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{ab.title || 'Booksy'}</h2>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-4 w-4" />
          {ab.refreshData || 'Refresh'}
        </button>
      </div>

      {/* Email Log Section (Debug) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <InboxIcon className="h-5 w-5 text-amber-500" />
            Email Log
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {emailLogs.length}
            </span>
          </h3>
          <button
            onClick={() => setShowEmailLog(!showEmailLog)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
          >
            {showEmailLog ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            {showEmailLog ? 'Ukryj' : 'Pokaż'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {language === 'pl'
            ? 'Każdy email przychodzący do webhooka jest tutaj logowany — nawet jeśli nie przeszedł walidacji.'
            : language === 'ru'
              ? 'Каждое письмо, поступающее в вебхук, логируется здесь — даже если не прошло валидацию.'
              : 'Every email hitting the webhook is logged here — even if it fails validation.'}
        </p>

        {showEmailLog && (
          emailLogs.length === 0 ? (
            <div className="text-center py-8">
              <InboxIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {language === 'pl'
                  ? 'Brak logów — żaden email jeszcze nie dotarł do webhooka'
                  : language === 'ru'
                    ? 'Нет логов — ни одно письмо ещё не пришло в вебхук'
                    : 'No logs yet — no emails have reached the webhook'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {language === 'pl' ? 'Czas' : 'Time'}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {language === 'pl' ? 'Od' : 'From'}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {language === 'pl' ? 'Temat' : 'Subject'}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {language === 'pl' ? 'Wynik' : 'Result'}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      HTML
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* pagedEmailLogs defined earlier */}
                
                {pagedEmailLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr
                        className={
                          log.processing_status === 'processed'
                            ? 'bg-green-50'
                            : log.processing_status === 'rejected'
                              ? 'bg-gray-50'
                              : log.processing_status === 'parse_error'
                                ? 'bg-red-50'
                                : 'bg-blue-50'
                        }
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {format(new Date(log.received_at), 'dd.MM HH:mm:ss', { locale })}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 max-w-[150px] truncate">
                          {log.from_address || '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 max-w-[200px] truncate font-medium">
                          {log.subject || '(brak)'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.processing_status === 'processed'
                                ? 'bg-green-100 text-green-800'
                                : log.processing_status === 'rejected'
                                  ? 'bg-gray-200 text-gray-700'
                                  : log.processing_status === 'parse_error'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.processing_status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          {log.processing_status === 'processed' && (
                            <span>
                              {log.parsed_email_type} — {log.parsed_client_name} — {log.parsed_service_name}
                            </span>
                          )}
                          {log.processing_status === 'rejected' && (
                            <span className="text-gray-500">{log.rejection_reason}</span>
                          )}
                          {log.processing_status === 'parse_error' && (
                            <span className="text-red-600">{log.error_message}</span>
                          )}
                          {log.processing_status === 'received' && (
                            <span className="text-blue-600">
                              {language === 'pl' ? 'W trakcie...' : 'Processing...'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {log.raw_html && (
                            <button
                              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                              className="text-xs text-amber-600 hover:text-amber-700 underline"
                            >
                              {expandedLogId === log.id ? 'Ukryj' : `${(log.body_length || 0).toLocaleString()} B`}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedLogId === log.id && log.raw_html && (
                        <tr>
                          <td colSpan={6} className="px-3 py-3 bg-gray-50">
                            <div className="max-h-64 overflow-auto rounded border border-gray-200 bg-white p-3">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
                                {log.raw_html.substring(0, 5000)}
                                {(log.raw_html.length || 0) > 5000 && '\n\n... (truncated)'}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {/* Pagination controls for Email Log */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            {emailPage} / {Math.ceil(emailLogs.length / emailPageSize)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setEmailPage(p => Math.max(p - 1, 1))}
              disabled={emailPage === 1}
              className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
            >
              {ab.prev || 'Prev'}
            </button>
            <button
              onClick={() => setEmailPage(p => p + 1)}
              disabled={emailPage >= Math.ceil(emailLogs.length / emailPageSize)}
              className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
            >
              {ab.next || 'Next'}
            </button>
          </div>
        </div>
        {/* Clear old logs button */}
        <div className="mt-4">
          <button
            onClick={clearOldLogs}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded hover:bg-amber-600"
          >
            {ab.clearOldLogs || 'Clear logs >10 days'}
          </button>
        </div>
      </div>

      {/* Stylist Mapping Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-amber-500" />
            {ab.mappingsTitle || 'Stylist Mapping'}
            {unmappedCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {unmappedCount} {ab.unmappedWarning || 'unmapped'}
              </span>
            )}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {ab.mappingsDesc || 'Link Booksy worker names to your stylists'}
          </p>
        </div>

        {mappings.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            {language === 'pl'
              ? 'Brak mapowań — pojawią się automatycznie po pierwszym emailu z Booksy'
              : language === 'ru'
                ? 'Нет сопоставлений — появятся автоматически после первого письма из Booksy'
                : 'No mappings yet — they will appear automatically after the first Booksy email'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.booksyName || 'Booksy Name'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.linkedStylist || 'Linked Stylist'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booksy Resource ID
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mappings.map((mapping) => (
                  <tr key={mapping.id} className={!mapping.stylist_id ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{mapping.booksy_name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingMappingId === mapping.id ? (
                        <select
                          value={editingStylistId}
                          onChange={(e) => setEditingStylistId(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                        >
                          <option value="">{ab.selectStylist || 'Select stylist'}</option>
                          {stylists.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : mapping.stylists ? (
                        <span className="text-gray-700">{mapping.stylists.name}</span>
                      ) : (
                        <span className="text-yellow-600 italic">
                          {ab.notMapped || 'Not mapped'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingResourceMappingId === mapping.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingResourceId}
                            onChange={(e) => setEditingResourceId(e.target.value)}
                            placeholder="np. 326252"
                            className="w-28 rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                          />
                          <button
                            onClick={() => saveResourceId(mapping)}
                            disabled={savingResourceId}
                            className="px-2 py-1 text-xs font-medium text-white bg-amber-500 rounded hover:bg-amber-600 disabled:opacity-50"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => { setEditingResourceMappingId(null); setEditingResourceId(''); }}
                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingResourceMappingId(mapping.id);
                            setEditingResourceId(mapping.booksy_resource_id?.toString() || '');
                          }}
                          className="text-sm font-mono text-gray-600 hover:text-amber-600"
                        >
                          {mapping.booksy_resource_id || (
                            <span className="text-yellow-600 italic text-xs">
                              {language === 'pl' ? 'ustaw' : 'set'}
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {editingMappingId === mapping.id ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => saveMapping(mapping)}
                            disabled={savingMapping}
                            className="px-3 py-1 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600 disabled:opacity-50"
                          >
                            {ab.save || 'Save'}
                          </button>
                          <button
                            onClick={cancelEditMapping}
                            className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditMapping(mapping)}
                          className="px-3 py-1 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md"
                        >
                          {mapping.stylist_id
                            ? (language === 'pl' ? 'Zmień' : language === 'ru' ? 'Изменить' : 'Change')
                            : (language === 'pl' ? 'Przypisz' : language === 'ru' ? 'Привязать' : 'Link')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complex Services Mapping Section (Usługi Kompleksowe) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-amber-500" />
              {ab.complexServicesTitle || 'Usługi Kompleksowe (Podwójna Obsada)'}
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {complexServices.length}
              </span>
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {ab.complexServicesDesc || 'Skonfiguruj dodatkowego pracownika dla usług wymagających rezerwacji 2 stylistek jednocześnie.'}
            </p>
          </div>

          <button
            onClick={openAddComplexModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            {ab.addComplexService || 'Dodaj usługę kompleksową'}
          </button>
        </div>

        {complexServices.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <UsersIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">
              {ab.noComplexServices || 'Brak skonfigurowanych usług kompleksowych'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Kliknij przycisk wyżej, aby zmapować usługę Booksy do drugiej stylistki.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.serviceNameInBooksy || 'Nazwa usługi w Booksy'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.additionalStylist || 'Dodatkowy pracownik (2. stylistka)'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.notes || 'Uwagi'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complexServices.map((item) => (
                  <tr key={item.id} className={!item.is_active ? 'bg-gray-50 opacity-75' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{item.booksy_service_name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {item.stylists?.image_url && (
                          <img src={item.stylists.image_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        )}
                        <span className="text-sm font-medium text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          {item.stylists?.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => toggleComplexActive(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          item.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-green-600' : 'bg-gray-500'}`} />
                        {item.is_active ? (ab.statusActiveLabel || 'Aktywna') : (ab.statusInactiveLabel || 'Nieaktywna')}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {item.notes || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditComplexModal(item)}
                          className="p-1 text-gray-500 hover:text-amber-600 rounded hover:bg-amber-50"
                          title="Edytuj"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteComplexService(item.id)}
                          className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-red-50"
                          title="Usuń"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booksy Bookings Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {ab.bookingsTitle || 'Booksy Bookings'}
          </h3>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
            >
              <option value="all">{ab.allStatuses || 'All statuses'}</option>
              <option value="active">{ab.statusActive || 'Active'}</option>
              <option value="changed">{ab.statusChanged || 'Changed'}</option>
              <option value="cancelled">{ab.statusCancelled || 'Cancelled'}</option>
            </select>

            <select
              value={filterSync}
              onChange={(e) => setFilterSync(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
            >
              <option value="all">{ab.allSync || 'All'}</option>
              <option value="mapped">{ab.syncMapped || 'Synced'}</option>
              <option value="unmapped">{ab.syncUnmapped || 'Unmapped'}</option>
              <option value="error">{ab.syncError || 'Error'}</option>
            </select>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            {ab.noBookings || 'No Booksy bookings'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.emailType || 'Type'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.client || 'Client'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.service || 'Service'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.dateTime || 'Date & Time'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.stylist || 'Stylist'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.status || 'Status'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.syncStatus || 'Sync'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className={
                      booking.sync_status === 'error'
                        ? 'bg-red-50'
                        : booking.status === 'cancelled'
                          ? 'bg-gray-50'
                          : booking.sync_status === 'unmapped'
                            ? 'bg-yellow-50'
                            : ''
                    }
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      {getEmailTypeBadge(booking.email_type)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.booksy_client_name}
                      </div>
                      <div className="flex gap-3 mt-0.5">
                        {booking.booksy_client_phone && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <PhoneIcon className="h-3 w-3" />
                            {booking.booksy_client_phone}
                          </span>
                        )}
                        {booking.booksy_client_email && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <EnvelopeIcon className="h-3 w-3" />
                            {booking.booksy_client_email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900">{booking.booksy_service_name}</div>
                      {booking.booksy_price_text && (
                        <div className="text-xs text-gray-500">{booking.booksy_price_text}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(booking.start_time), 'dd MMM yyyy', { locale })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(booking.start_time), 'HH:mm')} –{' '}
                        {format(new Date(booking.end_time), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      {booking.stylists?.name || booking.booksy_worker_name || '—'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{getStatusBadge(booking.status)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{getSyncBadge(booking.sync_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls for Bookings */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            {bookingPage} / {Math.ceil(filteredBookings.length / bookingPageSize)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setBookingPage(p => Math.max(p - 1, 1))}
              disabled={bookingPage === 1}
              className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setBookingPage(p => p + 1)}
              disabled={bookingPage >= Math.ceil(filteredBookings.length / bookingPageSize)}
              className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ====== Booksy API Session ====== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-amber-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          {language === 'pl' ? 'Sesja Booksy API' : language === 'ru' ? 'Сессия Booksy API' : 'Booksy API Session'}
        </h3>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-full ${
              booksySession?.is_valid && booksySession?.access_token
                ? 'bg-green-500'
                : booksySession
                  ? 'bg-red-500'
                  : 'bg-gray-400'
            }`} />
            <span className="text-sm font-medium text-gray-700">
              {booksySession?.is_valid && booksySession?.access_token
                ? (language === 'pl' ? 'Token aktywny' : language === 'ru' ? 'Токен активен' : 'Token active')
                : booksySession?.access_token
                  ? (language === 'pl' ? 'Token wygasł' : language === 'ru' ? 'Токен истёк' : 'Token expired')
                  : (language === 'pl' ? 'Brak tokenu' : language === 'ru' ? 'Нет токена' : 'No token')}
            </span>
          </div>

          {booksySession?.last_used_at && (
            <span className="text-xs text-gray-500">
              {language === 'pl' ? 'Ostatnio użyta' : 'Last used'}:{' '}
              {format(new Date(booksySession.last_used_at), 'dd.MM.yyyy HH:mm', { locale })}
            </span>
          )}

          {booksySession?.access_token && (
            <span className="text-xs text-gray-400 font-mono">
              {booksySession.access_token.substring(0, 8)}...
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowTokenModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600"
          >
            {language === 'pl' ? 'Wklej token' : language === 'ru' ? 'Вставить токен' : 'Paste token'}
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          {language === 'pl'
            ? 'Booksy Pro → F12 → Network → Fetch/XHR → dowolny request API → Headers → x-access-token → skopiuj wartość'
            : language === 'ru'
              ? 'Booksy Pro → F12 → Network → Fetch/XHR → любой API запрос → Headers → x-access-token → скопируйте значение'
              : 'Booksy Pro → F12 → Network → Fetch/XHR → any API request → Headers → x-access-token → copy value'}
        </p>
      </div>

      {/* Token Paste Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'pl' ? 'Wklej x-access-token i x-api-key z Booksy Pro' : 'Paste x-access-token and x-api-key from Booksy Pro'}
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              {language === 'pl'
                ? 'W Chrome na stronie Booksy Pro: F12 → Network → kliknij na dowolny request do pl.booksy.com → Headers → skopiuj wartość x-access-token'
                : 'In Chrome on Booksy Pro: F12 → Network → click any request to pl.booksy.com → Headers → copy x-access-token value'}
            </p>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="np. FducqLl8VD7Xemsl7Wp97dpZtd0JvwUt"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm font-mono"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowTokenModal(false); setTokenInput(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {language === 'pl' ? 'Anuluj' : 'Cancel'}
              </button>
              <button
                onClick={saveToken}
                disabled={savingToken || !tokenInput.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {savingToken
                  ? (language === 'pl' ? 'Zapisywanie...' : 'Saving...')
                  : (language === 'pl' ? 'Zapisz' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Sync to Booksy Log ====== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 text-amber-500" />
            {language === 'pl' ? 'Sync do Booksy' : language === 'ru' ? 'Синхронизация с Booksy' : 'Sync to Booksy'}
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {syncLogs.length}
            </span>
          </h3>

          <select
            value={syncFilterStatus}
            onChange={(e) => setSyncFilterStatus(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
          >
            <option value="all">{language === 'pl' ? 'Wszystkie' : 'All'}</option>
            <option value="pending">{language === 'pl' ? 'Oczekujące' : 'Pending'}</option>
            <option value="processing">{language === 'pl' ? 'W trakcie' : 'Processing'}</option>
            <option value="success">{language === 'pl' ? 'Sukces' : 'Success'}</option>
            <option value="failed">{language === 'pl' ? 'Błąd' : 'Failed'}</option>
          </select>
        </div>

        {filteredSyncLogs.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            {language === 'pl' ? 'Brak logów synchronizacji' : 'No sync logs'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {language === 'pl' ? 'Czas' : 'Time'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {language === 'pl' ? 'Akcja' : 'Action'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {language === 'pl' ? 'Termin' : 'Slot'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {language === 'pl' ? 'Stylistka' : 'Stylist'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {language === 'pl' ? 'Błąd' : 'Error'}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSyncLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={
                      log.status === 'failed' ? 'bg-red-50'
                        : log.status === 'success' ? 'bg-green-50'
                          : log.status === 'processing' ? 'bg-blue-50'
                            : ''
                    }
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      {format(new Date(log.created_at), 'dd.MM HH:mm', { locale })}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.action === 'create_block' ? 'bg-green-100 text-green-800'
                          : log.action === 'update_block' ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {log.action === 'create_block'
                          ? (language === 'pl' ? 'Blokada' : 'Block')
                          : log.action === 'update_block'
                            ? (language === 'pl' ? 'Zmiana' : 'Update')
                            : (language === 'pl' ? 'Usunięcie' : 'Remove')}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {format(new Date(log.start_time), 'dd MMM HH:mm', { locale })} –{' '}
                      {format(new Date(log.end_time), 'HH:mm')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {log.stylist_name || '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'success' ? 'bg-green-100 text-green-800'
                          : log.status === 'failed' ? 'bg-red-100 text-red-800'
                            : log.status === 'processing' ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                      }`}>
                        {log.status === 'success' && <CheckCircleIcon className="h-3 w-3" />}
                        {log.status === 'failed' && <XCircleIcon className="h-3 w-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-red-600 max-w-[200px] truncate" title={log.error_message || ''}>
                      {log.error_message || '—'}
                      {log.screenshot_url && (
                        <a
                          href={log.screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-amber-600 underline hover:text-amber-700"
                        >
                          screenshot
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {log.status === 'failed' && (
                        <button
                          onClick={() => retrySyncItem(log)}
                          className="px-2 py-1 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded"
                        >
                          {language === 'pl' ? 'Ponów' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complex Service Add/Edit Modal */}
      {showComplexModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-amber-500" />
              {editingComplex
                ? (language === 'pl' ? 'Edytuj usługę kompleksową' : language === 'ru' ? 'Редактировать комплексную услугу' : 'Edit complex service')
                : (ab.addComplexService || 'Dodaj usługę kompleksową')}
            </h4>

            <div className="space-y-4">
              {/* Service name with datalist suggestions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ab.serviceNameInBooksy || 'Nazwa usługi w Booksy'}
                </label>
                <input
                  type="text"
                  list="complex-service-suggestions"
                  value={complexServiceNameInput}
                  onChange={(e) => setComplexServiceNameInput(e.target.value)}
                  placeholder={language === 'pl' ? 'np. Uzupełnienie 1-1:2' : 'e.g. Touch-up 1-1:2'}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                />
                <datalist id="complex-service-suggestions">
                  {suggestedServiceNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-400 mt-1">
                  {language === 'pl'
                    ? 'Wpisz nazwę usługi dokładnie tak jak pojawia się w emailach z Booksy'
                    : 'Type the service name exactly as it appears in Booksy emails'}
                </p>
              </div>

              {/* Additional stylist select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ab.additionalStylist || 'Dodatkowy pracownik (2. stylistka)'}
                </label>
                <select
                  value={complexStylistIdInput}
                  onChange={(e) => setComplexStylistIdInput(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                >
                  <option value="">{ab.selectStylist || 'Wybierz stylistkę'}</option>
                  {stylists.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={complexIsActiveInput}
                    onChange={(e) => setComplexIsActiveInput(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-amber-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
                <span className="text-sm text-gray-700">
                  {complexIsActiveInput
                    ? (ab.statusActiveLabel || 'Aktywna')
                    : (ab.statusInactiveLabel || 'Nieaktywna')}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ab.notes || 'Uwagi / Opis'}
                </label>
                <textarea
                  value={complexNotesInput}
                  onChange={(e) => setComplexNotesInput(e.target.value)}
                  rows={2}
                  placeholder={language === 'pl' ? 'np. Potrzebna asystentka podczas zabiegu' : 'e.g. Assistant needed during treatment'}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowComplexModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {language === 'pl' ? 'Anuluj' : 'Cancel'}
              </button>
              <button
                onClick={saveComplexService}
                disabled={savingComplex || !complexServiceNameInput.trim() || !complexStylistIdInput}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {savingComplex
                  ? (language === 'pl' ? 'Zapisywanie...' : 'Saving...')
                  : (ab.save || 'Zapisz')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
