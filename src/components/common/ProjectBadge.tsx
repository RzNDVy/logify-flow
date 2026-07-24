import type { Project } from "@/types/domain";
import { cn } from "@/lib/utils";

export function ProjectBadge({ project, className }: { project: Project; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
      style={{
        borderColor: `color-mix(in oklab, var(--project-${project.colorToken}) 40%, transparent)`,
        backgroundColor: `color-mix(in oklab, var(--project-${project.colorToken}) 12%, transparent)`,
        color: `var(--project-${project.colorToken})`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: `var(--project-${project.colorToken})` }}
      />
      {project.name}
    </span>
  );
}
