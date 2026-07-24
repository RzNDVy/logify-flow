import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRepositories } from "@/services/repositories/context";
import type { NewUserDTO, UpdateUserDTO } from "@/services/repositories/types";
import type { Role, UserStatus } from "@/types/domain";
import { toast } from "sonner";
import { keys } from "./useActivities";

export function useUsers(query?: { search?: string; role?: Role; status?: UserStatus }) {
  const { users } = useRepositories();
  return useQuery({
    queryKey: keys.users(query),
    queryFn: () => users.list(query),
  });
}

export function useCreateUser() {
  const { users } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewUserDTO) => users.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateUser() {
  const { users } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateUserDTO }) => users.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUser() {
  const { users } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => users.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User removed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
