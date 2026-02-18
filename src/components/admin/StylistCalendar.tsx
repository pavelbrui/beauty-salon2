import React, { useState, useEffect } from 'react';
import { format, addMonths, isValid } from 'date-fns';
import { pl } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { generateRecurringDates } from '../../utils/dateUtils';
import { MonthCalendar } from '../Calendar/MonthCalendar';

interface TimeRange {
  start: string;
  end: string;
}

interface StylistCalendarProps {
  stylistId: string;
  onSave: () => void;
}

export const StylistCalendar: React.FC<StylistCalendarProps> = ({ stylistId, onSave }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workingHours, setWorkingHours] = useState<TimeRange[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [, setIsLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringUntil, setRecurringUntil] = useState<Date>(() => {
    const date = addMonths(new Date(), 3);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  });
  const [error, setError] = useState<string | null>(null);

  const loadWorkingHours = async (date: Date) => {
    if (!isValid(date)) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stylist_working_hours')
        .select('*')
        .eq('stylist_id', stylistId)
        .eq('date', format(date, 'yyyy-MM-dd'))
        .eq('is_available', true);

      if (error) throw error;

      if (data && data.length > 0) {
        setWorkingHours(data.map(hour => ({
          start: hour.start_time,
          end: hour.end_time
        })));
      } else {
        setWorkingHours([]);
      }
    } catch (err) {
      console.error('Error loading working hours:', err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadWorkingHours(selectedDate);
  }, [selectedDate, stylistId]);

  const handleAddTimeRange = () => {
    setWorkingHours([...workingHours, { start: '09:00', end: '17:00' }]);
  };

  const handleRemoveTimeRange = (index: number) => {
    setWorkingHours(workingHours.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (!isValid(selectedDate)) return;

      // Validate working hours
      if (workingHours.length === 0) {
        setError('Dodaj przynajmniej jeden zakres godzin');
        return;
      }

      // Validate time ranges
      for (const range of workingHours) {
        if (range.start >= range.end) {
          setError('Godzina rozpoczęcia musi być wcześniejsza niż zakończenia');
          return;
        }
      }

      if (isRecurring) {
        const recurringDates = generateRecurringDates(selectedDate, recurringUntil, selectedDate.getDay());
        
        // Prepare all schedule data
        const scheduleData = recurringDates.flatMap(date => 
          workingHours.map(range => ({
            stylist_id: stylistId,
            date: format(date, 'yyyy-MM-dd'),
            day_of_week: date.getDay(),
            start_time: range.start,
            end_time: range.end,
            is_available: true,
          }))
        );

        // Delete existing records in date range
        await supabase
          .from('stylist_working_hours')
          .delete()
          .eq('stylist_id', stylistId)
          .gte('date', format(new Date(), 'yyyy-MM-dd'))
          .lte('date', format(recurringUntil, 'yyyy-MM-dd'))
          .eq('day_of_week', selectedDate.getDay());

        // Insert new records
        const { error } = await supabase
          .from('stylist_working_hours')
          .insert(scheduleData);

        if (error) {
          throw new Error('Nie udało się zapisać harmonogramu. Spróbuj ponownie.');
        }

        if (error) throw error;
      } else {
        // Single day update
        await supabase
          .from('stylist_working_hours')
          .delete()
          .eq('stylist_id', stylistId)
          .eq('date', format(selectedDate, 'yyyy-MM-dd'));

        const { error } = await supabase
          .from('stylist_working_hours')
          .insert(
            workingHours.map(range => ({
              stylist_id: stylistId,
              date: format(selectedDate, 'yyyy-MM-dd'),
              day_of_week: selectedDate.getDay(),
              start_time: range.start,
              end_time: range.end,
              is_available: true
            }))
          );

        if (error) {
          throw new Error('Nie udało się zapisać harmonogramu. Spróbuj ponownie.');
        }

        if (error) throw error;
      }

      onSave();
      setIsEditing(false);
      setIsRecurring(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas zapisywania');
      console.error('Error saving working hours:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <MonthCalendar
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          setSelectedDate(date);
          loadWorkingHours(date);
        }}
        highlightedDates={[]}
        minDate={new Date()}
        maxDate={addMonths(new Date(), 12)}
      />

      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isValid(selectedDate) ? format(selectedDate, 'EEEE, d MMMM', { locale: pl }) : 'Wybierz datę'}
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
          >
            Edytuj godziny pracy
          </button>
        ) : (
          <div className="space-y-4">
            {workingHours.map((range, index) => (
              <div key={index} className="flex items-center space-x-4">
                <input
                  type="time"
                  value={range.start}
                  onChange={(e) => {
                    const newHours = [...workingHours];
                    newHours[index].start = e.target.value;
                    setWorkingHours(newHours);
                  }}
                  className="border rounded-md p-2"
                />
                <span>do</span>
                <input
                  type="time"
                  value={range.end}
                  onChange={(e) => {
                    const newHours = [...workingHours];
                    newHours[index].end = e.target.value;
                    setWorkingHours(newHours);
                  }}
                  className="border rounded-md p-2"
                />
                <button
                  onClick={() => handleRemoveTimeRange(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Usuń
                </button>
              </div>
            ))}
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="recurring" className="text-sm text-gray-700">
                  Cyklicznie
                </label>
              </div>
              
              {isRecurring && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">do</span>
                  <input
                    type="date"
                    value={format(recurringUntil, 'yyyy-MM-dd')}
                    onChange={(e) => setRecurringUntil(new Date(e.target.value))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="border rounded-md p-2 text-sm"
                  />
                </div>
              )}

              <button
                onClick={handleAddTimeRange}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Dodaj zakres godzin
              </button>
              <button
                onClick={handleSave}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
              >
                Zapisz
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-600 hover:text-gray-700"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>

      {!isEditing && workingHours.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-2">Godziny pracy:</h4>
          {workingHours.map((range, index) => (
            <div key={index} className="text-gray-600">
              {range.start} - {range.end}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};