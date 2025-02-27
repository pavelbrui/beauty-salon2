import { addDays, isBefore, startOfDay, endOfDay, isValid } from 'date-fns';

export const generateRecurringDates = (startDate: Date, endDate: Date, dayOfWeek?: number): Date[] => {
  const dates: Date[] = [];
  let currentDate = startOfDay(startDate);
  const until = endOfDay(endDate);
  const targetDayOfWeek = dayOfWeek ?? startDate.getDay();

  while (isBefore(currentDate, until)) {
    if (currentDate.getDay() === targetDayOfWeek) {
      dates.push(new Date(currentDate));
    }
    currentDate = addDays(currentDate, 1); // Check each day
  }

  return dates;
};