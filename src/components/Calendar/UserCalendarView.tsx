import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  isSameMonth,
  startOfDay,
  isBefore,
  parseISO
} from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { Booking } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { translations } from '../../i18n/translations';
import { getServiceName } from '../../utils/serviceTranslation';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarDaysIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const dateLocales = { pl, en: enUS, ru };

interface UserCalendarViewProps {
  bookings: Booking[];
  onQuickBook: (date: Date) => void;
  renderBookingCard: (booking: Booking) => React.ReactNode;
}

export const UserCalendarView: React.FC<UserCalendarViewProps> = ({
  bookings,
  onQuickBook,
  renderBookingCard
}) => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const locale = dateLocales[language as keyof typeof dateLocales] || pl;

  const [subView, setSubView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const handlePrev = () => {
    if (subView === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    if (subView === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  // Group bookings by date "yyyy-MM-dd"
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(b => {
      const startTime = b.time_slots?.start_time || b.start_time;
      if (!startTime) return;
      try {
        const dateKey = format(parseISO(startTime), 'yyyy-MM-dd');
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(b);
      } catch {
        // Skip invalid date
      }
    });

    Object.values(map).forEach(arr => {
      arr.sort((a, b) => {
        const ta = a.time_slots?.start_time || a.start_time || '';
        const tb = b.time_slots?.start_time || b.start_time || '';
        return ta.localeCompare(tb);
      });
    });

    return map;
  }, [bookings]);

  // Days for Month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  // Days for Week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const weekDayHeaders = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      return format(day, 'EEEEEE', { locale });
    });
  }, [locale]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' };
      case 'cancelled': return { bg: 'bg-rose-100', text: 'text-rose-700 opacity-60 line-through', dot: 'bg-rose-400' };
      default: return { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' };
    }
  };

  const getBookingTime = (b: Booking) => {
    const st = b.time_slots?.start_time || b.start_time;
    if (!st) return '';
    try { return format(parseISO(st), 'HH:mm'); }
    catch { return ''; }
  };

  const selectedDateKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selectedDayBookings = selectedDateKey ? (bookingsByDate[selectedDateKey] || []) : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-2xs">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t.admin_bookings?.today || 'Dzisiaj'}
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-gray-900 capitalize">
            {subView === 'month' && format(currentDate, 'LLLL yyyy', { locale })}
            {subView === 'week' && (
              <>
                {format(weekDays[0], 'd MMM', { locale })} – {format(weekDays[6], 'd MMM yyyy', { locale })}
              </>
            )}
          </h3>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-gray-200/70 p-1 rounded-lg">
          <button
            onClick={() => setSubView('month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              subView === 'month'
                ? 'bg-white text-amber-700 shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.profile_page?.calendarView || 'Kalendarz'} ({t.admin_bookings?.viewMonth || 'Miesiąc'})
          </button>
          <button
            onClick={() => setSubView('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              subView === 'week'
                ? 'bg-white text-amber-700 shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.admin_bookings?.viewWeek || 'Tydzień'}
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {subView === 'month' && (
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/40">
            {weekDayHeaders.map((day, i) => (
              <div key={i} className="py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 bg-white">
            {monthDays.map((day, i) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayBookings = bookingsByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
              const canQuickBook = isCurrentMonth && !isPast;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[85px] sm:min-h-[105px] p-1.5 transition-all relative group cursor-pointer ${
                    !isCurrentMonth ? 'bg-gray-50/50 opacity-60' : ''
                  } ${isSelected ? 'bg-amber-50/80 ring-2 ring-amber-400 ring-inset z-10' : 'hover:bg-amber-50/30'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium inline-flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-amber-500 text-white w-6 h-6 font-bold shadow-xs'
                          : isCurrentMonth ? 'text-gray-800' : 'text-gray-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Plus Quick Book Button */}
                    {canQuickBook && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickBook(day);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white bg-amber-500 hover:bg-amber-600 rounded transition-all shadow-xs"
                        title={t.quick_booking?.addBooking || 'Zarezerwuj wizytę'}
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Day Booking Chips */}
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 2).map(b => {
                      const sc = getStatusColor(b.status);
                      const timeStr = getBookingTime(b);
                      const serviceName = b.services ? getServiceName(b.services, language) : 'Rezerwacja';

                      return (
                        <div
                          key={b.id}
                          className={`text-[10px] leading-tight px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 ${sc.bg} ${sc.text}`}
                          title={`${timeStr} ${serviceName}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                          <span className="font-semibold">{timeStr}</span>
                          <span className="truncate hidden sm:inline">{serviceName}</span>
                        </div>
                      );
                    })}

                    {dayBookings.length > 2 && (
                      <div className="text-[10px] text-amber-700 font-semibold px-1">
                        +{dayBookings.length - 2} {t.profile_page?.more || 'więcej'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {subView === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 bg-white">
          {weekDays.map((day, i) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayBookings = bookingsByDate[dateKey] || [];
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isPast = isBefore(startOfDay(day), startOfDay(new Date()));

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(day)}
                className={`p-3 min-h-[140px] cursor-pointer transition-all ${
                  isSelected ? 'bg-amber-50/80 ring-2 ring-amber-400 ring-inset' : 'hover:bg-amber-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 capitalize">
                      {format(day, 'EEEE', { locale })}
                    </div>
                    <div
                      className={`text-sm font-bold mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                        isToday ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-800'
                      }`}
                    >
                      {format(day, 'd MMM', { locale })}
                    </div>
                  </div>

                  {!isPast && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickBook(day);
                      }}
                      className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                      title={t.quick_booking?.addBooking || 'Zarezerwuj wizytę'}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Day bookings list */}
                <div className="space-y-1 mt-2">
                  {dayBookings.map(b => {
                    const sc = getStatusColor(b.status);
                    const timeStr = getBookingTime(b);

                    return (
                      <div
                        key={b.id}
                        className={`p-1.5 rounded-lg border text-xs leading-tight ${sc.bg} ${sc.text}`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{timeStr}</span>
                        </div>
                        <div className="truncate font-medium mt-0.5">
                          {b.services ? getServiceName(b.services, language) : 'Rezerwacja'}
                        </div>
                      </div>
                    );
                  })}

                  {dayBookings.length === 0 && (
                    <div className="text-[11px] text-gray-400 italic pt-2">
                      Brak wizyt
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SELECTED DAY INSPECTOR / APPOINTMENT LIST */}
      {selectedDay && (
        <div className="border-t border-gray-200 p-5 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-amber-500" />
              <h4 className="text-base font-bold text-gray-900 capitalize">
                {format(selectedDay, 'EEEE, d MMMM yyyy', { locale })}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {!isBefore(startOfDay(selectedDay), startOfDay(new Date())) && (
                <button
                  onClick={() => onQuickBook(selectedDay)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-xs"
                >
                  <PlusIcon className="h-4 w-4" />
                  {t.quick_booking?.addBooking || 'Zarezerwuj wizytę'}
                </button>
              )}
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {selectedDayBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100 p-6">
              <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2 opacity-40 text-amber-500" />
              <p className="text-sm font-medium text-gray-600">
                {t.admin_bookings?.noBookingsOnDay || 'Brak rezerwacji w wybranym dniu'}
              </p>
              {!isBefore(startOfDay(selectedDay), startOfDay(new Date())) && (
                <button
                  onClick={() => onQuickBook(selectedDay)}
                  className="mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700 underline"
                >
                  + Zarezerwuj wizytę w tym dniu
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayBookings.map(b => renderBookingCard(b))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
