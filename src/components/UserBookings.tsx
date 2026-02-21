import React, { useState, useEffect, useMemo } from 'react';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { supabase } from '../lib/supabase';
import { notifyAdmin, notifyClient } from '../lib/notifications';
import { Booking, Service, TimeSlot } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getServiceName } from '../utils/serviceTranslation';
import { AdvancedBookingCalendar } from './Calendar/AdvancedBookingCalendar';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, startOfDay, isBefore } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { QuickBookingPopup } from './QuickBookingPopup';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  TrashIcon,
  SparklesIcon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const dateLocales = { pl, en: enUS, ru };

type BookingFilter = 'all' | 'active' | 'past';

export const UserBookings: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useLocalizedNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleService, setRescheduleService] = useState<Service | null>(null);
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [quickBookDate, setQuickBookDate] = useState<Date | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services (name, name_en, name_ru, price, duration),
        time_slots (start_time, end_time),
        stylists (name)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const cancelBooking = async (bookingId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const booking = bookings.find(b => b.id === bookingId);
    const slotId = booking?.time_slot_id || booking?.timeSlotId;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error cancelling booking:', error);
      return;
    }

    if (slotId) {
      await supabase
        .from('time_slots')
        .update({ is_available: true })
        .eq('id', slotId);
    }

    const startTime = booking?.time_slots?.start_time || booking?.start_time;
    const dateStr = startTime ? format(new Date(startTime), 'dd.MM.yyyy HH:mm') : '—';
    await notifyAdmin(
      bookingId,
      'cancelled',
      `Klient anulował rezerwację: ${booking?.services?.name || '—'} na ${dateStr}`
    );
    await notifyClient(bookingId, 'status_update');

    loadBookings();
  };

  const deleteBooking = async (bookingId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const booking = bookings.find(b => b.id === bookingId);

    await notifyAdmin(
      bookingId,
      'deleted',
      `Klient usunął rezerwację: ${booking?.services?.name || '—'}`
    );
    await notifyClient(bookingId, 'status_update');

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting booking:', error);
      return;
    }

    loadBookings();
  };

  const rebookService = (booking: Booking) => {
    const serviceId = booking.service_id || booking.serviceId;
    if (serviceId) navigate(`/booking/${serviceId}`);
  };

  const openReschedule = async (booking: Booking) => {
    const serviceId = booking.service_id || booking.serviceId;
    if (!serviceId) return;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error || !data) return;

    setRescheduleService(data);
    setRescheduleBooking(booking);
  };

  const handleRescheduleSlot = async (slot: TimeSlot) => {
    if (!rescheduleBooking) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data: newSlot, error: slotError } = await supabase
        .from('time_slots')
        .insert({
          stylist_id: slot.stylistId,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_available: false
        })
        .select('id')
        .single();

      if (slotError || !newSlot) return;

      const oldSlotId = rescheduleBooking.time_slot_id || rescheduleBooking.timeSlotId;
      if (oldSlotId) {
        await supabase
          .from('time_slots')
          .update({ is_available: true })
          .eq('id', oldSlotId);
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          time_slot_id: newSlot.id,
          stylist_id: slot.stylistId,
          start_time: slot.startTime,
          end_time: slot.endTime,
          status: 'pending'
        })
        .eq('id', rescheduleBooking.id)
        .eq('user_id', session.user.id);

      if (updateError) return;

      const newDateStr = format(new Date(slot.startTime), 'dd.MM.yyyy HH:mm');
      await notifyAdmin(
        rescheduleBooking.id,
        'rescheduled',
        `Klient zmienił termin rezerwacji: ${rescheduleBooking.services?.name || '—'} → nowy termin: ${newDateStr}`
      );
      await notifyClient(rescheduleBooking.id, 'status_update');

      setRescheduleBooking(null);
      setRescheduleService(null);
      loadBookings();
    } catch (err) {
      console.error('Reschedule error:', err);
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const locale = dateLocales[language as keyof typeof dateLocales] || pl;
      return {
        date: format(date, 'd MMMM yyyy', { locale }),
        time: format(date, 'HH:mm'),
        dayOfWeek: format(date, 'EEEE', { locale })
      };
    } catch {
      return null;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: t.profile_page?.statusConfirmed || 'Potwierdzona' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: t.profile_page?.statusCancelled || 'Anulowana' };
      default:
        return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: t.profile_page?.statusPending || 'Oczekuje' };
    }
  };

  const isActiveBooking = (status: string) => status === 'pending' || status === 'confirmed';

  const filteredBookings = bookings.filter(b => {
    if (filter === 'active') return isActiveBooking(b.status);
    if (filter === 'past') return b.status === 'cancelled';
    return true;
  });

  const activeCount = bookings.filter(b => isActiveBooking(b.status)).length;

  const locale = dateLocales[language as keyof typeof dateLocales] || pl;

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
    const map: Record<string, Booking[]> = {};
    filteredBookings.forEach(b => {
      const startTime = b.time_slots?.start_time || b.start_time;
      if (!startTime) return;
      const dateKey = format(new Date(startTime), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(b);
    });
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => {
        const ta = a.time_slots?.start_time || a.start_time || '';
        const tb = b.time_slots?.start_time || b.start_time || '';
        return ta.localeCompare(tb);
      })
    );
    return map;
  }, [filteredBookings]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      return format(day, 'EEEEEE', { locale });
    });
  }, [locale]);

  const renderBookingCard = (booking: Booking) => {
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
        className={`bg-white rounded-xl shadow-sm overflow-hidden transition-opacity ${
          booking.status === 'cancelled' ? 'opacity-60' : ''
        }`}
      >
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {booking.services ? getServiceName(booking.services, language) : '—'}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                {dateInfo && (
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span className="capitalize">{dateInfo.dayOfWeek}, {dateInfo.date}</span>
                  </div>
                )}

                {dateInfo && (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span>
                      {dateInfo.time}
                      {endInfo ? ` – ${endInfo.time}` : ''}
                      {duration ? ` (${duration} min)` : ''}
                    </span>
                  </div>
                )}

                {booking.stylists?.name && (
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span>{booking.stylists.name}</span>
                  </div>
                )}

                {price != null && (
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span className="font-medium">{(price / 100).toFixed(0)} PLN</span>
                  </div>
                )}
              </div>

              {!dateInfo && (
                <p className="text-sm text-gray-400 mt-1">
                  {t.profile_page?.noDateInfo || 'Brak informacji o terminie'}
                </p>
              )}
            </div>

            <div className="flex sm:flex-col gap-2 sm:items-end flex-shrink-0">
              {isActiveBooking(booking.status) && (
                <>
                  <button
                    onClick={() => openReschedule(booking)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    {t.profile_page?.reschedule || 'Zmień termin'}
                  </button>
                  <button
                    onClick={() => cancelBooking(booking.id)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    {t.profile_page?.cancel || 'Anuluj'}
                  </button>
                </>
              )}
              {booking.status === 'cancelled' && (
                <>
                  <button
                    onClick={() => rebookService(booking)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    {t.profile_page?.rebook || 'Zarezerwuj ponownie'}
                  </button>
                  <button
                    onClick={() => deleteBooking(booking.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {t.profile_page?.delete || 'Usuń'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            {t.profile_page?.myBookings || 'Moje Rezerwacje'}
            {activeCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                {activeCount}
              </span>
            )}
          </h2>

          <div className="flex items-center gap-2">
             {/* View Toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={t.profile_page?.listView || 'Lista'}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'calendar' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={t.profile_page?.calendarView || 'Kalendarz'}
              >
                <CalendarDaysIcon className="h-5 w-5" />
              </button>
            </div>
            {/* Filter Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(['all', 'active', 'past'] as BookingFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filter === f
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f === 'all' && (t.profile_page?.allBookings || 'Wszystkie')}
                  {f === 'active' && (t.profile_page?.activeBookings || 'Aktywne')}
                  {f === 'past' && (t.profile_page?.pastBookings || 'Historia')}
                </button>
              ))}
            </div>

           
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <SparklesIcon className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-gray-700 font-medium text-lg mb-1">
              {t.profile_page?.noBookings || 'Nie masz jeszcze żadnych rezerwacji'}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {t.profile_page?.noBookingsHint || 'Zarezerwuj swoją pierwszą wizytę'}
            </p>
            <button
              onClick={() => navigate('/services')}
              className="px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors text-sm"
            >
              {t.profile_page?.bookFirst || 'Zarezerwuj wizytę'}
            </button>
          </div>
        ) : (
          <>
            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {filteredBookings.map((booking) => renderBookingCard(booking))}
              </div>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div className="bg-white rounded-xl shadow-sm">
                {/* Calendar header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
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
                <div className="grid grid-cols-7 border-b border-gray-100">
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
                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                    const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                    const canQuickBook = isCurrentMonth && !isPast;

                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (dayBookings.length > 0) {
                            setSelectedDay(isSelected ? null : day);
                          }
                        }}
                        className={`relative group min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-100 p-1 transition-colors ${
                          !isCurrentMonth ? 'bg-gray-50' : ''
                        } ${isSelected ? 'bg-amber-50 ring-2 ring-amber-300 ring-inset' : ''} ${
                          dayBookings.length > 0 ? 'cursor-pointer hover:bg-amber-50/50' : ''
                        }`}
                      >
                        <div className={`text-xs font-medium mb-1 px-1 ${
                          isToday
                            ? 'bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                            : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          {format(day, 'd')}
                        </div>

                        {/* Quick book "+" button — centered in cell */}
                        {canQuickBook && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickBookDate(day);
                            }}
                            className="absolute inset-0 m-auto w-fit h-fit flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 hover:scale-105 transition-all shadow-md opacity-0 sm:group-hover:opacity-100 active:opacity-100 text-[11px] font-semibold whitespace-nowrap z-10"
                            title={t.quick_booking?.addBooking || 'Zarezerwuj wizytę'}
                          >
                            <PlusIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{t.quick_booking?.newReservation || 'Nowa'}</span>
                          </button>
                        )}

                        <div className="space-y-0.5">
                          {dayBookings.slice(0, 2).map(b => {
                            const sc = getStatusConfig(b.status);
                            const time = b.time_slots?.start_time || b.start_time;
                            const timeStr = time ? format(new Date(time), 'HH:mm') : '';

                            return (
                              <div
                                key={b.id}
                                className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate ${sc.bg} ${sc.text}`}
                                title={`${timeStr} ${b.services ? getServiceName(b.services, language) : ''}`}
                              >
                                <span className="font-medium">{timeStr}</span>{' '}
                                <span className="hidden sm:inline">{b.services ? getServiceName(b.services, language) : ''}</span>
                              </div>
                            );
                          })}
                          {dayBookings.length > 2 && (
                            <div className="text-[10px] text-gray-400 px-1">
                              +{dayBookings.length - 2} {t.profile_page?.more || 'więcej'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected day detail panel */}
                {selectedDay && (
                  <div className="border-t border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 capitalize">
                      {format(selectedDay, 'EEEE, d MMMM yyyy', { locale })}
                    </h4>
                    <div className="space-y-3">
                      {(bookingsByDate[format(selectedDay, 'yyyy-MM-dd')] || []).map(booking =>
                        renderBookingCard(booking)
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Booking Popup */}
      {quickBookDate && (
        <QuickBookingPopup
          date={quickBookDate}
          onClose={() => setQuickBookDate(null)}
          onBooked={() => {
            setQuickBookDate(null);
            loadBookings();
          }}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleBooking && rescheduleService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t.profile_page?.rescheduleTitle || 'Zmień termin rezerwacji'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {rescheduleService.name}
                  </p>
                </div>
                <button
                  onClick={() => { setRescheduleBooking(null); setRescheduleService(null); }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <AdvancedBookingCalendar
                service={rescheduleService}
                onSlotSelect={handleRescheduleSlot}
                stylistId={null}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
