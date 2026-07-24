import { useQuery } from "@tanstack/react-query";
import { useRepositories } from "@/services/repositories/context";
import { keys } from "./useActivities";
import type { DateRange } from "@/types/domain";

export function useUserStats(userId: string) {
  const { stats } = useRepositories();
  return useQuery({
    queryKey: keys.statsUser(userId),
    queryFn: () => stats.forUser(userId),
    enabled: !!userId,
  });
}

export function useAdminStats() {
  const { stats } = useRepositories();
  return useQuery({ queryKey: keys.statsAdmin(), queryFn: () => stats.forAdmin() });
}

export function useActivityTrend(range: DateRange, userId?: string) {
  const { stats } = useRepositories();
  return useQuery({
    queryKey: ["stats", "trend", range, userId],
    queryFn: () => stats.activityTrend(range, userId),
  });
}

export function useProjectStats(userId?: string) {
  const { stats } = useRepositories();
  return useQuery({ queryKey: ["stats", "byProject", userId], queryFn: () => stats.byProject(userId) });
}

export function useTopUsers(limit = 5) {
  const { stats } = useRepositories();
  return useQuery({ queryKey: ["stats", "topUsers", limit], queryFn: () => stats.topUsers(limit) });
}

export function useStorageSummary() {
  const { storage } = useRepositories();
  return useQuery({ queryKey: keys.storage(), queryFn: () => storage.summary() });
}
