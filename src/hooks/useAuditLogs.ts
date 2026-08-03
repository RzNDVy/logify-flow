import { useQuery } from "@tanstack/react-query";
import { useRepositories } from "@/services/repositories/context";
import type { AuditLogQuery } from "@/services/repositories/types";

export function useAuditLogs(query?: AuditLogQuery) {
  const { auditLogs } = useRepositories();
  return useQuery({
    queryKey: ["auditLogs", query],
    queryFn: () => auditLogs.list(query),
    refetchInterval: 5000, // auto refetch live activity every 5 seconds
  });
}
