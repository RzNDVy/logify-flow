import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  CalendarDays,
  History,
  User as UserIcon,
  Users,
  FolderKanban,
  BarChart3,
  HardDrive,
  Activity as ActivityIcon,
} from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { todayISO } from "@/lib/date";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Today's Activity", url: `/activity/${todayISO()}`, icon: CalendarDays, dynamic: true },
  { title: "History", url: "/history", icon: History },
  { title: "Profile", url: "/profile", icon: UserIcon },
];

const adminNav = [
  { title: "Users", url: "/admin", icon: Users, exact: true },
  { title: "Projects", url: "/admin/projects", icon: FolderKanban },
  { title: "Statistics", url: "/admin/statistics", icon: BarChart3 },
  { title: "Storage", url: "/admin/storage", icon: HardDrive },
  { title: "Activity Monitor", url: "/admin/monitor", icon: ActivityIcon },
];

export function AppSidebar() {
  const { hasRole } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (url: string, exact = false) => {
    if (exact) return pathname === url;
    if (url.startsWith("/activity/")) return pathname.startsWith("/activity/");
    return pathname === url || pathname.startsWith(url + "/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Logo />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">WAMS</span>
            <span className="text-[11px] text-muted-foreground">Work Activity</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasRole("admin") && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url, item.exact)}
                      tooltip={item.title}
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t px-3 py-2 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
        WAMS v1.0
      </SidebarFooter>
    </Sidebar>
  );
}
