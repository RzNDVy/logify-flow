import { createFileRoute } from "@tanstack/react-router";
import { useActivitiesList } from "@/hooks/useActivities";
import { useProjects } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useUsers";
import { Card } from "@/components/ui/card";
import { ProjectBadge } from "@/components/common/ProjectBadge";
import { shortDate } from "@/lib/date";

export const Route = createFileRoute("/_app/admin/monitor")({
  head: () => ({
    meta: [
      { title: "Activity Monitor — WAMS Admin" },
      { name: "description", content: "Live activity across your organization." },
      { property: "og:title", content: "Activity Monitor — WAMS Admin" },
      { property: "og:description", content: "Live activity across your organization." },
    ],
  }),
  component: MonitorPage,
});

function MonitorPage() {
  const { data } = useActivitiesList({ page: 1, pageSize: 50 });
  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();
  const pm = new Map(projects.map((p) => [p.id, p]));
  const um = new Map(users.map((u) => [u.id, u]));
  return (
    <Card className="divide-y">
      {(data?.data ?? []).map((a) => {
        const p = pm.get(a.projectId);
        const u = um.get(a.userId);
        return (
          <div key={a.id} className="flex gap-3 p-4">
            <div className="w-24 shrink-0 text-xs text-muted-foreground">
              {shortDate(a.date)}
              <div>{a.time}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{u?.name ?? a.userId}</span>
                {p && <ProjectBadge project={p} />}
                <span className="text-xs text-muted-foreground">· {a.module}</span>
              </div>
              <p className="mt-1 truncate text-sm">{a.description}</p>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
