import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { useProjects } from "@/hooks/useProjects";
import { todayISO } from "@/lib/date";
import {
  LayoutDashboard,
  CalendarDays,
  History,
  User as UserIcon,
  Users,
  FolderKanban,
  BarChart3,
  HardDrive,
} from "lucide-react";

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go(`/activity/${todayISO()}`)}>
            <CalendarDays className="mr-2 h-4 w-4" /> Today's activity
          </CommandItem>
          <CommandItem onSelect={() => go("/history")}>
            <History className="mr-2 h-4 w-4" /> History
          </CommandItem>
          <CommandItem onSelect={() => go("/profile")}>
            <UserIcon className="mr-2 h-4 w-4" /> Profile
          </CommandItem>
        </CommandGroup>
        {hasRole("admin") && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin">
              <CommandItem onSelect={() => go("/admin")}>
                <Users className="mr-2 h-4 w-4" /> Users
              </CommandItem>
              <CommandItem onSelect={() => go("/admin/projects")}>
                <FolderKanban className="mr-2 h-4 w-4" /> Projects
              </CommandItem>
              <CommandItem onSelect={() => go("/admin/statistics")}>
                <BarChart3 className="mr-2 h-4 w-4" /> Statistics
              </CommandItem>
              <CommandItem onSelect={() => go("/admin/storage")}>
                <HardDrive className="mr-2 h-4 w-4" /> Storage
              </CommandItem>
            </CommandGroup>
          </>
        )}
        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map((p) => (
                <CommandItem key={p.id} onSelect={() => go("/history")}>
                  <span
                    className="mr-2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: `var(--project-${p.colorToken})` }}
                  />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
