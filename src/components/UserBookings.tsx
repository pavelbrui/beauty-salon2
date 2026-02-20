import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { notifyAdmin, notifyClient } from '../lib/notifications';
import { Booking, Service, TimeSlot } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getServiceName } from '../utils/serviceTranslation';
import { AdvancedBookingCalendar } from './Calendar/AdvancedBookingCalendar';
import { format } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  TrashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const dateLocales = { pl, en: enUS, ru };

type BookingFilter = 'all' | 'active' | 'past';

export const UserBookings: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleService, setRescheduleService] = useState<Service | null>(null);
  const [filter, setFilter] = useState<BookingFilter>('all');

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
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
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
            })}
          </div>
        )}
      </div>

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
