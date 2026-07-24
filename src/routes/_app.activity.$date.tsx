import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useActivitiesByDate, useDeleteActivity } from "@/hooks/useActivities";
import { useProjects } from "@/hooks/useProjects";
import { ChevronLeft, ChevronRight, Plus, Lock } from "lucide-react";
import { humanDate, todayISO, format, addDays, subDays, fromISO, isValidISODate } from "@/lib/date";
import { canCreateForDate, lockReason, isFuture } from "@/lib/rules/activity-rules";
import { ActivityCard } from "@/features/activity/ActivityCard";
import { AddActivityDrawer } from "@/features/activity/AddActivityDrawer";
import { EmptyState } from "@/components/common/EmptyState";
import { CalendarX } from "lucide-react";

export const Route = createFileRoute("/_app/activity/$date")({
  head: ({ params }) => ({
    meta: [
      { title: `Activity ${params.date} — WAMS` },
      { name: "description", content: `Your logged activity for ${params.date}.` },
      { property: "og:title", content: `Activity ${params.date} — WAMS` },
      { property: "og:description", content: `Your logged activity for ${params.date}.` },
    ],
  }),
  component: ActivityDatePage,
});

function ActivityDatePage() {
  const { date } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const valid = isValidISODate(date);
  const userId = user!.id;
  const { data: activities = [], isLoading } = useActivitiesByDate(userId, valid ? date : "");
  const { data: projects = [] } = useProjects();
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const del = useDeleteActivity(userId);

  const canAdd = valid && canCreateForDate(date);
  const locked = valid && !canAdd && !isFuture(date);

  const goto = (d: string) => navigate({ to: "/activity/$date", params: { date: d } });

  if (!valid) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <EmptyState
          icon={CalendarX}
          title="Invalid date"
          description="This URL doesn't look right."
          action={
            <Button asChild>
              <Link to={`/activity/${todayISO()}`}>Go to today</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const editing = activities.find((a) => a.id === editingId) ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={humanDate(date)}
        description={date === todayISO() ? "Today" : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goto(format(subDays(fromISO(date), 1), "yyyy-MM-dd"))}
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => goto(todayISO())}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goto(format(addDays(fromISO(date), 1), "yyyy-MM-dd"))}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => setAddOpen(true)} disabled={!canAdd}>
              <Plus className="mr-1 h-4 w-4" /> Add activity
            </Button>
          </div>
        }
      />

      {locked && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning-foreground/90">
          <Lock className="mt-0.5 h-4 w-4 text-warning" />
          <div>
            <p className="font-medium">This day is locked</p>
            <p className="text-muted-foreground">
              Activities older than 7 days can't be added or edited.
            </p>
          </div>
        </div>
      )}

      {isFuture(date) && (
        <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
          You can't log activities for future dates.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          title="No activities on this day"
          description={canAdd ? "Log your first activity for this date." : "This day is empty."}
          action={
            canAdd && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Add activity
              </Button>
            )
          }
        />
      ) : (
        <ol className="relative space-y-3 border-l pl-6">
          {activities.map((a) => {
            const p = projectMap.get(a.projectId);
            const reason = lockReason(a);
            return (
              <li key={a.id} className="relative">
                <span
                  className="absolute -left-[27px] top-4 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary"
                  aria-hidden
                />
                <ActivityCard
                  activity={a}
                  project={p}
                  locked={!!reason}
                  onEdit={() => setEditingId(a.id)}
                  onDelete={() => del.mutate(a.id)}
                />
              </li>
            );
          })}
        </ol>
      )}

      <AddActivityDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        date={date}
        projects={projects}
        userId={userId}
      />
      <AddActivityDrawer
        open={!!editing}
        onOpenChange={(v) => !v && setEditingId(null)}
        date={date}
        projects={projects}
        userId={userId}
        editing={editing}
      />
    </div>
  );
}
