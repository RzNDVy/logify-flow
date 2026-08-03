import type { ActivityImage } from "@/types/domain";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, X, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { downloadWatermarkedImage, formatImageDownloadName, parseActivityDateTime } from "@/lib/watermark";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function ImageViewer({
  images,
  index,
  onIndexChange,
  onClose,
  userName,
  projectName,
  moduleName,
  activityDate,
  activityTime,
}: {
  images: ActivityImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  userName?: string;
  projectName?: string;
  moduleName?: string;
  activityDate?: string;
  activityTime?: string;
}) {
  const { user: authUser } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const current = images[index];

  useEffect(() => {
    function h(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") onIndexChange(Math.max(0, index - 1));
      if (e.key === "ArrowRight") onIndexChange(Math.min(images.length - 1, index + 1));
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [index, images.length, onIndexChange]);

  if (!current) return null;

  const targetDate = parseActivityDateTime(activityDate, activityTime);
  const displayFormattedDate = format(targetDate, "dd MMM yyyy • HH:mm:ss 'WIB'", { locale: id }).toUpperCase();

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const targetFileName = formatImageDownloadName({
        userName: userName || authUser?.name,
        date: activityDate,
        projectName,
        moduleName,
        time: activityTime,
        originalName: current.name || "image.jpg",
      });

      const toastId = toast.loading(`Mengunduh ${targetFileName}...`);
      await downloadWatermarkedImage(current.url, targetFileName, targetDate);
      toast.success(`Foto ${targetFileName} berhasil diunduh!`, { id: toastId });
    } catch (err) {
      toast.error("Gagal mengunduh foto ber-watermark.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl border-none bg-black/95 p-0 text-white shadow-2xl">
        <div className="relative flex h-[80vh] items-center justify-center overflow-hidden">
          <img
            src={current.url}
            alt={current.name}
            className="max-h-full max-w-full object-contain"
          />

          {/* Live Visual Authentic Watermark Overlay */}
          <div className="absolute bottom-3 right-3 z-10 flex flex-col items-start rounded-lg border border-sky-500/40 bg-slate-950/85 px-2.5 py-1.5 shadow-lg backdrop-blur-xs font-sans text-left pointer-events-none">
            <span className="text-[9px] font-bold tracking-wider text-sky-400 uppercase flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-sky-400" /> WAMS • VERIFIED BY SYSTEM
            </span>
            <span className="font-mono text-[11px] font-bold text-white leading-tight mt-0.5">
              {displayFormattedDate}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 text-white hover:bg-white/10"
            onClick={() => onIndexChange(Math.max(0, index - 1))}
            disabled={index === 0}
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 text-white hover:bg-white/10"
            onClick={() => onIndexChange(Math.min(images.length - 1, index + 1))}
            disabled={index === images.length - 1}
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="absolute right-2 top-2 flex gap-1 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handleDownload}
              disabled={downloading}
              aria-label="Download Watermarked"
              title="Unduh foto ber-watermark otentik"
            >
              <Download className="h-4 w-4 text-sky-400" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs">
            {index + 1} / {images.length} · {current.name}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
