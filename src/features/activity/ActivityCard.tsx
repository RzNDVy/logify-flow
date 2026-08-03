import type { Activity, Project } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectBadge } from "@/components/common/ProjectBadge";
import { Pencil, Trash2, Lock, ImageIcon, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { ImageViewer } from "./ImageViewer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePicker } from "@/components/common/TimePicker";
import { useUpdateActivity } from "@/hooks/useActivities";
import { getEffectiveEndTime, getAutoDurationHours, calculateEndTime } from "@/lib/activity-time";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ActivityCard({
  activity,
  project,
  locked,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  project?: Project;
  locked: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const updateActivity = useUpdateActivity(activity.userId);

  const effectiveEndTime = getEffectiveEndTime(activity.time, activity.description, activity.endTime);
  const autoDuration = getAutoDurationHours(activity.description);
  const isAutoAssigned = !activity.endTime || activity.endTime.trim() === "";

  const [tempEndTime, setTempEndTime] = useState(effectiveEndTime);

  const handleSaveEndTime = async () => {
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        patch: { endTime: tempEndTime },
      });
      toast.success(`Waktu selesai berhasil diubah ke ${tempEndTime}`);
      setTimePickerOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah waktu selesai");
    }
  };

  return (
    <Card className="p-4 shadow-soft transition hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {project && <ProjectBadge project={project} />}
            <span className="text-xs font-medium text-muted-foreground">{activity.module}</span>
            <span className="text-xs text-muted-foreground">· {activity.time}</span>

            {/* End Time Button & Quick Time Picker */}
            <Popover open={timePickerOpen} onOpenChange={(open) => {
              if (open) setTempEndTime(effectiveEndTime);
              setTimePickerOpen(open);
            }}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={locked}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground transition-all hover:bg-muted hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  title={isAutoAssigned ? `Otomatis ${autoDuration} jam. Klik untuk ubah.` : "Waktu Selesai (Klik untuk ubah)"}
                >
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="font-mono text-[11px] font-semibold">
                    s/d {effectiveEndTime}
                  </span>
                  {isAutoAssigned && (
                    <Badge variant="outline" className="h-4 px-1 text-[9px] font-semibold border-primary/30 bg-primary/10 text-primary">
                      {autoDuration}h
                    </Badge>
                  )}
                  {!locked && <Pencil className="h-2.5 w-2.5 text-muted-foreground ml-0.5" />}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3.5 font-sans rounded-2xl shadow-xl border" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Waktu Selesai Activity
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Mulai: {activity.time}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Pilih Jam Selesai:</label>
                    <TimePicker
                      value={tempEndTime}
                      onChange={setTempEndTime}
                    />
                  </div>

                  {/* Preset Buttons */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-semibold text-muted-foreground block">Durasi Otomatis:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTempEndTime(calculateEndTime(activity.time, 3))}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                          tempEndTime === calculateEndTime(activity.time, 3)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        +3 Jam (Scrum/Daily)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempEndTime(calculateEndTime(activity.time, 5))}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                          tempEndTime === calculateEndTime(activity.time, 5)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        +5 Jam (Biasa)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setTimePickerOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1"
                      onClick={handleSaveEndTime}
                      disabled={updateActivity.isPending}
                    >
                      {updateActivity.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Simpan Jam Selesai
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" /> locked
              </span>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {activity.description}
          </p>
          {activity.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activity.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setViewerIndex(i)}
                  className="group relative h-16 w-16 overflow-hidden rounded-md border bg-muted"
                  aria-label={`View image ${img.name}`}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  {img.archived && (
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[9px] text-white">
                      archived
                    </span>
                  )}
                </button>
              ))}
              {activity.images.length === 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" /> No attachments
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            disabled={locked}
            aria-label="Edit activity"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={locked}
                aria-label="Delete activity"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this activity?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Attached images will also be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {viewerIndex !== null && (
        <ImageViewer
          images={activity.images}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          userName={activity.user?.name}
          projectName={project?.name || activity.project?.name}
          moduleName={activity.module}
          activityDate={activity.date}
          activityTime={activity.time}
        />
      )}
    </Card>
  );
}
