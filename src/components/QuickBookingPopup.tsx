import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { notifyAdmin, notifyClient } from '../lib/notifications';
import { saveProfile } from '../lib/profile';
import { generateAvailableTimeSlots } from '../utils/timeSlots';
import { getServiceName } from '../utils/serviceTranslation';
import { Service, TimeSlot } from '../types';
import { TimeGrid } from './Calendar/TimeGrid';
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
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load all services
  useEffect(() => {
    const loadServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category')
        .order('name');
      if (!error && data) setServices(data);
    };
    loadServices();
  }, []);

  // Load time slots when service is selected
  const loadTimeSlots = useCallback(async (service: Service) => {
    setIsLoading(true);
    setTimeSlots([]);
    try {
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

      if (stylistIds.length === 0) {
        setTimeSlots([]);
        return;
      }

      // 2. Get working hours for this date
      const { data: workingHours } = await supabase
        .from('stylist_working_hours')
        .select('stylist_id, start_time, end_time')
        .eq('date', format(date, 'yyyy-MM-dd'))
        .eq('is_available', true)
        .in('stylist_id', stylistIds);

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

      // 4. Generate available slots
      const slots = generateAvailableTimeSlots(
        date,
        workingHours,
        busySlots || [],
        service.duration
      );

      setTimeSlots(slots);
    } catch (err) {
      console.error('Error loading time slots:', err);
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setStep('slots');
    loadTimeSlots(service);
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

  const handleBookingSubmit = async (contactData: {
    name: string;
    phone: string;
    email: string;
    notes?: string;
  }) => {
    if (!selectedSlot || !selectedService) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

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

      // 3. Link time_slot → booking
      if (newSlot?.id && data[0]?.id) {
        await supabase.from('time_slots').update({ booking_id: data[0].id }).eq('id', newSlot.id);
      }

      // 4. Notifications
      if (data[0]?.id) {
        const dateStr = new Date(selectedSlot.startTime).toLocaleString('pl-PL');
        await notifyClient(data[0].id, 'confirmation');
        await notifyAdmin(data[0].id, 'rebooked', `Nowa rezerwacja: ${selectedService.name} na ${dateStr}`);
      }

      await saveProfile({
        full_name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
      });

      setStep('success');
    } catch (err) {
      console.error('Quick booking error:', err);
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

  // Success popup
  if (step === 'success' && selectedService && selectedSlot) {
    return (
      <SuccessPopup
        service={selectedService}
        timeSlot={selectedSlot}
        onClose={() => {
          onBooked();
          onClose();
        }}
      />
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
