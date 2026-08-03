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
import { useTheme } from "@/contexts/ThemeContext";
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
  Activity,
  Download,
  KeyRound,
  Sun,
  Moon,
  PlusCircle,
} from "lucide-react";

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { hasRole } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Cari aktivitas, proyek, atau navigasi cepat (Ctrl + K)..." />
      <CommandList>
        <CommandEmpty>Tidak ada hasil yang ditemukan.</CommandEmpty>
        
        {/* Quick Actions */}
        <CommandGroup heading="Aksi Cepat">
          <CommandItem onSelect={() => go(`/activity/${todayISO()}`)}>
            <PlusCircle className="mr-2 h-4 w-4 text-primary" /> Tambah Log Aktivitas Hari Ini
          </CommandItem>
          <CommandItem onSelect={() => go("/history")}>
            <Download className="mr-2 h-4 w-4 text-emerald-500" /> Export Laporan (PDF / Excel)
          </CommandItem>
          <CommandItem onSelect={() => { toggle(); setOpen(false); }}>
            {theme === "dark" ? (
              <>
                <Sun className="mr-2 h-4 w-4 text-amber-500" /> Mode Terang (Light Theme)
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4 text-indigo-500" /> Mode Gelap (Dark Theme)
              </>
            )}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigasi Utama">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go(`/activity/${todayISO()}`)}>
            <CalendarDays className="mr-2 h-4 w-4" /> Aktivitas Hari Ini
          </CommandItem>
          <CommandItem onSelect={() => go("/history")}>
            <History className="mr-2 h-4 w-4" /> Riwayat & Kalender (History)
          </CommandItem>
          <CommandItem onSelect={() => go("/profile")}>
            <UserIcon className="mr-2 h-4 w-4" /> Profil Saya
          </CommandItem>
          <CommandItem onSelect={() => go("/change-password")}>
            <KeyRound className="mr-2 h-4 w-4" /> Ubah Password
          </CommandItem>
        </CommandGroup>

        {/* Admin Navigation */}
        {hasRole("admin") && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin Panel">
              <CommandItem onSelect={() => go("/admin/monitor")}>
                <Activity className="mr-2 h-4 w-4 text-primary" /> Activity Monitor & Audit Trail
              </CommandItem>
              <CommandItem onSelect={() => go("/admin")}>
                <Users className="mr-2 h-4 w-4" /> User Management
              </CommandItem>
              <CommandItem onSelect={() => go("/admin/projects")}>
                <FolderKanban className="mr-2 h-4 w-4" /> Kelola Proyek
              </CommandItem>
              <CommandItem onSelect={() => go("/admin/statistics")}>
                <BarChart3 className="mr-2 h-4 w-4" /> Statistik & Analitik
              </CommandItem>
              <CommandItem onSelect={() => go("/admin/storage")}>
                <HardDrive className="mr-2 h-4 w-4" /> Kelola Penyimpanan
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Projects List */}
        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Proyek Terdaftar">
              {projects.map((p) => (
                <CommandItem key={p.id} onSelect={() => go("/history")}>
                  <span
                    className="mr-2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: `var(--project-${p.colorToken}, #0284c7)` }}
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
