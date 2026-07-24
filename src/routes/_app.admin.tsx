import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin")({
  component: AdminLayout,
});

const tabs = [
  { url: "/admin", label: "Users", exact: true },
  { url: "/admin/projects", label: "Projects" },
  { url: "/admin/statistics", label: "Statistics" },
  { url: "/admin/storage", label: "Storage" },
  { url: "/admin/monitor", label: "Monitor" },
];

function AdminLayout() {
  const { hasRole, status } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (status === "authenticated" && !hasRole("admin")) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [status, hasRole, navigate]);

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Admin" description="Manage your organization." />
      <nav className="flex flex-wrap gap-1 border-b">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.url : pathname.startsWith(t.url);
          return (
            <Button
              key={t.url}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-none border-b-2 border-transparent",
                active && "border-primary text-primary",
              )}
            >
              <Link to={t.url}>{t.label}</Link>
            </Button>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
