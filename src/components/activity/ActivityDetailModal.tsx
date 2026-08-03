import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProjectBadge } from "@/components/common/ProjectBadge";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar as CalendarIcon, User as UserIcon, FileText, ImageIcon } from "lucide-react";
import type { Activity, Project, User } from "@/types/domain";
import { ImageViewer } from "@/features/activity/ImageViewer";

interface ActivityDetailModalProps {
  activity: Activity | null;
  project?: Project;
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityDetailModal({
  activity,
  project,
  user,
  open,
  onOpenChange,
}: ActivityDetailModalProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!activity) return null;

  const targetUser = user || activity.user;
  const targetProject = project || activity.project;
  const initial = targetUser?.name ? targetUser.name.charAt(0).toUpperCase() : "U";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary border border-primary/20 text-sm">
              {targetUser?.avatarUrl ? (
                <img src={targetUser.avatarUrl} alt={targetUser.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>

            {/* User Info & Header */}
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {targetUser?.name || "Detail Aktivitas"}
              </DialogTitle>
              {targetUser?.email && (
                <DialogDescription className="text-xs text-muted-foreground">
                  {targetUser.email}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Metadata Badges (Project, Module, Time, Date) */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs">
            {targetProject && <ProjectBadge project={targetProject} />}
            <Badge variant="outline" className="font-medium">
              Modul: {activity.module}
            </Badge>
            <span className="flex items-center gap-1 text-muted-foreground font-medium">
              <CalendarIcon className="h-3.5 w-3.5" /> {activity.date}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground font-mono">
              <Clock className="h-3.5 w-3.5" /> {activity.time || "-"}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Deskripsi Aktivitas
            </label>
            <div className="rounded-xl border bg-card p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {activity.description}
            </div>
          </div>

          {/* Attached Images */}
          {activity.images && activity.images.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> Lampiran Foto ({activity.images.length})
              </label>
              <div className="flex flex-wrap gap-2.5">
                {activity.images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setViewerIndex(idx)}
                    className="group relative h-20 w-20 overflow-hidden rounded-lg border bg-muted shadow-xs transition hover:opacity-90 hover:scale-105"
                  >
                    <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Image Viewer Lightbox */}
      {viewerIndex !== null && activity.images && (
        <ImageViewer
          images={activity.images}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </Dialog>
  );
}
