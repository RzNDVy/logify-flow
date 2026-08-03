import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import type { Activity, Project } from "@/types/domain";
import { ProjectBadge } from "@/components/common/ProjectBadge";

interface CalendarViewProps {
  activities: Activity[];
  projects: Project[];
  onAddActivityForDate?: (dateStr: string) => void;
  onSelectActivity?: (activity: Activity) => void;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAYS_HEADER = ["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function CalendarView({
  activities,
  projects,
  onAddActivityForDate,
  onSelectActivity,
}: CalendarViewProps) {
  const currentDate = new Date();
  const [viewDate, setViewDate] = useState<Date>(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const pm = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  // Group activities by date string YYYY-MM-DD
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      const list = map.get(a.date) || [];
      list.push(a);
      map.set(a.date, list);
    }
    return map;
  }, [activities]);

  // Calculate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pMonth = month === 0 ? 11 : month - 1;
      const pYear = month === 0 ? year - 1 : year;
      const dateStr = `${pYear}-${String(pMonth + 1).padStart(2, "0")}-${String(pDay).padStart(2, "0")}`;
      days.push({ dateStr, dayNum: pDay, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Next month padding days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nMonth = month === 11 ? 0 : month + 1;
      const nYear = month === 11 ? year + 1 : year;
      const dateStr = `${nYear}-${String(nMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ dateStr, dayNum: i, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  };

  const todayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

  const selectedDayActivities = selectedDayDate ? activitiesByDate.get(selectedDayDate) || [] : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-bold text-foreground min-w-[150px] text-center">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="secondary" size="sm" onClick={handleToday} className="gap-1.5 text-xs">
          <CalendarIcon className="h-3.5 w-3.5" /> Hari Ini
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden p-0 border">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b bg-muted/50 text-center font-semibold text-xs text-muted-foreground">
          {DAYS_HEADER.map((d, i) => (
            <div key={i} className="py-2.5">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 divide-x divide-y">
          {calendarDays.map((cell, idx) => {
            const dayActs = activitiesByDate.get(cell.dateStr) || [];
            const isToday = cell.dateStr === todayStr;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDayDate(cell.dateStr)}
                className={`min-h-[95px] p-1.5 transition-colors cursor-pointer hover:bg-accent/40 flex flex-col justify-between ${
                  cell.isCurrentMonth ? "bg-background" : "bg-muted/20 text-muted-foreground/50"
                }`}
              >
                {/* Cell Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : cell.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {dayActs.length > 0 && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      {dayActs.length}
                    </span>
                  )}
                </div>

                {/* Day Activity Badges */}
                <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                  {dayActs.slice(0, 2).map((act) => {
                    const project = pm.get(act.projectId) || act.project;
                    return (
                      <div
                        key={act.id}
                        className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium border bg-muted/60 hover:bg-muted"
                      >
                        <span className="font-semibold text-primary">{project?.name || act.module}:</span>{" "}
                        <span className="text-muted-foreground">{act.description}</span>
                      </div>
                    );
                  })}
                  {dayActs.length > 2 && (
                    <div className="text-[10px] font-medium text-muted-foreground text-center">
                      +{dayActs.length - 2} lagi
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Activities Dialog */}
      {selectedDayDate && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setSelectedDayDate(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-base">
                <span>Aktivitas Tanggal {selectedDayDate}</span>
              </DialogTitle>
              <DialogDescription>
                Daftar log aktivitas yang dicatat pada tanggal {selectedDayDate}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 py-1">
              {selectedDayActivities.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Belum ada aktivitas yang dicatat pada tanggal ini.
                </div>
              ) : (
                selectedDayActivities.map((act) => {
                  const project = pm.get(act.projectId) || act.project;
                  return (
                    <div
                      key={act.id}
                      onClick={() => onSelectActivity && onSelectActivity(act)}
                      className="rounded-lg border p-3 bg-card space-y-1.5 transition-colors cursor-pointer hover:border-primary/50 hover:bg-muted/40 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {project && <ProjectBadge project={project} />}
                          <span className="text-xs font-semibold text-muted-foreground">Modul: {act.module}</span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {act.time || "-"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed font-medium">{act.description}</p>
                    </div>
                  );
                })
              )}
            </div>

            {onAddActivityForDate && (
              <Button
                className="w-full gap-2 mt-2"
                onClick={() => {
                  const targetDate = selectedDayDate;
                  setSelectedDayDate(null);
                  onAddActivityForDate(targetDate);
                }}
              >
                <Plus className="h-4 w-4" /> Tambah Aktivitas di Tanggal Ini
              </Button>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
