import React, { useState, useEffect } from 'react';
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
  const [, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return startOfMonth(now);
  });

  useEffect(() => {
    loadAvailableDates();
  }, [service.id, stylistId, currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate, service.id, stylistId]);

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  const loadAvailableDates = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('stylist_working_hours')
        .select('date')
        .eq('is_available', true)
        .gte('date', format(startOfMonth(currentMonth), 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(currentMonth), 'yyyy-MM-dd'));

      if (stylistId) {
        query = query.eq('stylist_id', stylistId);
      }

      const { data: workingHours, error } = await query;

      if (error) throw error;

      if (workingHours) {
        setAvailableDates(workingHours.map(d => new Date(d.date)));
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimeSlots = async () => {
    setIsLoading(true);
    try {
      if (!selectedDate || !isValid(selectedDate)) {
        setTimeSlots([]);
        return;
      }

      // Get working hours for the selected date
      let query = supabase
        .from('stylist_working_hours')
        .select('*')
        .eq('date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('is_available', true);

      if (stylistId) {
        query = query.eq('stylist_id', stylistId);
      }

      const { data: workingHours, error: workingHoursError } = await query;

      if (workingHoursError) throw workingHoursError;

      // Get busy slots for the selected date
      const { data: busySlots, error: busySlotsError } = await supabase
        .from('time_slots')
        .select('start_time, end_time')
        .eq('is_available', false)
        .gte('start_time', format(selectedDate, 'yyyy-MM-dd'))
        .lt('start_time', format(addDays(selectedDate, 1), 'yyyy-MM-dd'));

      if (busySlotsError) throw busySlotsError;

      if (!workingHours || workingHours.length === 0) {
        setTimeSlots([]);
        return;
      }

      // Generate available time slots
      const availableSlots = generateAvailableTimeSlots(
        selectedDate,
        workingHours,
        busySlots || [],
        service.duration
      );

      setTimeSlots(availableSlots);
    } catch (err) {
      console.error('Error:', err);
      setTimeSlots([]);
    }
    setIsLoading(false);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    onSlotSelect(slot);
  };

  return (
    <div className="space-y-6">
      <MonthCalendar
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
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
        />
      </div>
    </div>
  );
};