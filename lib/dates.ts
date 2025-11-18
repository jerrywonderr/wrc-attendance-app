export const PROGRAM_START_DATE = new Date("2025-16-11T00:00:00");
export const PROGRAM_DAYS = [
  new Date("2025-11-16T00:00:00"),
  new Date("2025-11-17T00:00:00"),
  new Date("2025-11-18T00:00:00"),
  new Date("2025-11-19T00:00:00"),
];

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

export function getCurrentDay(): number | null {
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

