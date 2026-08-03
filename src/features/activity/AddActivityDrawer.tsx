import { useEffect, useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Activity, Project, ProjectColorToken } from "@/types/domain";
import { useCreateActivity, useUpdateActivity, useModules } from "@/hooks/useActivities";
import { useCreateProject } from "@/hooks/useProjects";
import { validateImageBatch, MAX_IMAGES_PER_ACTIVITY, formatBytes } from "@/lib/rules/image-rules";
import { applyWatermark } from "@/lib/watermark";
import { ModuleAutoComplete } from "@/components/common/ModuleAutoComplete";
import { TimePicker } from "@/components/common/TimePicker";
import { Loader2, Upload, X, Camera, Save, Trash2, CheckCircle2, Plus, FolderPlus } from "lucide-react";
import { toast } from "sonner";

const COLOR_PALETTE: ProjectColorToken[] = [
  "blue", "emerald", "violet", "amber", "rose",
  "cyan", "orange", "indigo", "teal", "pink"
];

// Helper to auto-generate project code/key from name
function generateProjectKey(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return words.map((w) => w[0]).join("").toUpperCase().slice(0, 5);
  }
  return name.trim().slice(0, 4).toUpperCase();
}

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
  const createProject = useCreateProject();
  const [projectId, setProjectId] = useState<string>("");
  const { data: moduleSuggestions = [] } = useModules(projectId);
  const [module, setModule] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [files, setFiles] = useState<File[]>([]);
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Quick Add Project Modal State
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const draftKey = `wams_draft_${userId}`;

  // Restore draft or populate editing state on open
  useEffect(() => {
    if (open) {
      if (editing) {
        setProjectId(editing.projectId);
        setModule(editing.module);
        setDescription(editing.description);
        setTime(editing.time);
        setDraftRestored(false);
      } else {
        // Try restoring draft from localStorage
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            setProjectId(parsed.projectId || (projects[0]?.id ?? ""));
            setModule(parsed.module || "");
            setDescription(parsed.description || "");
            setTime(parsed.time || new Date().toTimeString().slice(0, 5));
            setDraftRestored(true);
          } catch {
            setProjectId(projects[0]?.id ?? "");
            setModule("");
            setDescription("");
            setDraftRestored(false);
          }
        } else {
          setProjectId(projects[0]?.id ?? "");
          setModule("");
          setDescription("");
          setDraftRestored(false);
        }
      }
      setFiles([]);
      setRemoveIds([]);
    }
  }, [open, editing, projects, draftKey]);

  // Real-time Auto-save Draft to localStorage (Only in new activity mode)
  useEffect(() => {
    if (!open || editing) return;
    if (projectId || module.trim() || description.trim()) {
      const draftData = { projectId, module, description, time };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [open, editing, projectId, module, description, time, draftKey]);

  // Helper to validate and automatically stamp authentic watermarks on uploaded photos
  async function processAndAddFiles(incomingFiles: File[]) {
    if (incomingFiles.length === 0) return;

    const existing = (editing?.images.length ?? 0) - removeIds.length + files.length;
    const batch = validateImageBatch(existing, incomingFiles);
    if (batch.rejected.length) {
      toast.error(batch.rejected[0].reason);
    }

    if (batch.accepted.length > 0) {
      const toastId = toast.loading("Membubuhi cap air / watermark otentik...");
      let uploadTimestamp = new Date();
      if (date) {
        const timeStr = time || "00:00";
        const parsed = new Date(`${date}T${timeStr}:00`);
        if (!isNaN(parsed.getTime())) {
          uploadTimestamp = parsed;
        }
      }

      try {
        const watermarkedFiles = await Promise.all(
          batch.accepted.map((f) => applyWatermark(f, uploadTimestamp))
        );
        setFiles((prev) => [...prev, ...watermarkedFiles]);
        toast.success(`Berhasil menambahkan ${watermarkedFiles.length} foto dengan cap air tanggal & jam otentik!`, { id: toastId });
      } catch (err) {
        setFiles((prev) => [...prev, ...batch.accepted]);
        toast.success(`Foto berhasil ditambahkan!`, { id: toastId });
      }
    }
  }

  // Handle Paste Event from Clipboard (Ctrl + V / Win + Shift + S)
  useEffect(() => {
    if (!open) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      const imageFiles: File[] = [];

      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            const ext = blob.type.split("/")[1] || "png";
            const fileName = `screenshot_${Date.now()}.${ext}`;
            const file = new File([blob], fileName, { type: blob.type });
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await processAndAddFiles(imageFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open, editing, removeIds.length, files.length]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setProjectId(projects[0]?.id ?? "");
    setModule("");
    setDescription("");
    setDraftRestored(false);
    toast.info("Draf otomatis telah dibersihkan.");
  };

  const handleCreateQuickProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      return toast.error("Silakan masukkan nama proyek.");
    }

    try {
      setCreatingProject(true);
      // Auto pick color based on current project count
      const autoColor = COLOR_PALETTE[projects.length % COLOR_PALETTE.length];
      const autoKey = generateProjectKey(newProjectName);

      const created = await createProject.mutateAsync({
        name: newProjectName.trim(),
        key: autoKey,
        colorToken: autoColor,
        icon: "Folder",
        description: "Dibuat otomatis dari form aktivitas",
      });

      setProjectId(created.id);
      setNewProjectName("");
      setNewProjectOpen(false);
      toast.success(`Proyek "${created.name}" berhasil dibuat dan otomatis dipilih!`);
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat proyek baru.");
    } finally {
      setCreatingProject(false);
    }
  };

  function onPick(list: FileList | null) {
    if (!list) return;
    processAndAddFiles(Array.from(list));
  }

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !module.trim() || !description.trim()) {
      toast.error("Silakan lengkapi semua kolom yang wajib diisi.");
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
      // Clear draft after successful creation
      localStorage.removeItem(draftKey);
    }
    onOpenChange(false);
  }

  const busy = create.isPending || update.isPending;
  const remainingImages =
    MAX_IMAGES_PER_ACTIVITY - ((editing?.images.length ?? 0) - removeIds.length) - files.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <SheetTitle className="text-lg font-bold">
            {editing ? "Edit aktivitas" : "Tambah Log Aktivitas"}
          </SheetTitle>
          {!editing && draftRestored && (
            <Badge variant="outline" className="gap-1 border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> Draf Dipulihkan
            </Badge>
          )}
        </SheetHeader>

        {/* Draft Notification Alert */}
        {!editing && draftRestored && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Save className="h-3.5 w-3.5 text-emerald-600" /> Teks draf sebelumnya otomatis dipulihkan.
            </span>
            <button
              type="button"
              onClick={clearDraft}
              className="text-emerald-700 underline font-semibold hover:text-emerald-900 dark:text-emerald-300"
            >
              Hapus Draf
            </button>
          </div>
        )}

        <form className="mt-4 space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Proyek</Label>
                <button
                  type="button"
                  onClick={() => setNewProjectOpen(true)}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Tambah Proyek Baru
                </button>
              </div>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih proyek" />
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
              <Label htmlFor="module" className="text-xs font-semibold">Modul</Label>
              <ModuleAutoComplete
                value={module}
                onChange={setModule}
                modules={moduleSuggestions}
                placeholder="Contoh: RFQ, Fleet, Auth..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="time" className="text-xs font-semibold">Waktu / Jam</Label>
              <TimePicker
                value={time}
                onChange={setTime}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-xs font-semibold">Deskripsi Aktivitas</Label>
              {!editing && (description || module) && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Save className="h-3 w-3 text-emerald-500" /> Draf tersimpan otomatis
                </span>
              )}
            </div>
            <Textarea
              id="description"
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Apa yang telah Anda selesaikan hari ini?"
              className="leading-relaxed"
            />
          </div>

          {/* Attachments & Drag and Drop Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Lampiran Foto</Label>
              <span className="text-[11px] text-muted-foreground">
                Sisa: {Math.max(0, remainingImages)} foto (Maks 10MB)
              </span>
            </div>

            {/* Existing Images when Editing */}
            {editing && editing.images.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-1">
                {editing.images.map((img) => {
                  const removed = removeIds.includes(img.id);
                  return (
                    <div
                      key={img.id}
                      className={`relative h-16 w-16 overflow-hidden rounded-lg border ${removed ? "opacity-40 border-destructive" : ""}`}
                    >
                      <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setRemoveIds((r) =>
                            r.includes(img.id) ? r.filter((x) => x !== img.id) : [...r, img.id],
                          )
                        }
                        className="absolute right-0 top-0 rounded-bl bg-black/70 p-1 text-white hover:bg-destructive"
                        aria-label={removed ? "Batal hapus" : "Hapus"}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected File Badges */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-lg border bg-muted/60 px-2.5 py-1 text-xs">
                    <span className="truncate max-w-[150px] font-medium">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground">({formatBytes(f.size)})</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Interactive Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : "border-muted-foreground/25 bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <Upload className={`h-6 w-6 mb-1 ${isDragging ? "text-primary animate-bounce" : "text-muted-foreground"}`} />
              <p className="text-xs font-semibold text-foreground">
                Tarik & Lepas Foto di sini <span className="text-muted-foreground font-normal">atau klik untuk pilih</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PNG, JPG, WebP hingga 10MB · <span className="text-primary font-medium">Bisa tempel screenshot (Ctrl + V / Win + Shift + S)</span>
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => onPick(e.target.files)}
              />

              {/* Mobile/Direct Camera Capture Input */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => onPick(e.target.files)}
              />

              {/* Upload & Camera Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" /> Pilih File
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-3.5 w-3.5 text-primary" /> Ambil Foto (Kamera)
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            {!editing && (description || module) ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearDraft} className="text-xs text-destructive gap-1">
                <Trash2 className="h-3.5 w-3.5" /> Hapus Draf
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={busy} className="gap-1.5 font-semibold">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Simpan Perubahan" : "Kirim Aktivitas"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>

      {/* Quick Add Project Modal Dialog */}
      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FolderPlus className="h-5 w-5 text-primary" /> Tambah Proyek Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Buat proyek baru secara langsung. Warna proyek akan dipilihkan secara otomatis oleh sistem.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateQuickProject} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="newProjectName" className="text-xs font-semibold">Nama Proyek</Label>
              <Input
                id="newProjectName"
                placeholder="Contoh: Mobile Banking Redesign"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between font-medium text-foreground">
                <span>Kode Proyek Otomatis:</span>
                <span className="font-mono text-primary font-bold">
                  {newProjectName ? generateProjectKey(newProjectName) : "---"}
                </span>
              </div>
              <p>Warna identitas proyek akan ditentukan secara otomatis.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setNewProjectOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={creatingProject || !newProjectName.trim()} className="gap-1.5">
                {creatingProject && <Loader2 className="h-4 w-4 animate-spin" />}
                Tambah & Pilih Proyek
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
