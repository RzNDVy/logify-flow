import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { useActivitiesList } from "@/hooks/useActivities";
import { useProjects } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useUsers";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ProjectBadge } from "@/components/common/ProjectBadge";
import { Button } from "@/components/ui/button";
import { humanDate } from "@/lib/date";
import { EmptyState } from "@/components/common/EmptyState";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ExportReportDialog } from "@/components/reports/ExportReportDialog";
import { ActivityDetailModal } from "@/components/activity/ActivityDetailModal";
import { List, Calendar as CalendarIcon, Download } from "lucide-react";
import type { Activity } from "@/types/domain";
import { getAutoEndTime } from "@/lib/activity-time";

export const Route = createFileRoute("/_app/history")({
  head: () => ({
    meta: [
      { title: "History — WAMS" },
      { name: "description", content: "Your full activity history with filters." },
      { property: "og:title", content: "History — WAMS" },
      { property: "og:description", content: "Your full activity history with filters." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();
  
  // Fetch paginated for List view
  const { data } = useActivitiesList({
    userId: user!.id,
    search: search || undefined,
    projectId: projectId === "all" ? undefined : projectId,
    page,
    pageSize: 25,
  });

  // Fetch full list for Calendar view and Report Export
  const { data: allActivitiesData } = useActivitiesList({
    userId: user!.id,
    pageSize: 500,
  });

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const groups = new Map<string, Activity[]>();
  if (data?.data) {
    for (const a of data.data) {
      const list = groups.get(a.date) ?? [];
      list.push(a);
      groups.set(a.date, list);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="History" description="Every activity you've logged." />
        
        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded-lg border bg-muted p-1 text-xs">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" /> List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarIcon className="h-3.5 w-3.5" /> Kalender
            </Button>
          </div>

          {/* Export Report Button */}
          <Button size="sm" className="gap-1.5" onClick={() => setExportOpen(true)}>
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search descriptions or modules…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-sm"
            />
            <Select
              value={projectId}
              onValueChange={(v) => {
                setProjectId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!data || data.data.length === 0 ? (
            <EmptyState title="Nothing to show" description="Try changing your filters." />
          ) : (
            <div className="space-y-6">
              {Array.from(groups.entries()).map(([date, list]) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                    {humanDate(date)}
                  </h3>
                  <Card className="divide-y">
                    {list.map((a) => {
                      const p = projectMap.get(a.projectId);
                      const endTimeStr = a.endTime || getAutoEndTime(a.time, a.description);
                      return (
                        <div
                          key={a.id}
                          onClick={() => setSelectedActivity(a)}
                          className="flex gap-3 p-4 transition-colors cursor-pointer hover:bg-muted/40"
                        >
                          <div className="w-24 shrink-0 text-xs font-mono">
                            <div className="font-semibold text-foreground">{a.time}</div>
                            <div className="text-[11px] text-muted-foreground">s/d {endTimeStr}</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {p && <ProjectBadge project={p} />}
                              <span className="text-xs text-muted-foreground">· {a.module}</span>
                            </div>
                            <p className="mt-1 text-sm leading-relaxed">{a.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                </div>
              ))}
            </div>
          )}

          {data && data.total > data.pageSize && (
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                Page {data.page} of {Math.ceil(data.total / data.pageSize)}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * data.pageSize >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Calendar View Mode */
        <CalendarView
          activities={allActivitiesData?.data || []}
          projects={projects}
          onSelectActivity={(act) => setSelectedActivity(act)}
        />
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        open={!!selectedActivity}
        onOpenChange={(open) => { if (!open) setSelectedActivity(null); }}
        activity={selectedActivity}
        user={user || (selectedActivity ? selectedActivity.user : undefined)}
        project={selectedActivity ? projectMap.get(selectedActivity.projectId) || selectedActivity.project : undefined}
      />

      {/* Export Report Dialog Modal */}
      <ExportReportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        currentUser={user}
        users={users}
        projects={projects}
        activities={allActivitiesData?.data || data?.data || []}
      />
    </div>
  );
}
