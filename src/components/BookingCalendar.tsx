import React, { useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { MonthCalendar } from './Calendar/MonthCalendar';
import { TimeGrid } from './Calendar/TimeGrid';
import { Service, TimeSlot } from '../types';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';

interface BookingCalendarProps {
  service: Service;
  stylistId?: string | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  service,
  stylistId,
  onSlotSelect
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  useEffect(() => {
    loadAvailableDates();
  }, [service.id, stylistId, currentMonth]);

  useEffect(() => {
    loadTimeSlots();
  }, [selectedDate, service.id, stylistId]);

  const loadAvailableDates = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('stylist_working_hours')
        .select('date')
        .eq('is_available', true)
        .gte('date', format(currentMonth, 'yyyy-MM-dd'))
        .lte('date', format(addMonths(currentMonth, 1), 'yyyy-MM-dd'));

      if (stylistId) {
        query = query.eq('stylist_id', stylistId);
      }

      const { data } = await query;
      if (data) {
        setAvailableDates(data.map(d => new Date(d.date)));
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
      let query = supabase
        .from('stylist_working_hours')
        .select('*')
        .eq('date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('is_available', true);

      if (stylistId) {
        query = query.eq('stylist_id', stylistId);
      }

      const { data } = await query;
      if (data) {
        const slots: TimeSlot[] = data.map(hour => ({
          id: `${hour.id}-${format(new Date(hour.date), 'HHmm')}`,
          stylistId: hour.stylist_id,
          startTime: `${hour.date}T${hour.start_time}`,
          endTime: `${hour.date}T${hour.end_time}`,
          isAvailable: true
        }));
        setTimeSlots(slots);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    onSlotSelect(slot);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <MonthCalendar
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        highlightedDates={availableDates}
        minDate={new Date()}
        maxDate={addMonths(new Date(), 3)}
      />

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {format(selectedDate, 'EEEE, d MMMM', { locale: pl })}
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