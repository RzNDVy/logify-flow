import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/services/repositories/context";
import type { NewProjectDTO, UpdateProjectDTO } from "@/services/repositories/types";
import { toast } from "sonner";
import { keys } from "./useActivities";

export function useProjects() {
  const { projects } = useRepositories();
  return useQuery({
    queryKey: keys.projects(),
    queryFn: () => projects.list(),
    staleTime: 60_000,
  });
}

export function useCreateProject() {
  const { projects } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewProjectDTO) => projects.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.projects() });
      toast.success("Project created.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProject() {
  const { projects } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateProjectDTO }) =>
      projects.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.projects() });
      toast.success("Project updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const { projects } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projects.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.projects() });
      toast.success("Project deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
