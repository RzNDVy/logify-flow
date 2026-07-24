import type { Activity } from "@/types/domain";
import { daysBetween, todayISO } from "@/lib/date";

export const EDIT_WINDOW_DAYS = 7;

export function isWithinEditWindow(dateISO: string, now: Date = new Date()): boolean {
  const diff = daysBetween(dateISO, now);
  return diff >= 0 && diff <= EDIT_WINDOW_DAYS;
}

export function canCreateForDate(dateISO: string, now: Date = new Date()): boolean {
  const diff = daysBetween(dateISO, now);
  // Cannot log for future days; can backfill up to EDIT_WINDOW_DAYS.
  return diff >= 0 && diff <= EDIT_WINDOW_DAYS;
}

export function canModify(activity: Activity, now: Date = new Date()): boolean {
  return isWithinEditWindow(activity.date, now);
}

export function canDelete(activity: Activity, now: Date = new Date()): boolean {
  return isWithinEditWindow(activity.date, now);
}

export function lockReason(activity: Activity, now: Date = new Date()): string | null {
  if (canModify(activity, now)) return null;
  return `Locked — activities older than ${EDIT_WINDOW_DAYS} days can't be edited.`;
}

export function isToday(dateISO: string): boolean {
  return dateISO === todayISO();
}

export function isFuture(dateISO: string, now: Date = new Date()): boolean {
  return daysBetween(dateISO, now) < 0;
}
