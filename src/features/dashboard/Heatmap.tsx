import { Link } from "@tanstack/react-router";
import type { HeatmapCell } from "@/types/domain";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { shortDate } from "@/lib/date";

// Group cells into weeks (columns), starting on Sunday.
function toWeeks(cells: HeatmapCell[]): HeatmapCell[][] {
  if (cells.length === 0) return [];
  const first = new Date(cells[0].date);
  const pad = first.getDay(); // 0 Sun..6 Sat
  const padded: (HeatmapCell | null)[] = [
    ...Array.from({ length: pad }, () => null),
    ...cells,
  ];
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7).filter(Boolean) as HeatmapCell[]);
  }
  return weeks;
}

const INTENSITY_VAR = ["--heatmap-0", "--heatmap-1", "--heatmap-2", "--heatmap-3", "--heatmap-4"] as const;

export function Heatmap({ cells }: { cells: HeatmapCell[] }) {
  const weeks = toWeeks(cells);
  return (
    <TooltipProvider delayDuration={80}>
      <div className="overflow-x-auto">
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell) => (
                <Tooltip key={cell.date}>
                  <TooltipTrigger asChild>
                    <Link
                      to="/activity/$date"
                      params={{ date: cell.date }}
                      aria-label={`${cell.count} activities on ${shortDate(cell.date)}`}
                      className="block h-3 w-3 rounded-[3px] transition hover:ring-2 hover:ring-ring"
                      style={{ backgroundColor: `var(${INTENSITY_VAR[cell.intensity]})` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-medium">
                      {cell.count} {cell.count === 1 ? "activity" : "activities"}
                    </div>
                    <div className="text-muted-foreground">{shortDate(cell.date)}</div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          {INTENSITY_VAR.map((v) => (
            <span
              key={v}
              className="h-3 w-3 rounded-[3px]"
              style={{ backgroundColor: `var(${v})` }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
