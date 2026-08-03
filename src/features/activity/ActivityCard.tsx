import type { Activity, Project } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectBadge } from "@/components/common/ProjectBadge";
import { Pencil, Trash2, Lock, ImageIcon } from "lucide-react";
import { useState } from "react";
import { ImageViewer } from "./ImageViewer";
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

  return (
    <Card className="p-4 shadow-soft transition hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {project && <ProjectBadge project={project} />}
            <span className="text-xs font-medium text-muted-foreground">{activity.module}</span>
            <span className="text-xs text-muted-foreground">· {activity.time}</span>
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
