import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/layout/Logo";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "loading") return;
    router.navigate({
      to: auth.status === "authenticated" ? "/dashboard" : "/login",
      replace: true,
    });
  }, [auth.status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Logo className="h-10 w-10" />
        <p className="text-sm">Loading WAMS…</p>
      </div>
    </div>
  );
}
