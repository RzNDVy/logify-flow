import type { ActivityImage } from "@/types/domain";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useEffect } from "react";

export function ImageViewer({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: ActivityImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
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
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl border-none bg-black/95 p-0 text-white">
        <div className="relative flex h-[80vh] items-center justify-center">
          <img
            src={current.url}
            alt={current.name}
            className="max-h-full max-w-full object-contain"
          />
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
          <div className="absolute right-2 top-2 flex gap-1">
            <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <a href={current.url} download={current.name} aria-label="Download">
                <Download className="h-4 w-4" />
              </a>
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
