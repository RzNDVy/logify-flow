import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft",
        "h-8 w-8 font-bold text-sm",
        className,
      )}
      aria-label="WAMS logo"
    >
      W
    </div>
  );
}
