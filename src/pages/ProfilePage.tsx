import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Booking, Service } from '../types';
import { SEO } from '../components/SEO';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { AdvancedBookingCalendar } from '../components/Calendar/AdvancedBookingCalendar';
import { TimeSlot } from '../types';
import { format } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { CalendarDaysIcon, ClockIcon, UserIcon, CurrencyDollarIcon, PencilSquareIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';

const ADMIN_EMAIL = 'bpl_as2@mail.ru';
const dateLocales = { pl, en: enUS, ru };

export const ProfilePage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleService, setRescheduleService] = useState<Service | null>(null);

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
        services (name, price, duration),
        time_slots (start_time, end_time),
        stylists (name)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bookings:', error);
      setLoading(false);
      return;
    }

    setBookings(data || []);
    setLoading(false);
  };

  const notifyAdmin = async (bookingId: string, action: string, message: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .insert({
        booking_id: bookingId,
        action,
        admin_email: ADMIN_EMAIL,
        message
      });

    if (error) {
      console.error('Error creating admin notification:', error);
    }
  };

  const notifyClient = async (bookingId: string, type: 'confirmation' | 'reminder' | 'status_update') => {
    const { error } = await supabase
      .from('booking_notifications')
      .insert({
        booking_id: bookingId,
        type,
        status: 'pending'
      });

    if (error) {
      console.error('Error creating client notification:', error);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    const slotId = booking?.time_slot_id || booking?.timeSlotId;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

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
      .eq('id', bookingId);

    if (error) {
      console.error('Error deleting booking:', error);
      return;
    }

    loadBookings();
  };

  const rebookService = (booking: Booking) => {
    const serviceId = booking.service_id || booking.serviceId;
    if (serviceId) {
      navigate(`/booking/${serviceId}`);
    }
  };

  const openReschedule = async (booking: Booking) => {
    const serviceId = booking.service_id || booking.serviceId;
    if (!serviceId) return;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error || !data) {
      console.error('Error loading service for reschedule:', error);
      return;
    }

    setRescheduleService(data);
    setRescheduleBooking(booking);
  };

  const handleRescheduleSlot = async (slot: TimeSlot) => {
    if (!rescheduleBooking) return;

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

      if (slotError || !newSlot) {
        console.error('Error creating time slot:', slotError);
        return;
      }

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
        .eq('id', rescheduleBooking.id);

      if (updateError) {
        console.error('Error updating booking:', updateError);
        return;
      }

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
        return { bg: 'bg-green-100', text: 'text-green-700', label: t.profile_page?.statusConfirmed || 'Potwierdzona' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', label: t.profile_page?.statusCancelled || 'Anulowana' };
      default:
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: t.profile_page?.statusPending || 'Oczekuje' };
    }
  };

  const isActive = (status: string) => status === 'pending' || status === 'confirmed';

  return (
    <div className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={t.profile_page?.title || 'Moje Rezerwacje'}
        description={t.profile_page?.seoDescription || 'Zarządzaj swoimi rezerwacjami w salonie Katarzyna Brui.'}
        canonical="/profile"
        noindex
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t.profile_page?.title || 'Moje Rezerwacje'}
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {t.profile_page?.noBookings || 'Nie masz jeszcze żadnych rezerwacji'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
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
                  className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${
                    booking.status === 'cancelled'
                      ? 'border-l-red-400 opacity-60'
                      : booking.status === 'confirmed'
                      ? 'border-l-green-400'
                      : 'border-l-amber-400'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {booking.services?.name || '—'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
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

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 sm:items-end flex-shrink-0">
                        {isActive(booking.status) && (
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
    </div>
  );
};
