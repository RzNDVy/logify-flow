import { supabase } from "@/lib/supabase";
import type { AuditLogRepo, AuditLogQuery } from "../types";
import type { AuditLog, Paginated } from "@/types/domain";

// In-memory audit log storage fallback
const memoryAuditLogs: AuditLog[] = [
  {
    id: "system-init-1",
    userId: "system",
    userName: "System",
    action: "SYSTEM_INIT",
    category: "system",
    details: "System Activity Monitor initialized.",
    createdAt: new Date().toISOString(),
  },
];

const mapAuditLog = (row: any): AuditLog => ({
  id: row.id,
  userId: row.user_id || row.userId || "system",
  userName: row.user_name || row.users?.name || row.userName || "Unknown User",
  userEmail: row.user_email || row.users?.email || row.userEmail,
  userAvatarUrl: row.user_avatar || row.users?.avatar_url || row.userAvatarUrl,
  action: row.action,
  category: row.category || (row.entity ? "system" : "activity"),
  details: row.details || row.action || "User action logged",
  metadata: row.old_data || row.new_data || row.metadata || {},
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
});

export const supabaseAuditLogRepo: AuditLogRepo = {
  async list(query?: AuditLogQuery): Promise<Paginated<AuditLog>> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 50;

    try {
      let q = supabase
        .from("audit_logs")
        .select("*, users:user_id(name, email, avatar_url)");

      if (query?.userId) {
        q = q.eq("user_id", query.userId);
      }
      if (query?.category) {
        q = q.eq("category", query.category);
      }
      if (query?.search) {
        q = q.or(`action.ilike.%${query.search}%,details.ilike.%${query.search}%`);
      }

      const { data, error } = await q
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        throw error;
      }

      const logsFromDb = (data || []).map(mapAuditLog);
      
      // Combine DB logs with memory logs if memory logs exist
      const allLogs = [...memoryAuditLogs, ...logsFromDb].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Filter in memory for extra accuracy if needed
      let filtered = allLogs;
      if (query?.userId) {
        filtered = filtered.filter((l) => l.userId === query.userId);
      }
      if (query?.category) {
        filtered = filtered.filter((l) => l.category === query.category);
      }
      if (query?.search) {
        const s = query.search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.action.toLowerCase().includes(s) ||
            l.details.toLowerCase().includes(s) ||
            (l.userName && l.userName.toLowerCase().includes(s))
        );
      }

      return {
        data: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
      };
    } catch {
      // Fallback to memory logs if table does not exist or fetch fails
      let filtered = [...memoryAuditLogs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      if (query?.userId) {
        filtered = filtered.filter((l) => l.userId === query.userId);
      }
      if (query?.category) {
        filtered = filtered.filter((l) => l.category === query.category);
      }
      if (query?.search) {
        const s = query.search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.action.toLowerCase().includes(s) ||
            l.details.toLowerCase().includes(s) ||
            (l.userName && l.userName.toLowerCase().includes(s))
        );
      }
      return {
        data: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
      };
    }
  },

  async create(input: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: "audit-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      userAvatarUrl: input.userAvatarUrl,
      action: input.action,
      category: input.category,
      details: input.details,
      metadata: input.metadata || {},
      createdAt: new Date().toISOString(),
    };

    // Save to memory
    memoryAuditLogs.unshift(newLog);

    // Try inserting into Supabase audit_logs table
    try {
      await supabase.from("audit_logs").insert({
        user_id: input.userId !== "system" ? input.userId : null,
        entity: input.category,
        entity_id: input.userId !== "system" ? input.userId : "00000000-0000-0000-0000-000000000000",
        action: input.action,
        category: input.category,
        details: input.details,
        metadata: input.metadata || {},
      });
    } catch {
      // Ignored if table or RPC not configured yet
    }

    return newLog;
  },
};
