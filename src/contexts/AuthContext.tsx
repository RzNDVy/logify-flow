import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRepositories } from "@/services/repositories/context";
import type { Session, User } from "@/types/domain";
import type { UpdateUserDTO } from "@/services/repositories/types";

interface AuthContextValue {
  status: "loading" | "authenticated" | "unauthenticated";
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: UpdateUserDTO) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  hasRole: (role: User["role"]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const repos = useRepositories();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    let mounted = true;
    repos.auth.currentSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      setStatus(s ? "authenticated" : "unauthenticated");
    });
    return () => {
      mounted = false;
    };
  }, [repos]);

  const value: AuthContextValue = {
    status,
    user: session?.user ?? null,
    session,
    async login(email, password) {
      const s = await repos.auth.login({ email, password });
      setSession(s);
      setStatus("authenticated");
    },
    async logout() {
      await repos.auth.logout();
      setSession(null);
      setStatus("unauthenticated");
    },
    async updateProfile(patch) {
      if (!session) return;
      const u = await repos.auth.updateProfile(session.user.id, patch);
      setSession({ ...session, user: u });
    },
    async changePassword(current, next) {
      if (!session) throw new Error("Not signed in.");
      await repos.auth.changePassword(session.user.id, current, next);
    },
    hasRole(role) {
      return session?.user.role === role;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
