import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, addMonths, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { pl } from 'date-fns/locale';
import { MonthCalendar } from './MonthCalendar';
import { TimeGrid } from './TimeGrid';
import { TimeSlot, Service } from '../../types';
import { supabase } from '../../lib/supabase';
import { generateAvailableTimeSlots } from '../../utils/timeSlots';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [qualifiedStylistIds, setQualifiedStylistIds] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));

  // Step 1: Load stylists who can perform this service
  useEffect(() => {
    loadQualifiedStylists();
  }, [service.id, stylistId]);

  // Step 2: Load available dates when stylists or month changes
  useEffect(() => {
    if (qualifiedStylistIds.length > 0) {
      loadAvailableDates();
    } else {
      setAvailableDates([]);
    }
  }, [qualifiedStylistIds, currentMonth]);

  // Step 3: Load time slots when date is selected
  useEffect(() => {
    if (selectedDate && qualifiedStylistIds.length > 0) {
      loadTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate, qualifiedStylistIds]);

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

      // Apply stylist filter if provided
      if (stylistId) {
        ids = ids.filter(id => id === stylistId);
      }

      setQualifiedStylistIds(ids);
    } catch (error) {
      console.error('Error loading qualified stylists:', error);
    }
  }, [service.id, stylistId]);

  const loadAvailableDates = useCallback(async () => {
    if (qualifiedStylistIds.length === 0) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stylist_working_hours')
        .select('date')
        .eq('is_available', true)
        .in('stylist_id', qualifiedStylistIds)
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
    if (!selectedDate || !isValid(selectedDate) || qualifiedStylistIds.length === 0) {
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
        .in('stylist_id', qualifiedStylistIds);

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

      setTimeSlots(availableSlots);
    } catch (err) {
      console.error('Error loading time slots:', err);
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, qualifiedStylistIds, service.duration]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    onSlotSelect(slot);
  };

  return (
    <div className="space-y-6">
      <MonthCalendar
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        selectedDate={selectedDate || new Date()}
        onDateSelect={setSelectedDate}
        highlightedDates={availableDates}
        minDate={new Date()}
        maxDate={addMonths(new Date(), 3)}
      />

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {selectedDate ? format(selectedDate, 'EEEE, d MMMM', { locale: pl }) : 'Wybierz datę'}
        </h3>

        <TimeGrid
          timeSlots={timeSlots}
          selectedSlot={selectedSlot}
          onSlotSelect={handleSlotSelect}
          serviceDuration={service.duration}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};