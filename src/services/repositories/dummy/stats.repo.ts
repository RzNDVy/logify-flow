import type { StatsRepo } from "../types";
import type { AdminStats, DateRange, UserStats } from "@/types/domain";
import { delay, loadActivities, loadProjects, loadUsers } from "./store";
import { todayISO } from "@/lib/date";
import { startOfMonth, startOfWeek, format, subDays } from "date-fns";

function currentUserStreak(dates: Set<string>): number {
  let streak = 0;
  let d = new Date();
  while (dates.has(format(d, "yyyy-MM-dd"))) {
    streak++;
    d = subDays(d, 1);
  }
  return streak;
}

export const dummyStatsRepo: StatsRepo = {
  async forUser(userId: string): Promise<UserStats> {
    await delay(120);
    const acts = loadActivities().filter((a) => a.userId === userId);
    const today = todayISO();
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const dates = new Set(acts.map((a) => a.date));
    return {
      totalActivities: acts.length,
      thisMonth: acts.filter((a) => a.date >= monthStart).length,
      thisWeek: acts.filter((a) => a.date >= weekStart).length,
      today: acts.filter((a) => a.date === today).length,
      streak: currentUserStreak(dates),
      activeProjects: new Set(acts.map((a) => a.projectId)).size,
    };
  },
  async forAdmin(): Promise<AdminStats> {
    await delay(140);
    const users = loadUsers();
    const acts = loadActivities();
    const projects = loadProjects();
    const today = todayISO();
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    let bytes = 0;
    for (const a of acts) for (const img of a.images) bytes += img.size;
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      totalActivities: acts.length,
      activitiesToday: acts.filter((a) => a.date === today).length,
      activitiesThisWeek: acts.filter((a) => a.date >= weekStart).length,
      activitiesThisMonth: acts.filter((a) => a.date >= monthStart).length,
      totalProjects: projects.length,
      storageUsedBytes: bytes,
    };
  },
  async activityTrend(range: DateRange) {
    await delay(120);
    const acts = loadActivities().filter((a) => a.date >= range.start && a.date <= range.end);
    const counts = new Map<string, number>();
    for (const a of acts) counts.set(a.date, (counts.get(a.date) ?? 0) + 1);
    const out: Array<{ date: string; count: number }> = [];
    const start = new Date(range.start);
    const end = new Date(range.end);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = format(d, "yyyy-MM-dd");
      out.push({ date: iso, count: counts.get(iso) ?? 0 });
    }
    return out;
  },
  async byProject() {
    await delay(100);
    const acts = loadActivities();
    const counts = new Map<string, number>();
    for (const a of acts) counts.set(a.projectId, (counts.get(a.projectId) ?? 0) + 1);
    return Array.from(counts.entries()).map(([projectId, count]) => ({ projectId, count }));
  },
  async topUsers(limit: number) {
    await delay(100);
    const acts = loadActivities();
    const counts = new Map<string, number>();
    for (const a of acts) counts.set(a.userId, (counts.get(a.userId) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
};
