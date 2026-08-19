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
  parseISO
} from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { Booking, Stylist } from '../../types';
import { translations } from '../../i18n/translations';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  PlusIcon,
  XMarkIcon,
  UserIcon,
  ClockIcon,
  PencilIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const dateLocales = { pl, en: enUS, ru };

export type CalendarSubView = 'month' | 'week' | 'day';

interface AdminCalendarViewProps {
  bookings: Booking[];
  stylists: Stylist[];
  onSelectBooking: (booking: Booking) => void;
  onCreateBookingForSlot: (stylistId: string | null, date: Date, timeStr?: string) => void;
  language: string;
}

export const AdminCalendarView: React.FC<AdminCalendarViewProps> = ({
  bookings,
  stylists,
  onSelectBooking,
  onCreateBookingForSlot,
  language
}) => {
  const t = translations[language as keyof typeof translations] || translations.pl;
  const ab = t.admin_bookings;
  const locale = dateLocales[language as keyof typeof dateLocales] || pl;

  const [subView, setSubView] = useState<CalendarSubView>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [drawerDate, setDrawerDate] = useState<Date | null>(null);

  // Time grid range for Week & Day views
  const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

  // Navigation helpers
  const handlePrev = () => {
    if (subView === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (subView === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (subView === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (subView === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group bookings by date key "yyyy-MM-dd"
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

    // Sort each day's bookings chronologically
    Object.values(map).forEach(list => {
      list.sort((a, b) => {
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

  // Weekday column titles
  const weekDayHeaders = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      return format(day, 'EEEEEE', { locale });
    });
  }, [locale]);

  // Status style helper
  const getStatusBadge = (status: string, isBooksy?: boolean) => {
    if (isBooksy) {
      return 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100';
    }
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'cancelled':
        return 'bg-rose-50 text-rose-600 line-through border-rose-200 opacity-60 hover:opacity-80';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
    }
  };

  // Helper to extract display time
  const getBookingTime = (b: Booking) => {
    const st = b.time_slots?.start_time || b.start_time;
    if (!st) return '';
    try {
      return format(parseISO(st), 'HH:mm');
    } catch {
      return '';
    }
  };

  // Helper to extract service label
  const getServiceLabel = (b: Booking) => {
    if (b.services?.name) return b.services.name;
    if (b.notes && b.notes.includes('Blokada Czasu')) return 'Blokada czasu';
    return b.notes || 'Inna usługa';
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
      {/* Calendar Header & Controls */}
      <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Date Title + Nav */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              title="Poprzedni"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {ab.today || 'Dzisiaj'}
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              title="Następny"
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
            {subView === 'day' && format(currentDate, 'EEEE, d MMMM yyyy', { locale })}
          </h3>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-gray-200/70 p-1 rounded-lg">
          <button
            onClick={() => setSubView('month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              subView === 'month'
                ? 'bg-white text-amber-700 shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {ab.viewMonth || 'Miesiąc'}
          </button>
          <button
            onClick={() => setSubView('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              subView === 'week'
                ? 'bg-white text-amber-700 shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {ab.viewWeek || 'Tydzień'}
          </button>
          <button
            onClick={() => setSubView('day')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              subView === 'day'
                ? 'bg-white text-amber-700 shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {ab.viewDay || 'Dzień (Styliści)'}
          </button>
        </div>
      </div>

      {/* VIEW 1: MONTH VIEW */}
      {subView === 'month' && (
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
            {weekDayHeaders.map((day, i) => (
              <div key={i} className="py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
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

              return (
                <div
                  key={i}
                  className={`min-h-[110px] sm:min-h-[125px] p-1.5 transition-colors relative group ${
                    !isCurrentMonth ? 'bg-gray-50/60' : 'hover:bg-amber-50/30'
                  }`}
                >
                  {/* Day number header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-medium inline-flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-amber-500 text-white w-6 h-6 font-bold shadow-sm'
                          : isCurrentMonth
                          ? 'text-gray-800'
                          : 'text-gray-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Quick "+" icon on hover */}
                    <button
                      onClick={() => onCreateBookingForSlot(null, day)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-100 rounded transition-all"
                      title={ab.newBooking || 'Dodaj rezerwację'}
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Day booking badges */}
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map(b => {
                      const badgeStyle = getStatusBadge(b.status, b._isBooksy);
                      const timeStr = getBookingTime(b);
                      const serviceName = getServiceLabel(b);
                      const stylistName = b.stylists?.name ? ` • ${b.stylists.name.split(' ')[0]}` : '';

                      return (
                        <button
                          key={b.id}
                          onClick={() => (!b._isBooksy ? onSelectBooking(b) : setDrawerDate(day))}
                          className={`w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded border ${badgeStyle} transition-all truncate block shadow-2xs`}
                          title={`${timeStr} ${serviceName} (${b.contact_name || b.contact_email || 'Klient'})${stylistName}`}
                        >
                          <span className="font-semibold">{timeStr}</span>{' '}
                          <span className="truncate">{serviceName}</span>
                          <span className="text-[10px] opacity-75">{stylistName}</span>
                        </button>
                      );
                    })}

                    {/* Overflow link */}
                    {dayBookings.length > 3 && (
                      <button
                        onClick={() => setDrawerDate(day)}
                        className="w-full text-left text-[11px] font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-1.5 py-0.5 rounded transition-colors"
                      >
                        +{dayBookings.length - 3} {ab.more || 'więcej'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK VIEW */}
      {subView === 'week' && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week day headers */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50/50">
              <div className="py-3 px-2 text-center text-xs font-semibold text-gray-400">
                Czas
              </div>
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={i}
                    className={`py-2.5 px-2 text-center border-l border-gray-200 ${
                      isToday ? 'bg-amber-50/70' : ''
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-500 capitalize">
                      {format(day, 'EEE', { locale })}
                    </div>
                    <div
                      className={`text-sm font-bold mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                        isToday ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-800'
                      }`}
                    >
                      {format(day, 'd MMM', { locale })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid for Week */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] divide-y divide-gray-100 bg-white">
              {HOURS.map(hour => {
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;

                return (
                  <React.Fragment key={hour}>
                    <div className="py-4 px-2 text-center text-xs font-medium text-gray-400 bg-gray-50/30">
                      {timeStr}
                    </div>

                    {weekDays.map((day, dayIdx) => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const dayBookings = bookingsByDate[dateKey] || [];
                      // Filter bookings starting around this hour
                      const hourBookings = dayBookings.filter(b => {
                        const st = b.time_slots?.start_time || b.start_time;
                        if (!st) return false;
                        const bHour = parseISO(st).getHours();
                        return bHour === hour;
                      });

                      return (
                        <div
                          key={dayIdx}
                          onClick={() => onCreateBookingForSlot(null, day, timeStr)}
                          className="min-h-[64px] border-l border-gray-200 p-1 hover:bg-amber-50/20 cursor-pointer relative group transition-colors"
                        >
                          {hourBookings.map(b => {
                            const badgeStyle = getStatusBadge(b.status, b._isBooksy);
                            const bTime = getBookingTime(b);

                            return (
                              <div
                                key={b.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!b._isBooksy) onSelectBooking(b);
                                }}
                                className={`mb-1 p-1.5 rounded-lg border text-xs leading-tight shadow-xs ${badgeStyle} transition-all cursor-pointer`}
                              >
                                <div className="font-bold flex items-center justify-between">
                                  <span>{bTime}</span>
                                  {b.stylists?.name && (
                                    <span className="text-[10px] font-medium opacity-80 truncate max-w-[70px]">
                                      {b.stylists.name.split(' ')[0]}
                                    </span>
                                  )}
                                </div>
                                <div className="font-medium truncate">{getServiceLabel(b)}</div>
                                <div className="text-[10px] opacity-75 truncate">{b.contact_name || 'Klient'}</div>
                              </div>
                            );
                          })}

                          {hourBookings.length === 0 && (
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-600 font-medium flex items-center justify-center h-full">
                              + Dodaj {timeStr}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: DAY VIEW (MULTI-STYLIST TIMELINE) */}
      {subView === 'day' && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Stylist Columns Header */}
            <div
              className="grid border-b border-gray-200 bg-gray-50/80"
              style={{ gridTemplateColumns: `80px repeat(${Math.max(stylists.length, 1)}, 1fr)` }}
            >
              <div className="py-3 px-2 text-center text-xs font-semibold text-gray-400">
                Czas
              </div>
              {stylists.map(stylist => (
                <div key={stylist.id} className="py-3 px-3 border-l border-gray-200 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {stylist.photo_url ? (
                      <img
                        src={stylist.photo_url}
                        alt={stylist.name}
                        className="w-6 h-6 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                        {stylist.name[0]}
                      </div>
                    )}
                    <span className="text-sm font-bold text-gray-900 truncate">{stylist.name}</span>
                  </div>
                </div>
              ))}
              {stylists.length === 0 && (
                <div className="py-3 px-3 border-l border-gray-200 text-center text-sm text-gray-500 font-medium">
                  {ab.allStylists || 'Wszyscy styliści'}
                </div>
              )}
            </div>

            {/* Time Grid per Stylist */}
            <div className="divide-y divide-gray-100 bg-white">
              {HOURS.map(hour => {
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                const dateKey = format(currentDate, 'yyyy-MM-dd');
                const dayBookings = bookingsByDate[dateKey] || [];

                return (
                  <div
                    key={hour}
                    className="grid"
                    style={{ gridTemplateColumns: `80px repeat(${Math.max(stylists.length, 1)}, 1fr)` }}
                  >
                    {/* Time Label */}
                    <div className="py-4 px-2 text-center text-xs font-medium text-gray-400 bg-gray-50/30">
                      {timeStr}
                    </div>

                    {/* Stylist Columns */}
                    {(stylists.length > 0 ? stylists : [{ id: null, name: 'Wszyscy' }]).map((stylist, sIdx) => {
                      // Filter bookings for this hour & stylist
                      const colBookings = dayBookings.filter(b => {
                        const st = b.time_slots?.start_time || b.start_time;
                        if (!st) return false;
                        const bHour = parseISO(st).getHours();
                        if (bHour !== hour) return false;
                        if (stylist.id == null) return true;
                        return b.stylist_id === stylist.id || (b.time_slots as { stylist_id?: string })?.stylist_id === stylist.id;
                      });

                      return (
                        <div
                          key={sIdx}
                          onClick={() => onCreateBookingForSlot(stylist.id, currentDate, timeStr)}
                          className="min-h-[64px] border-l border-gray-200 p-1 hover:bg-amber-50/20 cursor-pointer relative group transition-colors"
                        >
                          {colBookings.map(b => {
                            const badgeStyle = getStatusBadge(b.status, b._isBooksy);
                            const bTime = getBookingTime(b);

                            return (
                              <div
                                key={b.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!b._isBooksy) onSelectBooking(b);
                                }}
                                className={`mb-1 p-2 rounded-lg border text-xs leading-tight shadow-sm ${badgeStyle} transition-all cursor-pointer`}
                              >
                                <div className="font-bold flex items-center justify-between mb-0.5">
                                  <span>{bTime}</span>
                                  {b._isBooksy && (
                                    <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-sky-200 text-sky-800">
                                      Booksy
                                    </span>
                                  )}
                                </div>
                                <div className="font-semibold text-gray-900 truncate">{getServiceLabel(b)}</div>
                                <div className="text-[11px] text-gray-600 truncate mt-0.5">
                                  👤 {b.contact_name || b.contact_email || 'Klient'}
                                </div>
                                {b.contact_phone && (
                                  <div className="text-[10px] text-gray-500 truncate">
                                    📞 {b.contact_phone}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {colBookings.length === 0 && (
                            <span className="opacity-0 group-hover:opacity-100 text-[11px] text-amber-600 font-semibold flex items-center justify-center h-full">
                              + Rezerwuj o {timeStr}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE DAY DRAWER / MODAL */}
      {drawerDate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarDaysIcon className="h-6 w-6 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 capitalize">
                    {format(drawerDate, 'EEEE, d MMMM yyyy', { locale })}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {(bookingsByDate[format(drawerDate, 'yyyy-MM-dd')] || []).length}{' '}
                    {(bookingsByDate[format(drawerDate, 'yyyy-MM-dd')] || []).length === 1 ? 'rezerwacja' : 'rezerwacje'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDrawerDate(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Action Bar */}
            <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <span className="text-xs text-amber-800 font-medium">
                {ab.clickToCreateSlot || 'Kliknij wolny termin aby dodać rezerwację'}
              </span>
              <button
                onClick={() => {
                  const d = drawerDate;
                  setDrawerDate(null);
                  onCreateBookingForSlot(null, d);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-xs"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {ab.newBooking || 'Nowa rezerwacja'}
              </button>
            </div>

            {/* Drawer Content: Bookings List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {(bookingsByDate[format(drawerDate, 'yyyy-MM-dd')] || []).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CalendarDaysIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">{ab.noBookingsOnDay || 'Brak rezerwacji w wybranym dniu'}</p>
                </div>
              ) : (
                (bookingsByDate[format(drawerDate, 'yyyy-MM-dd')] || []).map(b => {
                  const badgeStyle = getStatusBadge(b.status, b._isBooksy);
                  const timeStr = getBookingTime(b);
                  const serviceName = getServiceLabel(b);

                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-xl border ${badgeStyle} shadow-sm transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">{timeStr}</span>
                            <h4 className="font-bold text-gray-900">{serviceName}</h4>
                          </div>

                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <UserIcon className="h-3.5 w-3.5 text-amber-500" />
                              <span className="font-medium text-gray-800">
                                {b.contact_name || b.contact_email || 'Brak danych klienta'}
                              </span>
                            </div>

                            {b.contact_phone && (
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <PhoneIcon className="h-3.5 w-3.5 text-gray-400" />
                                <a href={`tel:${b.contact_phone}`} className="hover:underline text-amber-700">
                                  {b.contact_phone}
                                </a>
                              </div>
                            )}

                            {b.stylists?.name && (
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <ClockIcon className="h-3.5 w-3.5 text-gray-400" />
                                <span>Stylistka: {b.stylists.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {!b._isBooksy && (
                          <button
                            onClick={() => {
                              setDrawerDate(null);
                              onSelectBooking(b);
                            }}
                            className="p-2 text-amber-700 hover:bg-amber-200/60 rounded-lg transition-colors flex-shrink-0"
                            title={ab.edit || 'Edytuj'}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
