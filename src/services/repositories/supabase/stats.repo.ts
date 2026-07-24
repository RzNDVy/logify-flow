import { supabase } from "@/lib/supabase";
import type { StatsRepo } from "../types";
import type { AdminStats, DateRange, UserStats } from "@/types/domain";
import { format, differenceInCalendarDays, subDays } from "date-fns";

export const supabaseStatsRepo: StatsRepo = {
  async forUser(userId: string): Promise<UserStats> {
    const { data, error } = await supabase
      .from("activities")
      .select("activity_date, project_id")
      .eq("user_id", userId);
      
    if (error) throw new Error(error.message);
    
    const today = format(new Date(), "yyyy-MM-dd");
    const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
    
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    const projectIds = new Set<string>();
    
    const dates = new Set<string>();
    
    (data || []).forEach(row => {
      if (row.activity_date === today) todayCount++;
      if (row.activity_date >= weekAgo) weekCount++;
      if (row.activity_date >= monthAgo) monthCount++;
      projectIds.add(row.project_id);
      dates.add(row.activity_date);
    });
    
    // Calculate streaks
    const sortedDates = [...dates].sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    
    for (const d of sortedDates) {
      const curr = new Date(d);
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const diff = differenceInCalendarDays(curr, lastDate);
        if (diff === 1) tempStreak++;
        else if (diff > 1) tempStreak = 1;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      lastDate = curr;
    }
    
    // Check if current streak is still active (activity today or yesterday)
    if (lastDate) {
      const diffToToday = differenceInCalendarDays(new Date(), lastDate);
      if (diffToToday <= 1) currentStreak = tempStreak;
    }
    
    return {
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      totalActivities: data?.length || 0,
      streak: currentStreak,
      longestStreak: longestStreak,
      activeProjects: projectIds.size,
    };
  },
  
  async forAdmin(): Promise<AdminStats> {
    const [u, p, a, i] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("activities").select("*", { count: "exact", head: true }),
      supabase.from("activity_images").select("*", { count: "exact", head: true }),
    ]);
    
    return {
      totalUsers: u.count || 0,
      activeUsers: u.count || 0,
      totalProjects: p.count || 0,
      totalActivities: a.count || 0,
      activitiesToday: 0,
      activitiesThisWeek: 0,
      activitiesThisMonth: 0,
      totalImages: i.count || 0,
      storageUsedBytes: 0,
    };
  },
  
  async activityTrend(range: DateRange, userId?: string): Promise<Array<{ date: string; count: number }>> {
    let query = supabase
      .from("activities")
      .select("activity_date")
      .gte("activity_date", range.start)
      .lte("activity_date", range.end);
      
    if (userId) query = query.eq("user_id", userId);
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    
    const counts: Record<string, number> = {};
    (data || []).forEach(row => {
      counts[row.activity_date] = (counts[row.activity_date] || 0) + 1;
    });
    
    const result = [];
    let current = new Date(range.start);
    const end = new Date(range.end);
    
    while (current <= end) {
      const d = current.toISOString().split("T")[0];
      result.push({ date: d, count: counts[d] || 0 });
      current.setDate(current.getDate() + 1);
    }
    
    return result;
  },
  
  async byProject(userId?: string): Promise<Array<{ projectId: string; count: number }>> {
    let query = supabase.from("activities").select("project_id");
    if (userId) query = query.eq("user_id", userId);
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    
    const counts: Record<string, number> = {};
    (data || []).forEach(row => {
      counts[row.project_id] = (counts[row.project_id] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([projectId, count]) => ({ projectId, count }))
      .sort((a, b) => b.count - a.count);
  },
  
  async topUsers(limit: number): Promise<Array<{ userId: string; count: number }>> {
    const { data, error } = await supabase.from("activities").select("user_id");
    if (error) throw new Error(error.message);
    
    const counts: Record<string, number> = {};
    (data || []).forEach(row => {
      counts[row.user_id] = (counts[row.user_id] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
};
