import { addMinutes, parseISO, format, isBefore, isAfter } from 'date-fns';
import { TimeSlot } from '../types';

interface WorkingHours {
  stylist_id: string;
  start_time: string;
  end_time: string;
}

interface BusySlot {
  start_time: string;
  end_time: string;
  stylist_id?: string;
}

/**
 * Generates available time slots based on stylist working hours,
 * filtering out busy (already booked) periods.
 *
 * Slots are generated at 30-minute intervals. Each slot's duration
 * equals the service duration. Slots that extend past the working
 * period end are excluded.
 *
 * When multiple stylists have overlapping availability, the first
 * available stylist is auto-assigned (deduplication by time).
 */
export const generateAvailableTimeSlots = (
  date: Date,
  workingHours: WorkingHours[],
  busySlots: BusySlot[],
  serviceDuration: number
): TimeSlot[] => {
  const availableSlots: TimeSlot[] = [];
  const slotInterval = 30;
  const seen = new Set<string>();

  for (const period of workingHours) {
    const dateStr = format(date, 'yyyy-MM-dd');
    let currentTime = parseISO(`${dateStr}T${period.start_time}`);
    const periodEnd = parseISO(`${dateStr}T${period.end_time}`);

    // Pre-filter busy slots relevant to this stylist
    const stylistBusy = busySlots.filter(bs =>
      !bs.stylist_id || bs.stylist_id === period.stylist_id
    );

    while (isBefore(currentTime, periodEnd)) {
      const slotEnd = addMinutes(currentTime, serviceDuration);

      // Slot must fit entirely within working hours
      if (isAfter(slotEnd, periodEnd)) {
        break;
      }

      const timeKey = format(currentTime, 'HHmm');

      // Check if this time overlaps with any busy slot for this stylist
      const isOverlapping = stylistBusy.some(busySlot => {
        const busyStart = parseISO(busySlot.start_time);
        const busyEnd = parseISO(busySlot.end_time);
        return isBefore(currentTime, busyEnd) && isBefore(busyStart, slotEnd);
      });

      // Deduplicate: show one slot per time, pick first available stylist
      if (!isOverlapping && !seen.has(timeKey)) {
        seen.add(timeKey);
        availableSlots.push({
          id: `${period.stylist_id}-${timeKey}`,
          stylistId: period.stylist_id,
          startTime: currentTime.toISOString(),
          endTime: slotEnd.toISOString(),
          isAvailable: true
        });
      }

      currentTime = addMinutes(currentTime, slotInterval);
    }
  }

  return availableSlots.sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
};