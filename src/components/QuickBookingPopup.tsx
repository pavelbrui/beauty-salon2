import React, { useState, useEffect, useRef } from 'react';
import { format, addDays } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { notifyAdmin, notifyClient, sendTelegramBookingAlert } from '../lib/notifications';
import { syncBookingToBooksy } from '../lib/booksySync';
import { saveProfile } from '../lib/profile';
import { generateAvailableTimeSlots } from '../utils/timeSlots';
import { BookingRestrictions, DEFAULT_RESTRICTIONS, isSlotBookable } from '../utils/bookingRestrictions';
import { getServiceName } from '../utils/serviceTranslation';
import { Service, TimeSlot, Stylist } from '../types';
import { TimeGrid } from './Calendar/TimeGrid';
import { StylistFilter } from './StylistFilter';
import { BookingForm } from './BookingForm';
import { AuthModal } from './AuthModal';
import { SuccessPopup } from './SuccessPopup';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const dateLocales = { pl, en: enUS, ru };

interface QuickBookingPopupProps {
  date: Date;
  onClose: () => void;
  onBooked: () => void;
}

export const QuickBookingPopup: React.FC<QuickBookingPopupProps> = ({
  date,
  onClose,
  onBooked,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const locale = dateLocales[language as keyof typeof dateLocales] || pl;

  // Steps: 'services' → 'slots' → 'form' → 'success'
  const [step, setStep] = useState<'services' | 'slots' | 'form' | 'success'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [qualifiedStylists, setQualifiedStylists] = useState<Stylist[]>([]);
  const [qualifiedStylistIds, setQualifiedStylistIds] = useState<string[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isSubmittingRef = useRef(false);
  const [booksyConfirmation, setBooksyConfirmation] = React.useState<'pending' | 'confirmed' | 'failed'>('pending');
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  // Load all services
  useEffect(() => {
    const loadServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_hidden', false)
        .order('category')
        .order('name');
      if (!error && data) setServices(data);
    };
    loadServices();
  }, []);

  // Load time slots when service or selected stylist changes
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!selectedService || qualifiedStylistIds.length === 0) return;
      
      setIsLoading(true);
      setTimeSlots([]);
      
      const idsToFetch = selectedStylistId ? [selectedStylistId] : qualifiedStylistIds;
      
      try {
        // 2. Get working hours for this date
      const { data: workingHours } = await supabase
        .from('stylist_working_hours')
        .select('stylist_id, start_time, end_time')
        .eq('date', format(date, 'yyyy-MM-dd'))
        .eq('is_available', true)
        .in('stylist_id', idsToFetch);

      if (!workingHours || workingHours.length === 0) {
        setTimeSlots([]);
        return;
      }

      // 3. Get busy slots for this date
      const { data: busySlots } = await supabase
        .from('time_slots')
        .select('start_time, end_time, stylist_id')
        .eq('is_available', false)
        .gte('start_time', format(date, 'yyyy-MM-dd'))
        .lt('start_time', format(addDays(date, 1), 'yyyy-MM-dd'));

      // 4. Load booking restrictions for stylists
      const { data: stylistData } = await supabase
        .from('stylists')
        .select('id, min_advance_hours, night_start_hour, night_end_hour, night_min_slot_hour')
        .in('id', idsToFetch);

      const restrictions: Record<string, BookingRestrictions> = {};
      if (stylistData) {
        for (const s of stylistData) {
          restrictions[s.id] = {
            minAdvanceHours: s.min_advance_hours ?? DEFAULT_RESTRICTIONS.minAdvanceHours,
            nightStartHour: s.night_start_hour ?? DEFAULT_RESTRICTIONS.nightStartHour,
            nightEndHour: s.night_end_hour ?? DEFAULT_RESTRICTIONS.nightEndHour,
            nightMinSlotHour: s.night_min_slot_hour ?? DEFAULT_RESTRICTIONS.nightMinSlotHour,
          };
        }
      }

      // 5. Generate available slots
      const slots = generateAvailableTimeSlots(
        date,
        workingHours,
        busySlots || [],
        selectedService.duration
      );

      // 6. Apply booking restrictions per stylist
      const now = new Date();
      const filteredSlots = slots.map(slot => {
        if (!slot.isAvailable) return slot;
        const r = (slot.stylistId && restrictions[slot.stylistId])
          ? restrictions[slot.stylistId]
          : DEFAULT_RESTRICTIONS;
        if (!isSlotBookable(new Date(slot.startTime), r, now)) {
          return { ...slot, isAvailable: false };
        }
        return slot;
      });

      setTimeSlots(filteredSlots);
    } catch (err) {
      console.error('Error loading time slots:', err);
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  loadTimeSlots();
  }, [date, selectedService, qualifiedStylistIds, selectedStylistId]);

  const handleServiceSelect = async (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setStep('slots');
    
    setIsLoading(true);
    // 1. Get qualified stylists for this service
    const { data: assignments } = await supabase
      .from('stylist_service_assignments')
      .select('stylist_id')
      .eq('service_id', service.id);

    let stylistIds: string[];
    if (assignments && assignments.length > 0) {
      stylistIds = assignments.map(a => a.stylist_id);
    } else {
      const { data: allStylists } = await supabase.from('stylists').select('id');
      stylistIds = allStylists?.map(s => s.id) || [];
    }

    if (stylistIds.length > 0) {
      const { data: stylistData } = await supabase.from('stylists').select('*').in('id', stylistIds);
      if (stylistData) setQualifiedStylists(stylistData);
    } else {
      setQualifiedStylists([]);
    }
    
    setQualifiedStylistIds(stylistIds);
    setSelectedStylistId('');
    setIsLoading(false);
  };

  const handleSlotSelect = async (slot: TimeSlot) => {
    setSelectedSlot(slot);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowAuthModal(true);
    } else {
      setStep('form');
    }
  };

  // Helper to poll booking status until confirmed or timeout
  const waitForBooksyConfirmation = async (bookingId: string, timeoutMs = 15000, intervalMs = 2000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data, error } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();
      if (!error && data?.status === 'confirmed') {
        return true;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return false;
  };

  const handleBookingSubmit = async (contactData: {
    name: string;
    phone: string;
    email: string;
    notes?: string;
  }) => {
    if (!selectedSlot || !selectedService) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { isSubmittingRef.current = false; return; }

    let createdTimeSlotId: string | null = null;
    let createdBookingId: string | null = null;

    try {
      // 1. Create time_slot record
      const { data: newSlot } = await supabase
        .from('time_slots')
        .insert({
          stylist_id: selectedSlot.stylistId,
          start_time: selectedSlot.startTime,
          end_time: selectedSlot.endTime,
          is_available: false,
        })
        .select('id')
        .single();
      createdTimeSlotId = newSlot?.id || null;

      // 2. Create booking
      const bookingData: Record<string, unknown> = {
        service_id: selectedService.id,
        user_id: session.user.id,
        stylist_id: selectedSlot.stylistId,
        status: 'pending',
        contact_name: contactData.name,
        contact_phone: contactData.phone,
        contact_email: contactData.email,
        notes: contactData.notes || '',
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
      };
      if (newSlot?.id) bookingData.time_slot_id = newSlot.id;

      const { data, error } = await supabase.from('bookings').insert(bookingData).select();
      if (error) throw error;
      if (!data) throw new Error('Failed to create booking');
      createdBookingId = data[0]?.id || null;

      // 3. Link time_slot → booking
      if (newSlot?.id && data[0]?.id) {
        const { error: linkSlotError } = await supabase
          .from('time_slots')
          .update({ booking_id: data[0].id })
          .eq('id', newSlot.id);

        if (linkSlotError) {
          console.error('Error linking time slot to booking:', linkSlotError);
        }
      }

      // 4. Notifications and Booksy sync
      if (data[0]?.id) {
        const bookingId = data[0].id;
        try {
          const dateStr = new Date(selectedSlot.startTime).toLocaleString('pl-PL');
          await notifyClient(bookingId, 'confirmation');
          await notifyAdmin(bookingId, 'rebooked', `Nowa rezerwacja: ${selectedService.name} na ${dateStr}`);
          await sendTelegramBookingAlert(bookingId);
          // Fire Booksy sync and wait for confirmation before showing UI success
          syncBookingToBooksy({
            action: 'create_block',
            bookingId,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            stylistId: selectedSlot.stylistId,
          });
           const confirmed = await waitForBooksyConfirmation(bookingId);
          if (confirmed) {
            setBooksyConfirmation('confirmed');
          } else {
            setBooksyConfirmation('failed');
            console.warn('Booksy confirmation timed out for booking', bookingId);
          }
        } catch (notifyError) {
          console.error('Quick booking created, but notifications failed:', notifyError);
        }
      }

      // Best-effort profile sync; booking should not fail because of this.
      try {
        await saveProfile({
          full_name: contactData.name,
          phone: contactData.phone,
          email: contactData.email,
        });
      } catch (profileError) {
        console.error('Quick booking created, but profile save failed:', profileError);
      }
          // After sync (or timeout) set success UI
          setSuccessBookingId(createdBookingId);
          setStep('success');
    } catch (err) {
      if (createdTimeSlotId && !createdBookingId) {
        // Roll back temporary blocked slot when booking insert fails.
        await supabase
          .from('time_slots')
          .delete()
          .eq('id', createdTimeSlotId);
      }
      console.error('Quick booking error:', err);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const filteredServices = services.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = getServiceName(s, language).toLowerCase();
    const cat = (s.category || '').toLowerCase();
    return name.includes(q) || cat.includes(q);
  });

  // Group services by category
  const grouped = filteredServices.reduce<Record<string, Service[]>>((acc, s) => {
    const cat = s.category || 'Inne';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const dateLabel = format(date, 'EEEE, d MMMM', { locale });

  // Success popup – show after Booksy confirmation or pending timeout
  if (step === 'success' && selectedService && selectedSlot && successBookingId) {
    return (
      <SuccessPopup
        service={selectedService}
        timeSlot={selectedSlot}
        bookingId={successBookingId}
        onClose={() => {
          onBooked();
          onClose();
        }}
      />
    );
  }

  // If Booksy sync failed, show an alert below the UI (could be a toast)
  if (booksyConfirmation === 'failed' && successBookingId) {
    return (
      <div className="p-4 bg-amber-100 border border-amber-200 rounded-md text-sm text-amber-800">
        {`Rezerwacja została utworzona, ale nie udało się potwierdzić w Booksy. Spróbuj ponownie później.`}
        <button className="ml-2 text-amber-900 underline" onClick={() => setBooksyConfirmation('pending')}>Spróbuj ponownie</button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
            {step === 'slots' && (
              <button
                onClick={() => { setStep('services'); setSelectedService(null); setTimeSlots([]); setSelectedSlot(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}
            {step === 'form' && (
              <button
                onClick={() => { setStep('slots'); setSelectedSlot(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {step === 'services' && (t.quick_booking?.selectService || 'Wybierz usługę')}
                {step === 'slots' && (t.quick_booking?.selectTime || 'Wybierz godzinę')}
                {step === 'form' && (t.booking?.contactDetails || 'Dane kontaktowe')}
              </h2>
              <p className="text-sm text-amber-600 capitalize">{dateLabel}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Step 1: Service selection */}
            {step === 'services' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.quick_booking?.searchPlaceholder || 'Szukaj usługi...'}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none"
                  />
                </div>

                {/* Service list grouped by category */}
                {Object.entries(grouped).map(([category, categoryServices]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {t.categories?.[category as keyof typeof t.categories] || category}
                    </h3>
                    <div className="space-y-1.5">
                      {categoryServices.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleServiceSelect(s)}
                          className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 text-sm group-hover:text-amber-700 transition-colors">
                              {getServiceName(s, language)}
                            </span>
                            <span className="text-amber-600 font-semibold text-sm">
                              {(s.price / 100).toFixed(0)} PLN
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-3.5 w-3.5" />
                              {s.duration} min
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredServices.length === 0 && (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    {t.quick_booking?.noResults || 'Nie znaleziono usług'}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Time slot selection */}
            {step === 'slots' && selectedService && (
              <div className="space-y-4">
                {/* Selected service summary */}
                <div className="flex items-center justify-between bg-amber-50 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {getServiceName(selectedService, language)}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {selectedService.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-3.5 w-3.5" />
                        {(selectedService.price / 100).toFixed(0)} PLN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stylist Filter */}
                {qualifiedStylists.length > 1 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {t.quick_booking?.selectStylist || (language === 'en' ? 'Select Stylist' : language === 'ru' ? 'Выберите мастера' : 'Wybierz stylistkę')}
                    </h3>
                    <StylistFilter
                      stylists={qualifiedStylists}
                      selectedId={selectedStylistId}
                      onSelect={setSelectedStylistId}
                      allLabel={language === 'en' ? 'Any Stylist' : language === 'ru' ? 'Любой мастер' : 'Dowolna'}
                    />
                  </div>
                )}

                {/* Time grid */}
                <TimeGrid
                  timeSlots={timeSlots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={handleSlotSelect}
                  serviceDuration={selectedService.duration}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Step 3: Booking form */}
            {step === 'form' && (
              <BookingForm
                onSubmit={handleBookingSubmit}
                onCancel={() => { setStep('slots'); setSelectedSlot(null); }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Auth modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="signin"
        onSuccess={() => {
          setShowAuthModal(false);
          setStep('form');
        }}
      />
    </>
  );
};
