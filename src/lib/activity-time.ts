/**
 * Utility rules for Activity End Time calculations:
 * 
 * Rules:
 * 1. If description contains "scrum" or "daily" (case-insensitive, e.g. "scrum", "daily", "daily review", 
 *    "daily scrum", "Daily Review Before Scrum"):
 *    -> Duration is 3 hours.
 *    -> Note: Even if both "daily" and "scrum" appear (e.g. "Daily Review Before Scrum"), 
 *       duration is STILL 3 hours (do NOT stack 3 + 3).
 * 2. Otherwise (no scrum/daily keywords):
 *    -> Duration is 5 hours.
 * 3. System Auto End-Time:
 *    -> If no end time is specified by 23:00 (11 PM) or for completed dates, system automatically 
 *       inputs the calculated end time based on the rules above. User can still edit it anytime.
 */

export function getAutoDurationHours(description: string): number {
  if (!description) return 5;
  // Case-insensitive regex check for scrum or daily keywords
  const hasScrumOrDaily = /scrum|daily/i.test(description);
  return hasScrumOrDaily ? 3 : 5;
}

/**
 * Calculates end time string (HH:mm) given a start time string (HH:mm or HH:mm:ss) and duration in hours.
 */
export function calculateEndTime(startTime: string, durationHours: number): string {
  if (!startTime) return "";
  const parts = startTime.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);
  
  if (isNaN(hours) || isNaN(minutes)) return startTime;
  
  const endHours = (hours + durationHours) % 24;
  const paddedH = String(endHours).padStart(2, "0");
  const paddedM = String(minutes).padStart(2, "0");
  
  return `${paddedH}:${paddedM}`;
}

/**
 * Gets the auto end time based on activity start time and description.
 */
export function getAutoEndTime(startTime: string, description: string): string {
  const duration = getAutoDurationHours(description);
  return calculateEndTime(startTime, duration);
}

/**
 * Resolves the effective end time for an activity:
 * Returns explicit endTime if set, otherwise returns calculated auto end time.
 */
export function getEffectiveEndTime(startTime: string, description: string, explicitEndTime?: string): string {
  if (explicitEndTime && explicitEndTime.trim() !== "") {
    return explicitEndTime;
  }
  return getAutoEndTime(startTime, description);
}

/**
 * Checks if auto-fill should be applied at 23:00 (11 PM) or for past days.
 */
export function shouldAutoFillEndTime(activityDateISO: string, now: Date = new Date()): boolean {
  const todayStr = now.toISOString().split("T")[0];
  if (activityDateISO < todayStr) return true; // Past date
  if (activityDateISO === todayStr && now.getHours() >= 23) return true; // 11 PM or later today
  return false;
}
