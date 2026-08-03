import { Link } from "@tanstack/react-router";
import type { Activity, Project } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { ProjectBadge } from "@/components/common/ProjectBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { shortDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { CalendarClock, Plus } from "lucide-react";
import { todayISO } from "@/lib/date";

import { getAutoEndTime } from "@/lib/activity-time";

export function RecentActivities({
  activities,
  projects,
}: {
  activities: Activity[];
  projects: Map<string, Project>;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/history">View all</Link>
        </Button>
      </div>
      {activities.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No activities yet"
          description="Log your first activity to see it here."
          action={
            <Button asChild size="sm">
              <Link to="/activity/$date" params={{ date: todayISO() }}>
                <Plus className="mr-1 h-4 w-4" /> Log activity
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y">
          {activities.map((a) => {
            const p = projects.get(a.projectId);
            const endTimeStr = a.endTime || getAutoEndTime(a.time, a.description);
            return (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {p && <ProjectBadge project={p} />}
                    <span className="text-xs text-muted-foreground">· {a.module}</span>
                  </div>
                  <p className="mt-1 truncate text-sm">{a.description}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{shortDate(a.date)}</div>
                  <div className="font-mono text-[11px] font-medium text-foreground">{a.time} - {endTimeStr}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
