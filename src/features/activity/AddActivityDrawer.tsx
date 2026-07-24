import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Activity, Project } from "@/types/domain";
import { useCreateActivity, useUpdateActivity } from "@/hooks/useActivities";
import { validateImageBatch, MAX_IMAGES_PER_ACTIVITY, formatBytes } from "@/lib/rules/image-rules";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export function AddActivityDrawer({
  open,
  onOpenChange,
  date,
  projects,
  userId,
  editing = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: string;
  projects: Project[];
  userId: string;
  editing?: Activity | null;
}) {
  const create = useCreateActivity(userId);
  const update = useUpdateActivity(userId);
  const [projectId, setProjectId] = useState<string>("");
  const [module, setModule] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [files, setFiles] = useState<File[]>([]);
  const [removeIds, setRemoveIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (editing) {
        setProjectId(editing.projectId);
        setModule(editing.module);
        setDescription(editing.description);
        setTime(editing.time);
      } else {
        setProjectId(projects[0]?.id ?? "");
        setModule("");
        setDescription("");
      }
      setFiles([]);
      setRemoveIds([]);
    }
  }, [open, editing, projects]);

  function onPick(list: FileList | null) {
    if (!list) return;
    const existing = (editing?.images.length ?? 0) - removeIds.length + files.length;
    const batch = validateImageBatch(existing, Array.from(list));
    if (batch.rejected.length) toast.error(batch.rejected[0].reason);
    setFiles((f) => [...f, ...batch.accepted]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !module.trim() || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (editing) {
      await update.mutateAsync({
        id: editing.id,
        patch: {
          projectId,
          module,
          description,
          time,
          addImages: files,
          removeImageIds: removeIds,
        },
      });
    } else {
      await create.mutateAsync({
        userId,
        projectId,
        module,
        description,
        time,
        date,
        images: files,
      });
    }
    onOpenChange(false);
  }

  const busy = create.isPending || update.isPending;
  const remainingImages =
    MAX_IMAGES_PER_ACTIVITY - ((editing?.images.length ?? 0) - removeIds.length) - files.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit activity" : "Log activity"}</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="module">Module</Label>
              <Input
                id="module"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="e.g. Dispatch"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you accomplish?"
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            {editing && editing.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {editing.images.map((img) => {
                  const removed = removeIds.includes(img.id);
                  return (
                    <div
                      key={img.id}
                      className={`relative h-14 w-14 overflow-hidden rounded border ${removed ? "opacity-40" : ""}`}
                    >
                      <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setRemoveIds((r) =>
                            r.includes(img.id) ? r.filter((x) => x !== img.id) : [...r, img.id],
                          )
                        }
                        className="absolute right-0 top-0 rounded-bl bg-black/70 p-0.5 text-white"
                        aria-label={removed ? "Undo remove" : "Remove"}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {files.length > 0 && (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded border bg-muted/40 px-2 py-1">
                    <span className="truncate">{f.name}</span>
                    <span className="ml-2">{formatBytes(f.size)}</span>
                  </li>
                ))}
              </ul>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/40">
              <Upload className="h-4 w-4" />
              Click to upload · PNG, JPG, WebP · up to 10MB each
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => onPick(e.target.files)}
              />
            </label>
            <p className="text-[11px] text-muted-foreground">
              {Math.max(0, remainingImages)} of {MAX_IMAGES_PER_ACTIVITY} remaining
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Log activity"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
