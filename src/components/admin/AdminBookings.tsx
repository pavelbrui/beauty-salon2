import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Booking, Service, Stylist } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { translations } from '../../i18n/translations';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface AdminBooking extends Booking {
  user_email?: string;
}

const dateLocales = { pl, en: enUS, ru };

export const AdminBookings: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const ab = (t as any).admin_bookings || {};
  const locale = dateLocales[language as keyof typeof dateLocales] || pl;

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStylist, setFilterStylist] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));

  // Edit modal
  const [editingBooking, setEditingBooking] = useState<AdminBooking | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editStylist, setEditStylist] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, servicesRes, stylistsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            services (name, price, duration),
            time_slots (start_time, end_time),
            stylists (name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('services').select('*').order('name'),
        supabase.from('stylists').select('*').order('name')
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (stylistsRes.error) throw stylistsRes.error;

      // Fetch user emails for bookings
      const userIds = [...new Set((bookingsRes.data || []).map(b => b.user_id).filter(Boolean))];
      let emailMap: Record<string, string> = {};

      if (userIds.length > 0) {
        // Try to get emails from auth - admin might not have access, so handle gracefully
        for (const uid of userIds) {
          try {
            const { data } = await supabase.rpc('get_user_email', { user_uid: uid });
            if (data) emailMap[uid] = data;
          } catch {
            // RPC might not exist - skip
          }
        }
      }

      const enriched = (bookingsRes.data || []).map(b => ({
        ...b,
        user_email: emailMap[b.user_id] || b.user_id?.slice(0, 8) + '...'
      }));

      setBookings(enriched);
      setServices(servicesRes.data || []);
      setStylists(stylistsRes.data || []);
    } catch (err) {
      console.error('Error loading admin bookings data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (filterStylist !== 'all' && b.stylist_id !== filterStylist) return false;
      if (filterService !== 'all' && b.service_id !== filterService) return false;
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      return true;
    });
  }, [bookings, filterStylist, filterService, filterStatus]);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarMonth]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, AdminBooking[]> = {};
    filteredBookings.forEach(b => {
      const startTime = b.time_slots?.start_time || b.start_time;
      if (!startTime) return;
      const dateKey = format(new Date(startTime), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(b);
    });
    // Sort bookings within each day by time
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => {
        const ta = a.time_slots?.start_time || a.start_time || '';
        const tb = b.time_slots?.start_time || b.start_time || '';
        return ta.localeCompare(tb);
      })
    );
    return map;
  }, [filteredBookings]);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return {
        date: format(date, 'd MMMM yyyy', { locale }),
        time: format(date, 'HH:mm'),
        dayOfWeek: format(date, 'EEEE', { locale }),
        short: format(date, 'dd.MM.yyyy HH:mm')
      };
    } catch {
      return null;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: ab.statusConfirmed || 'Potwierdzona' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: ab.statusCancelled || 'Anulowana' };
      default:
        return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: ab.statusPending || 'Oczekuje' };
    }
  };

  // Edit handlers
  const openEdit = (booking: AdminBooking) => {
    setEditingBooking(booking);
    setEditStatus(booking.status);
    setEditStylist(booking.stylist_id || '');
  };

  const saveEdit = async () => {
    if (!editingBooking) return;
    setSaving(true);

    try {
      const updates: Record<string, any> = { status: editStatus };
      if (editStylist) updates.stylist_id = editStylist;

      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', editingBooking.id);

      if (error) throw error;

      // If cancelled, free the time slot
      if (editStatus === 'cancelled' && editingBooking.status !== 'cancelled') {
        const slotId = editingBooking.time_slot_id || editingBooking.timeSlotId;
        if (slotId) {
          await supabase
            .from('time_slots')
            .update({ is_available: true })
            .eq('id', slotId);
        }
      }

      setEditingBooking(null);
      loadData();
    } catch (err) {
      console.error('Error updating booking:', err);
    } finally {
      setSaving(false);
    }
  };

  const hasActiveFilters = filterStylist !== 'all' || filterService !== 'all' || filterStatus !== 'all';

  const clearFilters = () => {
    setFilterStylist('all');
    setFilterService('all');
    setFilterStatus('all');
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      return format(day, 'EEEEEE', { locale });
    });
  }, [locale]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: Filters + View Toggle */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* View toggle + count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {ab.title || 'Rezerwacje'}
            </h2>
            <span className="text-sm text-gray-500">
              ({filteredBookings.length}{bookings.length !== filteredBookings.length ? ` / ${bookings.length}` : ''})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={ab.listView || 'Lista'}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'calendar' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={ab.calendarView || 'Kalendarz'}
            >
              <CalendarDaysIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <FunnelIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />

          {/* Stylist filter */}
          <select
            value={filterStylist}
            onChange={e => setFilterStylist(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="all">{ab.allStylists || 'Wszystkie stylistki'}</option>
            {stylists.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Service filter */}
          <select
            value={filterService}
            onChange={e => setFilterService(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="all">{ab.allServices || 'Wszystkie zabiegi'}</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="all">{ab.allStatuses || 'Wszystkie statusy'}</option>
            <option value="pending">{ab.statusPending || 'Oczekuje'}</option>
            <option value="confirmed">{ab.statusConfirmed || 'Potwierdzona'}</option>
            <option value="cancelled">{ab.statusCancelled || 'Anulowana'}</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              {ab.clearFilters || 'Wyczyść filtry'}
            </button>
          )}
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <CalendarDaysIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{ab.noBookings || 'Brak rezerwacji'}</p>
            </div>
          ) : (
            filteredBookings.map(booking => {
              const startTime = booking.time_slots?.start_time || booking.start_time;
              const endTime = booking.time_slots?.end_time || booking.end_time;
              const dateInfo = formatDateTime(startTime);
              const endInfo = formatDateTime(endTime);
              const statusConfig = getStatusConfig(booking.status);
              const price = booking.services?.price;
              const duration = booking.services?.duration;

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${
                    booking.status === 'cancelled'
                      ? 'border-l-red-400 opacity-70'
                      : booking.status === 'confirmed'
                      ? 'border-l-green-400'
                      : 'border-l-amber-400'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Booking info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {booking.services?.name || '—'}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                          {dateInfo && (
                            <div className="flex items-center gap-1.5">
                              <CalendarDaysIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              <span className="capitalize truncate">{dateInfo.dayOfWeek}, {dateInfo.date}</span>
                            </div>
                          )}

                          {dateInfo && (
                            <div className="flex items-center gap-1.5">
                              <ClockIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              <span>
                                {dateInfo.time}
                                {endInfo ? ` – ${endInfo.time}` : ''}
                                {duration ? ` (${duration} min)` : ''}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            <span className="truncate">
                              {booking.stylists?.name || (ab.noStylist || 'Brak stylistki')}
                            </span>
                          </div>

                          {price != null && (
                            <div className="flex items-center gap-1.5">
                              <CurrencyDollarIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              <span className="font-medium">{(price / 100).toFixed(0)} PLN</span>
                            </div>
                          )}
                        </div>

                        {/* Client info */}
                        <div className="mt-2 text-xs text-gray-400">
                          {ab.client || 'Klient'}: {booking.user_email || '—'}
                        </div>

                        {!dateInfo && (
                          <p className="text-sm text-gray-400 mt-1">
                            {ab.noDateInfo || 'Brak informacji o terminie'}
                          </p>
                        )}
                      </div>

                      {/* Edit button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => openEdit(booking)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                          {ab.edit || 'Edytuj'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow">
          {/* Calendar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {format(calendarMonth, 'LLLL yyyy', { locale })}
            </h3>
            <button
              onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((day, i) => (
              <div key={i} className="py-2 text-center text-xs font-medium text-gray-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayBookings = bookingsByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, calendarMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r border-gray-100 p-1 ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 px-1 ${
                    isToday
                      ? 'bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                      : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map(b => {
                      const sc = getStatusConfig(b.status);
                      const time = b.time_slots?.start_time || b.start_time;
                      const timeStr = time ? format(new Date(time), 'HH:mm') : '';

                      return (
                        <button
                          key={b.id}
                          onClick={() => openEdit(b)}
                          className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate ${sc.bg} ${sc.text} hover:opacity-80 transition-opacity`}
                          title={`${timeStr} ${b.services?.name || ''} - ${b.stylists?.name || ''}`}
                        >
                          <span className="font-medium">{timeStr}</span>{' '}
                          {b.services?.name || ''}
                        </button>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-gray-400 px-1">
                        +{dayBookings.length - 3} {ab.more || 'więcej'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {ab.editBooking || 'Edytuj rezerwację'}
                </h2>
                <button
                  onClick={() => setEditingBooking(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Booking details (read-only) */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">{ab.service || 'Zabieg'}:</span>{' '}
                  <span className="font-medium text-gray-900">{editingBooking.services?.name || '—'}</span>
                </div>
                {(() => {
                  const st = editingBooking.time_slots?.start_time || editingBooking.start_time;
                  const et = editingBooking.time_slots?.end_time || editingBooking.end_time;
                  const di = formatDateTime(st);
                  const ei = formatDateTime(et);
                  return di ? (
                    <div className="text-sm">
                      <span className="text-gray-500">{ab.dateTime || 'Termin'}:</span>{' '}
                      <span className="font-medium text-gray-900 capitalize">
                        {di.dayOfWeek}, {di.date}, {di.time}
                        {ei ? ` – ${ei.time}` : ''}
                      </span>
                    </div>
                  ) : null;
                })()}
                <div className="text-sm">
                  <span className="text-gray-500">{ab.client || 'Klient'}:</span>{' '}
                  <span className="font-medium text-gray-900">{editingBooking.user_email || '—'}</span>
                </div>
                {editingBooking.services?.price != null && (
                  <div className="text-sm">
                    <span className="text-gray-500">{ab.price || 'Cena'}:</span>{' '}
                    <span className="font-medium text-gray-900">{(editingBooking.services.price / 100).toFixed(0)} PLN</span>
                  </div>
                )}
              </div>

              {/* Edit: Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ab.status || 'Status'}
                </label>
                <div className="flex gap-2">
                  {(['pending', 'confirmed', 'cancelled'] as const).map(status => {
                    const sc = getStatusConfig(status);
                    return (
                      <button
                        key={status}
                        onClick={() => setEditStatus(status)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          editStatus === status
                            ? `${sc.bg} ${sc.text} border-current`
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Edit: Stylist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ab.stylist || 'Stylistka'}
                </label>
                <select
                  value={editStylist}
                  onChange={e => setEditStylist(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">{ab.noStylist || 'Brak stylistki'}</option>
                  {stylists.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingBooking(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {ab.cancelEdit || 'Anuluj'}
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                {ab.save || 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
