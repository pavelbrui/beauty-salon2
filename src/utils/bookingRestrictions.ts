export interface BookingRestrictions {
  minAdvanceHours: number;
  nightStartHour: number;
  nightEndHour: number;
  nightMinSlotHour: number;
}

export const DEFAULT_RESTRICTIONS: BookingRestrictions = {
  minAdvanceHours: 3,
  nightStartHour: 22,
  nightEndHour: 6,
  nightMinSlotHour: 10,
};

export function isSlotBookable(
  slotStartTime: Date,
  restrictions: BookingRestrictions,
  now: Date = new Date()
): boolean {
  // Check 1: minimum advance hours
  const diffMs = slotStartTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < restrictions.minAdvanceHours) return false;

  // Check 2: night booking restriction
  const currentHour = now.getHours();
  const isNight = restrictions.nightStartHour > restrictions.nightEndHour
    ? (currentHour >= restrictions.nightStartHour || currentHour < restrictions.nightEndHour)
    : (currentHour >= restrictions.nightStartHour && currentHour < restrictions.nightEndHour);

  if (isNight && slotStartTime.getHours() < restrictions.nightMinSlotHour) return false;

  return true;
}
