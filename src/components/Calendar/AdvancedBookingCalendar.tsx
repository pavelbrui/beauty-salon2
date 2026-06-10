import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, addDays, addMonths, startOfMonth, endOfMonth, isValid, isBefore, startOfDay } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { MonthCalendar } from './MonthCalendar';
import { TimeGrid } from './TimeGrid';
import { TimeSlot, Service, Stylist } from '../../types';
import { StylistFilter } from '../StylistFilter';
import { supabase } from '../../lib/supabase';
import { generateAvailableTimeSlots } from '../../utils/timeSlots';
import { BookingRestrictions, DEFAULT_RESTRICTIONS, isSlotBookable } from '../../utils/bookingRestrictions';
import { useLanguage } from '../../hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';

const dateLocales = { pl, en: enUS, ru };

interface AdvancedBookingCalendarProps {
  service: Service;
  stylistId?: string | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

export const AdvancedBookingCalendar: React.FC<AdvancedBookingCalendarProps> = ({
  service,
  stylistId,
  onSlotSelect
}) => {
  const { language } = useLanguage();
  const locale = dateLocales[language as keyof typeof dateLocales] || pl;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [qualifiedStylists, setQualifiedStylists] = useState<Stylist[]>([]);
  const [qualifiedStylistIds, setQualifiedStylistIds] = useState<string[]>([]);
  const [localStylistId, setLocalStylistId] = useState<string>(stylistId || '');
  const [stylistRestrictions, setStylistRestrictions] = useState<Record<string, BookingRestrictions>>({});
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));

  // Step 1: Load stylists who can perform this service
  useEffect(() => {
    loadQualifiedStylists();
  }, [service.id, stylistId]);

  // Step 2: Load available dates when stylists, month, or selected filter changes
  useEffect(() => {
    if (qualifiedStylistIds.length > 0) {
      loadAvailableDates();
    } else {
      setAvailableDates([]);
    }
  }, [qualifiedStylistIds, currentMonth, localStylistId]);

  // Step 2b: Auto-select first available date that actually has free slots
  const autoSelectDates = useRef<Date[]>([]);
  const autoSelectIndex = useRef(0);
  const isAutoSelecting = useRef(false);
  const hasAutoSelected = useRef(false);
  // Reset selected date, slot, and auto-select flags when stylist filter changes to ensure slots refresh
  useEffect(() => {
    // When the user selects a different stylist, clear the date and selected slot.
    setSelectedDate(null);
    setSelectedSlot(null);
    // Reset auto-select tracking refs
    hasAutoSelected.current = false;
    isAutoSelecting.current = false;
  }, [localStylistId]);
  useEffect(() => {
    if (availableDates.length === 0 || hasAutoSelected.current) return;

    const today = startOfDay(new Date());
    const sorted = [...availableDates]
      .filter(d => !isBefore(startOfDay(d), today))
      .sort((a, b) => a.getTime() - b.getTime());

    if (sorted.length > 0) {
      autoSelectDates.current = sorted;
      autoSelectIndex.current = 0;
      isAutoSelecting.current = true;

      const firstDate = sorted[0];
      const firstMonth = startOfMonth(firstDate);
      if (firstMonth.getTime() !== startOfMonth(currentMonth).getTime()) {
        setCurrentMonth(firstMonth);
      }
      setSelectedDate(firstDate);
    }
  }, [availableDates]);

  // Step 2c: If auto-selected date has no future slots, try next date
  useEffect(() => {
    if (!isAutoSelecting.current || isLoading) return;

    const now = new Date();
    const hasFutureSlots = timeSlots.some(s => {
      try { return s.isAvailable && new Date(s.startTime) >= now; }
      catch { return false; }
    });

    if (hasFutureSlots) {
      // Found a good date
      isAutoSelecting.current = false;
      hasAutoSelected.current = true;
      return;
    }

    // No slots — try next date
    const nextIdx = autoSelectIndex.current + 1;
    if (nextIdx < autoSelectDates.current.length) {
      autoSelectIndex.current = nextIdx;
      const nextDate = autoSelectDates.current[nextIdx];
      const nextMonth = startOfMonth(nextDate);
      if (nextMonth.getTime() !== startOfMonth(currentMonth).getTime()) {
        setCurrentMonth(nextMonth);
      }
      setSelectedDate(nextDate);
    } else {
      // No more dates to try
      isAutoSelecting.current = false;
      hasAutoSelected.current = true;
    }
  }, [timeSlots, isLoading]);

  // Step 3: Load time slots when date or filter is selected
  useEffect(() => {
    if (selectedDate && qualifiedStylistIds.length > 0) {
      loadTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate, qualifiedStylistIds, localStylistId]);

  const loadQualifiedStylists = useCallback(async () => {
    try {
      // Check stylist_service_assignments for this service
      const { data: assignments } = await supabase
        .from('stylist_service_assignments')
        .select('stylist_id')
        .eq('service_id', service.id);

      let ids: string[];

      if (assignments && assignments.length > 0) {
        ids = assignments.map(a => a.stylist_id);
      } else {
        // No assignments configured — show all stylists as fallback
        const { data: allStylists } = await supabase
          .from('stylists')
          .select('id');
        ids = allStylists?.map(s => s.id) || [];
      }

      // Apply stylist filter if provided ONLY for initial localStylistId setup (don't restrict the actual loaded qualified list)
      // because we want the dropdown to show ALL qualified stylists, but pre-select the one from the URL.

      // Load full stylist details for qualified stylists
      if (ids.length > 0) {
        const { data: stylistData } = await supabase
          .from('stylists')
          .select('*')
          .in('id', ids);

        if (stylistData) {
          setQualifiedStylists(stylistData);
          const restrictions: Record<string, BookingRestrictions> = {};
          for (const s of stylistData) {
            restrictions[s.id] = {
              minAdvanceHours: s.min_advance_hours ?? DEFAULT_RESTRICTIONS.minAdvanceHours,
              nightStartHour: s.night_start_hour ?? DEFAULT_RESTRICTIONS.nightStartHour,
              nightEndHour: s.night_end_hour ?? DEFAULT_RESTRICTIONS.nightEndHour,
              nightMinSlotHour: s.night_min_slot_hour ?? DEFAULT_RESTRICTIONS.nightMinSlotHour,
            };
          }
          setStylistRestrictions(restrictions);
        }
      } else {
        setQualifiedStylists([]);
      }

      setQualifiedStylistIds(ids);
      
      // Auto-select stylist if passed via URL prop, and it's valid
      if (stylistId && ids.includes(stylistId)) {
        setLocalStylistId(stylistId);
      }
    } catch (error) {
      console.error('Error loading qualified stylists:', error);
    }
  }, [service.id, stylistId]);

  const loadAvailableDates = useCallback(async () => {
    const idsToFetch = localStylistId ? [localStylistId] : qualifiedStylistIds;
    if (idsToFetch.length === 0) {
      setAvailableDates([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stylist_working_hours')
        .select('date')
        .eq('is_available', true)
        .in('stylist_id', idsToFetch)
        .gte('date', format(startOfMonth(currentMonth), 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(currentMonth), 'yyyy-MM-dd'));

      if (error) throw error;

      if (data) {
        const uniqueDates = [...new Set(data.map(d => d.date))];
        setAvailableDates(uniqueDates.map(d => new Date(d)));
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [qualifiedStylistIds, currentMonth]);

  const loadTimeSlots = useCallback(async () => {
    const idsToFetch = localStylistId ? [localStylistId] : qualifiedStylistIds;
    if (!selectedDate || !isValid(selectedDate) || idsToFetch.length === 0) {
      setTimeSlots([]);
      return;
    }

    setIsLoading(true);
    try {
      // Get working hours for qualified stylists on this date
      const { data: workingHours, error: whError } = await supabase
        .from('stylist_working_hours')
        .select('stylist_id, start_time, end_time')
        .eq('date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('is_available', true)
        .in('stylist_id', idsToFetch);

      if (whError) throw whError;

      if (!workingHours || workingHours.length === 0) {
        setTimeSlots([]);
        return;
      }

      // Get busy slots (already booked) for this date
      // Try with stylist_id (post-migration 0014), fallback to without
      let busySlots: Array<{ start_time: string; end_time: string; stylist_id?: string }> | null = null;
      const { data: bsData, error: bsError } = await supabase
        .from('time_slots')
        .select('start_time, end_time, stylist_id')
        .eq('is_available', false)
        .gte('start_time', format(selectedDate, 'yyyy-MM-dd'))
        .lt('start_time', format(addDays(selectedDate, 1), 'yyyy-MM-dd'));

      if (!bsError) {
        busySlots = bsData;
      } else {
        // stylist_id column may not exist yet — query without it
        const { data: bsFallback } = await supabase
          .from('time_slots')
          .select('start_time, end_time')
          .eq('is_available', false)
          .gte('start_time', format(selectedDate, 'yyyy-MM-dd'))
          .lt('start_time', format(addDays(selectedDate, 1), 'yyyy-MM-dd'));
        busySlots = bsFallback;
      }

      // Generate available time slots dynamically
      const availableSlots = generateAvailableTimeSlots(
        selectedDate,
        workingHours,
        busySlots || [],
        service.duration
      );

      // Apply booking restrictions per stylist
      const now = new Date();
      const filteredSlots = availableSlots.map(slot => {
        if (!slot.isAvailable) return slot;
        const restrictions = (slot.stylistId && stylistRestrictions[slot.stylistId])
          ? stylistRestrictions[slot.stylistId]
          : DEFAULT_RESTRICTIONS;
        if (!isSlotBookable(new Date(slot.startTime), restrictions, now)) {
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
  }, [selectedDate, qualifiedStylistIds, service.duration, stylistRestrictions]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    onSlotSelect(slot);
  };

  return (
    <div className="space-y-6">
      {qualifiedStylists.length > 1 && (
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {language === 'en' ? 'Select Stylist' : language === 'ru' ? 'Выберите мастера' : 'Wybierz stylistkę'}
          </h3>
          <StylistFilter
            stylists={qualifiedStylists}
            selectedId={localStylistId}
            onSelect={setLocalStylistId}
            allLabel={language === 'en' ? 'Any Stylist' : language === 'ru' ? 'Любой мастер' : 'Dowolna'}
          />
        </div>
      )}

      <MonthCalendar
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        selectedDate={selectedDate || new Date()}
        onDateSelect={setSelectedDate}
        highlightedDates={availableDates}
        minDate={new Date()}
        maxDate={addMonths(new Date(), 3)}
      />

      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {format(selectedDate, 'EEEE, d MMMM', { locale })}
            </h3>

            <TimeGrid
              timeSlots={timeSlots}
              selectedSlot={selectedSlot}
              onSlotSelect={handleSlotSelect}
              serviceDuration={service.duration}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};