import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/services/repositories/context";
import type {
  ActivityQuery,
  NewActivityDTO,
  UpdateActivityDTO,
} from "@/services/repositories/types";
import type { DateRange } from "@/types/domain";
import { toast } from "sonner";

export const keys = {
  activities: (q: ActivityQuery) => ["activities", q] as const,
  byDate: (userId: string, date: string) => ["activities", "date", userId, date] as const,
  recent: (userId: string, limit: number) => ["activities", "recent", userId, limit] as const,
  heatmap: (userId: string, range: DateRange) => ["activities", "heatmap", userId, range] as const,
  statsUser: (userId: string) => ["stats", "user", userId] as const,
  statsAdmin: () => ["stats", "admin"] as const,
  projects: () => ["projects"] as const,
  users: (q?: unknown) => ["users", q] as const,
  storage: () => ["storage"] as const,
};

export function useActivitiesList(query: ActivityQuery) {
  const { activities } = useRepositories();
  return useQuery({
    queryKey: keys.activities(query),
    queryFn: () => activities.list(query),
  });
}

export function useActivitiesByDate(userId: string, date: string) {
  const { activities } = useRepositories();
  return useQuery({
    queryKey: keys.byDate(userId, date),
    queryFn: () => activities.byDate(userId, date),
    enabled: !!userId && !!date,
  });
}

export function useRecentActivities(userId: string, limit = 5) {
  const { activities } = useRepositories();
  return useQuery({
    queryKey: keys.recent(userId, limit),
    queryFn: () => activities.recent(userId, limit),
    enabled: !!userId,
  });
}

export function useHeatmap(userId: string, range: DateRange) {
  const { activities } = useRepositories();
  return useQuery({
    queryKey: keys.heatmap(userId, range),
    queryFn: () => activities.heatmap(userId, range),
    enabled: !!userId,
  });
}

function invalidateActivity(qc: ReturnType<typeof useQueryClient>, userId: string) {
  qc.invalidateQueries({ queryKey: ["activities"] });
  qc.invalidateQueries({ queryKey: keys.statsUser(userId) });
  qc.invalidateQueries({ queryKey: keys.statsAdmin() });
  qc.invalidateQueries({ queryKey: keys.storage() });
}

export function useCreateActivity(userId: string) {
  const { activities } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewActivityDTO) => activities.create(input),
    onSuccess: () => {
      invalidateActivity(qc, userId);
      toast.success("Activity logged.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateActivity(userId: string) {
  const { activities } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateActivityDTO }) =>
      activities.update(id, patch),
    onSuccess: () => {
      invalidateActivity(qc, userId);
      toast.success("Activity updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteActivity(userId: string) {
  const { activities } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activities.remove(id),
    onSuccess: () => {
      invalidateActivity(qc, userId);
      toast.success("Activity deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
