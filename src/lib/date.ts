import {
  format,
  parseISO,
  differenceInCalendarDays,
  startOfWeek,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isValid,
} from "date-fns";

export const ISO_DATE = "yyyy-MM-dd";

export function todayISO(): string {
  return format(new Date(), ISO_DATE);
}

export function toISODate(d: Date | string): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, ISO_DATE);
}

export function fromISO(d: string): Date {
  return parseISO(d);
}

export function isValidISODate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  return isValid(parseISO(v));
}

export function daysBetween(a: string | Date, b: string | Date): number {
  const da = typeof a === "string" ? parseISO(a) : a;
  const db = typeof b === "string" ? parseISO(b) : b;
  return differenceInCalendarDays(db, da);
}

export function humanDate(d: string | Date): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "EEEE, MMMM d, yyyy");
}

export function shortDate(d: string | Date): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "MMM d, yyyy");
}

export function monthLabel(d: string | Date): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "MMMM yyyy");
}

export {
  format,
  parseISO,
  addDays,
  subDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
};
