import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks/useProjects";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { ProjectBadge } from "@/components/common/ProjectBadge";
import type { ProjectColorToken } from "@/types/domain";

const COLORS: ProjectColorToken[] = ["movely", "eproc", "website", "internal", "mobile"];

export const Route = createFileRoute("/_app/admin/projects")({
  head: () => ({
    meta: [
      { title: "Projects — WAMS Admin" },
      { name: "description", content: "Manage WAMS projects." },
      { property: "og:title", content: "Projects — WAMS Admin" },
      { property: "og:description", content: "Manage WAMS projects." },
    ],
  }),
  component: AdminProjectsPage,
});

function AdminProjectsPage() {
  const { data: projects = [] } = useProjects();
  const create = useCreateProject();
  const del = useDeleteProject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [color, setColor] = useState<ProjectColorToken>("movely");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await create.mutateAsync({ name, key, colorToken: color, icon: "Folder" });
                setOpen(false);
                setName("");
                setKey("");
              }}
            >
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Key</Label>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  required
                  maxLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <Select value={color} onValueChange={(v) => setColor(v as ProjectColorToken)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Create project
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <ProjectBadge project={p} />
                <p className="mt-2 font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.key}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => del.mutate(p.id)}
                aria-label="Delete project"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {p.description && (
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
