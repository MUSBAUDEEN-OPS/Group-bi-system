import type { DateWindow } from "./config.js";

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function eachDay(startIso: string, endIso: string): string[] {
  const days: string[] = [];
  const cur = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  while (cur <= end) {
    days.push(toIsoDate(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

export function isInWindow(dateIso: string, window: DateWindow): boolean {
  return dateIso >= window.start && dateIso <= window.end;
}

export function isInAnyWindow(dateIso: string, windows: DateWindow[]): boolean {
  return windows.some((w) => isInWindow(dateIso, w));
}

export function isWeekend(dateIso: string): boolean {
  const day = new Date(`${dateIso}T00:00:00Z`).getUTCDay();
  return day === 5 || day === 6; // Fri/Sat weekend (common in the region this data models)
}

export function monthOf(dateIso: string): string {
  return dateIso.slice(0, 7);
}

// Growth multiplier for a given month relative to the fiscal year's first
// month, applying GROWTH_TREND_MONTHLY compounded.
export function growthMultiplier(monthIndex: number, monthlyRate: number): number {
  return (1 + monthlyRate) ** monthIndex;
}
