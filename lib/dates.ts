export const PROGRAM_START_DATE = new Date("2025-12-11T00:00:00");
export const PROGRAM_DAYS = [
  new Date("2025-12-11T00:00:00"),
  new Date("2025-12-12T00:00:00"),
  new Date("2025-12-13T00:00:00"),
  new Date("2025-12-14T00:00:00"),
];

// Confirmation window: 5pm (17:00) to 9pm (21:00) each day
export const CONFIRMATION_START_HOUR = 17; // 5pm
export const CONFIRMATION_END_HOUR = 21; // 9pm

export function getDayDate(day: number): Date {
  if (day < 1 || day > 4) {
    throw new Error("Day must be between 1 and 4");
  }
  return PROGRAM_DAYS[day - 1];
}

export function isDayReached(day: number): boolean {
  const dayDate = getDayDate(day);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  dayDate.setHours(0, 0, 0, 0);
  return now >= dayDate;
}

export function isProgramStarted(): boolean {
  return isDayReached(1);
}

/**
 * Checks if the current time is within the confirmation window (5pm-9pm) for a given day
 */
export function isWithinConfirmationWindow(day: number): boolean {
  const now = new Date();
  const dayDate = getDayDate(day);

  // Set to the start of the day
  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);

  // Set confirmation window times
  const windowStart = new Date(dayStart);
  windowStart.setHours(CONFIRMATION_START_HOUR, 0, 0, 0);

  const windowEnd = new Date(dayStart);
  windowEnd.setHours(CONFIRMATION_END_HOUR, 0, 0, 0);

  return now >= windowStart && now < windowEnd;
}

/**
 * Gets the current day if we're within the confirmation window, otherwise returns null
 */
export function getCurrentDay(): number | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let day = 1; day <= 4; day++) {
    const dayDate = getDayDate(day);
    dayDate.setHours(0, 0, 0, 0);
    if (now.getTime() === dayDate.getTime()) {
      // Check if we're within the confirmation window for this day
      if (isWithinConfirmationWindow(day)) {
        return day;
      }
    }
  }

  return null;
}

/**
 * Gets the current day regardless of time window (for display purposes)
 */
export function getCurrentDayDate(): number | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let day = 1; day <= 4; day++) {
    const dayDate = getDayDate(day);
    dayDate.setHours(0, 0, 0, 0);
    if (now.getTime() === dayDate.getTime()) {
      return day;
    }
  }

  return null;
}

export function getPastDays(): number[] {
  const pastDays: number[] = [];
  for (let day = 1; day <= 4; day++) {
    if (isDayReached(day)) {
      pastDays.push(day);
    }
  }
  return pastDays;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getDayName(day: number): string {
  const dayDate = getDayDate(day);
  return dayDate.toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Formats the confirmation window time range for a day
 */
export function getConfirmationWindowText(): string {
  return `5:00 PM - 9:00 PM`;
}

/**
 * Checks if confirmation is currently open (within window for today)
 */
export function isConfirmationOpen(): boolean {
  const currentDay = getCurrentDayDate();
  if (!currentDay) return false;
  return isWithinConfirmationWindow(currentDay);
}
