import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useActivitiesList } from "@/hooks/useActivities";
import { useProjects } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useUsers";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectBadge } from "@/components/common/ProjectBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LogIn,
  KeyRound,
  UserPlus,
  UserCheck,
  UserX,
  FileText,
  Activity as ActivityIcon,
  Search,
  RefreshCw,
  Shield,
  FolderPlus,
} from "lucide-react";
import type { AuditActionCategory, AuditLog, Project } from "@/types/domain";

export const Route = createFileRoute("/_app/admin/monitor")({
  head: () => ({
    meta: [
      { title: "Activity Monitor — WAMS Admin" },
      { name: "description", content: "Live activity and audit trails across your organization." },
      { property: "og:title", content: "Activity Monitor — WAMS Admin" },
      { property: "og:description", content: "Live activity and audit trails across your organization." },
    ],
  }),
  component: MonitorPage,
});

function getActionMeta(action: string, category: string) {
  switch (action) {
    case "USER_LOGIN":
      return {
        label: "User Login",
        icon: LogIn,
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      };
    case "ADMIN_EDIT_PASSWORD":
      return {
        label: "Admin Edit Password",
        icon: KeyRound,
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      };
    case "CHANGE_PASSWORD":
      return {
        label: "User Change Password",
        icon: KeyRound,
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      };
    case "CREATE_USER":
      return {
        label: "Create User",
        icon: UserPlus,
        className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
      };
    case "UPDATE_USER":
    case "SET_USER_STATUS":
      return {
        label: "Update User",
        icon: UserCheck,
        className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
      };
    case "REMOVE_USER":
      return {
        label: "Remove User",
        icon: UserX,
        className: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
      };
    case "CREATE_PROJECT":
    case "UPDATE_PROJECT":
    case "REMOVE_PROJECT":
      return {
        label: "Project Management",
        icon: FolderPlus,
        className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
      };
    case "CREATE_ACTIVITY":
      return {
        label: "Add Activity",
        icon: FileText,
        className: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
      };
    case "UPDATE_ACTIVITY":
      return {
        label: "Edit Activity",
        icon: FileText,
        className: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
      };
    case "REMOVE_ACTIVITY":
      return {
        label: "Delete Activity",
        icon: FileText,
        className: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
      };
    default:
      if (category === "auth") {
        return {
          label: "Auth Event",
          icon: Shield,
          className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        };
      }
      return {
        label: action,
        icon: ActivityIcon,
        className: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
      };
  }
}

function MonitorPage() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useProjects();
  const { data: activitiesData } = useActivitiesList({ page: 1, pageSize: 100 });
  const { data: auditData, isFetching, refetch } = useAuditLogs({
    pageSize: 100,
  });

  const um = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const pm = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const combinedLogs = useMemo(() => {
    const rawAudit = auditData?.data || [];

    // Enrich audit logs with resolved user name/email from users map
    const enrichedAudit: AuditLog[] = rawAudit.map((log) => {
      const u = um.get(log.userId);
      const userName = u?.name || log.userName || (log.userId === "system" ? "Sistem" : "Pengguna");
      const userEmail = u?.email || log.userEmail || "";
      return {
        ...log,
        userName,
        userEmail,
        userAvatarUrl: u?.avatarUrl || log.userAvatarUrl,
      };
    });

    // Map existing activity entries from database with full user and project details
    const mappedActivities: AuditLog[] = (activitiesData?.data || []).map((a) => {
      const user = a.user || um.get(a.userId);
      const project = a.project || pm.get(a.projectId);
      const userName = (user?.name && user.name !== "Unknown") ? user.name : (um.get(a.userId)?.name || "Pengguna");
      const userEmail = user?.email || um.get(a.userId)?.email || "";
      const isoTime = a.time ? (a.time.length === 5 ? `${a.time}:00` : a.time) : "00:00:00";
      const projectLabel = project ? `proyek "${project.name}"` : "proyek";
      
      return {
        id: "act-log-" + a.id,
        userId: a.userId || user?.id || "unknown",
        userName,
        userEmail,
        userAvatarUrl: user?.avatarUrl,
        action: "CREATE_ACTIVITY",
        category: "activity",
        details: `${userName} menambahkan aktivitas pada ${projectLabel} [Modul: ${a.module}]: "${a.description}"`,
        metadata: {
          project,
          module: a.module,
          date: a.date,
          time: a.time,
        },
        createdAt: new Date(`${a.date}T${isoTime}`).toISOString(),
      };
    });

    const all = [...enrichedAudit, ...mappedActivities];

    // Filter by user, category, and search text
    return all
      .filter((log) => {
        if (selectedUser !== "all" && log.userId !== selectedUser) return false;
        if (categoryFilter !== "all" && log.category !== categoryFilter) return false;
        if (search) {
          const s = search.toLowerCase();
          const matchAction = log.action.toLowerCase().includes(s);
          const matchDetails = log.details.toLowerCase().includes(s);
          const matchUser = log.userName ? log.userName.toLowerCase().includes(s) : false;
          if (!matchAction && !matchDetails && !matchUser) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [auditData, activitiesData, selectedUser, categoryFilter, search, um, pm]);

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama pengguna, aksi, atau aktivitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="auth">Auth & Login</SelectItem>
              <SelectItem value="user">User Management</SelectItem>
              <SelectItem value="activity">Aktivitas Log</SelectItem>
              <SelectItem value="project">Proyek</SelectItem>
              <SelectItem value="system">Sistem</SelectItem>
            </SelectContent>
          </Select>

          {/* User Filter */}
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Pengguna" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pengguna</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Activity Trail Card Feed */}
      <Card className="divide-y">
        {combinedLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Tidak ada riwayat aktivitas yang sesuai dengan filter pencarian.
          </div>
        ) : (
          combinedLogs.map((log) => {
            const meta = getActionMeta(log.action, log.category);
            const Icon = meta.icon;
            const logDate = new Date(log.createdAt);
            const project = log.metadata?.project as Project | undefined;
            const moduleName = log.metadata?.module as string | undefined;
            const initial = log.userName ? log.userName.charAt(0).toUpperCase() : "U";

            return (
              <div key={log.id} className="flex gap-3.5 p-4 transition-colors hover:bg-muted/40">
                {/* Event Icon Avatar */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold border text-sm ${meta.className}`}>
                  {log.userAvatarUrl ? (
                    <img src={log.userAvatarUrl} alt={log.userName} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {log.userName}
                    </span>
                    {log.userEmail && (
                      <span className="text-xs text-muted-foreground">({log.userEmail})</span>
                    )}
                    <Badge variant="outline" className={`text-[11px] font-semibold ${meta.className}`}>
                      <Icon className="mr-1 inline-block h-3 w-3" />
                      {meta.label}
                    </Badge>
                    {project && <ProjectBadge project={project} />}
                    {moduleName && (
                      <span className="text-xs font-medium text-muted-foreground">· Modul: {moduleName}</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed font-normal">{log.details}</p>
                </div>

                {/* Timestamp */}
                <div className="shrink-0 text-right text-xs text-muted-foreground whitespace-nowrap">
                  <div className="font-medium">{logDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                  <div className="font-mono text-[11px]">{logDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
