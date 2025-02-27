import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isValid } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface MonthCalendarProps {
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  highlightedDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  currentMonth = new Date(),
  onMonthChange,
  selectedDate,
  onDateSelect,
  highlightedDates = [],
  minDate,
  maxDate
}) => {
  if (!isValid(currentMonth)) {
    console.warn('Invalid currentMonth provided, using current date');
    currentMonth = new Date();
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = isValid(monthStart) && isValid(monthEnd) 
    ? eachDayOfInterval({ start: monthStart, end: monthEnd })
    : [];

  const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

  const goToPreviousMonth = () => {
    const prevMonth = subMonths(currentMonth, 1);
    if (isValid(prevMonth) && (!minDate || prevMonth >= startOfMonth(minDate))) {
      onMonthChange?.(prevMonth);
    }
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (isValid(nextMonth) && (!maxDate || nextMonth <= endOfMonth(maxDate))) {
      onMonthChange?.(nextMonth);
    }
  };

  const isDateSelectable = (date: Date) => {
    if (!isValid(date)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && (!maxDate || date <= maxDate);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={goToPreviousMonth}
            className={`p-2 rounded-full transition-colors ${
              minDate && subMonths(currentMonth, 1) < minDate
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            disabled={minDate && subMonths(currentMonth, 1) < minDate}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className={`p-2 rounded-full transition-colors ${
              maxDate && addMonths(currentMonth, 1) > maxDate
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            disabled={maxDate && addMonths(currentMonth, 1) > maxDate}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'LLLL yyyy', { locale: pl })}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isHighlighted = highlightedDates.some(d => isSameDay(d, day));
          const isSelectable = isDateSelectable(day);

          return (
            <button
              key={day.toString()}
              onClick={() => isSelectable && onDateSelect(day)}
              disabled={!isSelectable}
              className={`
                p-2 rounded-lg text-center
                ${isSelected ? 'bg-amber-500 text-white' : ''}
                ${isHighlighted && !isSelected ? 'bg-amber-100' : ''}
                ${!isSelectable ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
              `}
            >
              <span className="text-sm">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};