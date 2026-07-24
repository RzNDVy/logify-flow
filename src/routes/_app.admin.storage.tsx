import { createFileRoute } from "@tanstack/react-router";
import { useStorageSummary } from "@/hooks/useStats";
import { useProjects } from "@/hooks/useProjects";
import { useRepositories } from "@/services/repositories/context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/common/StatCard";
import { HardDrive, Archive, Trash2 } from "lucide-react";
import { formatBytes, IMAGE_ARCHIVE_DAYS } from "@/lib/rules/image-rules";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/hooks/useActivities";

export const Route = createFileRoute("/_app/admin/storage")({
  head: () => ({
    meta: [
      { title: "Storage — WAMS Admin" },
      { name: "description", content: "Manage image storage & archives." },
      { property: "og:title", content: "Storage — WAMS Admin" },
      { property: "og:description", content: "Manage image storage & archives." },
    ],
  }),
  component: StoragePage,
});

function StoragePage() {
  const { data: summary } = useStorageSummary();
  const { data: projects = [] } = useProjects();
  const repos = useRepositories();
  const qc = useQueryClient();
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  async function archive() {
    const n = await repos.storage.archiveOlderThan(IMAGE_ARCHIVE_DAYS);
    qc.invalidateQueries({ queryKey: keys.storage() });
    toast.success(`Archived ${n} images.`);
  }
  async function purge() {
    const n = await repos.storage.deleteArchived();
    qc.invalidateQueries({ queryKey: keys.storage() });
    toast.success(`Deleted ${n} archived images.`);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total storage"
          value={summary ? formatBytes(summary.totalBytes) : "—"}
          icon={HardDrive}
          accent="primary"
        />
        <StatCard label="Images" value={summary?.imageCount ?? "—"} icon={HardDrive} />
        <StatCard
          label="Archived"
          value={summary?.archivedCount ?? "—"}
          icon={Archive}
          accent="warning"
        />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Maintenance</h2>
            <p className="text-xs text-muted-foreground">
              Images older than {IMAGE_ARCHIVE_DAYS} days can be archived, then purged.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={archive}>
              <Archive className="mr-1 h-4 w-4" /> Archive old
            </Button>
            <Button variant="outline" onClick={purge} className="text-destructive">
              <Trash2 className="mr-1 h-4 w-4" /> Purge archived
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Storage by project</h2>
        <ul className="mt-3 divide-y">
          {summary?.byProject.map((b) => (
            <li key={b.projectId} className="flex items-center justify-between py-2 text-sm">
              <span>{projectMap.get(b.projectId)?.name ?? b.projectId}</span>
              <span className="tabular-nums text-muted-foreground">
                {b.count} images · {formatBytes(b.bytes)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
