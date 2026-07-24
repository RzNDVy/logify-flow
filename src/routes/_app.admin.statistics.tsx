import { createFileRoute } from "@tanstack/react-router";
import { useAdminStats, useActivityTrend, useProjectStats, useTopUsers } from "@/hooks/useStats";
import { useProjects } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useUsers";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/common/StatCard";
import { Users, Activity, FolderKanban, HardDrive } from "lucide-react";
import { format, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { formatBytes } from "@/lib/rules/image-rules";

export const Route = createFileRoute("/_app/admin/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — WAMS Admin" },
      { name: "description", content: "Company-wide activity statistics." },
      { property: "og:title", content: "Statistics — WAMS Admin" },
      { property: "og:description", content: "Company-wide activity statistics." },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const { data: stats } = useAdminStats();
  const end = format(new Date(), "yyyy-MM-dd");
  const start = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const { data: trend = [] } = useActivityTrend({ start, end });
  const { data: byProject = [] } = useProjectStats();
  const { data: topUsers = [] } = useTopUsers(5);
  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Users" value={stats?.totalUsers ?? "—"} icon={Users} />
        <StatCard label="Activities" value={stats?.totalActivities ?? "—"} icon={Activity} accent="primary" />
        <StatCard label="Projects" value={stats?.totalProjects ?? "—"} icon={FolderKanban} accent="success" />
        <StatCard
          label="Storage"
          value={stats ? formatBytes(stats.storageUsedBytes) : "—"}
          icon={HardDrive}
          accent="warning"
        />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Activity — last 30 days</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} className="text-xs" />
              <YAxis allowDecimals={false} className="text-xs" />
              <RTooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">By project</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart
                data={byProject.map((b) => ({
                  name: projectMap.get(b.projectId)?.name ?? b.projectId,
                  count: b.count,
                }))}
              >
                <XAxis dataKey="name" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <RTooltip />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Top contributors</h2>
          <ul className="mt-3 divide-y">
            {topUsers.map((t) => (
              <li key={t.userId} className="flex items-center justify-between py-2 text-sm">
                <span>{userMap.get(t.userId)?.name ?? t.userId}</span>
                <span className="tabular-nums text-muted-foreground">{t.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
