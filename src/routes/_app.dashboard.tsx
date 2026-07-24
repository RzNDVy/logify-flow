import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { useUserStats } from "@/hooks/useStats";
import { useRecentActivities, useHeatmap } from "@/hooks/useActivities";
import { useProjects } from "@/hooks/useProjects";
import { todayISO, humanDate, format, subDays } from "@/lib/date";
import {
  Activity,
  CalendarDays,
  Flame,
  FolderKanban,
  Layers,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Heatmap } from "@/features/dashboard/Heatmap";
import { RecentActivities } from "@/features/dashboard/RecentActivities";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — WAMS" },
      { name: "description", content: "Your activity overview at a glance." },
      { property: "og:title", content: "Dashboard — WAMS" },
      { property: "og:description", content: "Your activity overview at a glance." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const userId = user!.id;
  const { data: stats } = useUserStats(userId);
  const { data: recent = [] } = useRecentActivities(userId, 5);
  const { data: projects = [] } = useProjects();
  const end = todayISO();
  const start = format(subDays(new Date(), 365), "yyyy-MM-dd");
  const { data: heatmap = [] } = useHeatmap(userId, { start, end });

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const firstName = user!.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description={humanDate(new Date())}
        actions={
          <Button asChild>
            <Link to={`/activity/${todayISO()}`}>
              <CalendarDays className="mr-2 h-4 w-4" /> Log today
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Today" value={stats?.today ?? "—"} icon={CalendarDays} accent="primary" />
        <StatCard label="This week" value={stats?.thisWeek ?? "—"} icon={TrendingUp} accent="primary" />
        <StatCard label="This month" value={stats?.thisMonth ?? "—"} icon={Layers} />
        <StatCard label="Total" value={stats?.totalActivities ?? "—"} icon={Activity} />
        <StatCard label="Streak" value={`${stats?.streak ?? 0}d`} icon={Flame} accent="warning" />
        <StatCard label="Projects" value={stats?.activeProjects ?? "—"} icon={FolderKanban} accent="success" />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Contribution activity</h2>
            <p className="text-xs text-muted-foreground">Last 12 months of work.</p>
          </div>
        </div>
        <Heatmap cells={heatmap} />
      </Card>

      <RecentActivities activities={recent} projects={projectMap} />
    </div>
  );
}
