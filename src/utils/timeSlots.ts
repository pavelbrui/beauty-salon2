import { addMinutes, parseISO, format, isBefore, isAfter } from 'date-fns';
import { TimeSlot } from '../types';

interface WorkingHours {
  start_time: string;
  end_time: string;
}

interface BusySlot {
  start_time: string;
  end_time: string;
}

export const generateAvailableTimeSlots = (
  date: Date,
  workingHours: WorkingHours[],
  busySlots: BusySlot[],
  serviceDuration: number
): TimeSlot[] => {
  const availableSlots: TimeSlot[] = [];
  const slotInterval = 30; // 30-minute intervals

  // Process each working hours period
  for (const period of workingHours) {
    let currentTime = parseISO(`${format(date, 'yyyy-MM-dd')}T${period.start_time}`);
    const endTime = parseISO(`${format(date, 'yyyy-MM-dd')}T${period.end_time}`);

    // Generate slots within working hours
    while (isBefore(currentTime, endTime)) {
      const slotEnd = addMinutes(currentTime, serviceDuration);
      
      // Check if slot overlaps with any busy slots
      const isOverlapping = busySlots.some(busySlot => {
        const busyStart = parseISO(busySlot.start_time);
        const busyEnd = parseISO(busySlot.end_time);
        
        return !(isAfter(currentTime, busyEnd) || isBefore(slotEnd, busyStart));
      });

      if (!isOverlapping) {
        availableSlots.push({
          id: `${format(currentTime, 'HHmm')}`,
          startTime: currentTime.toISOString(),
          endTime: slotEnd.toISOString(),
          isAvailable: true
        });
      }

      currentTime = addMinutes(currentTime, slotInterval);
    }
  }

  return availableSlots;
};