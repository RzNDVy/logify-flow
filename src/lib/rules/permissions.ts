import type { Role, User } from "@/types/domain";

export function hasRole(user: User | null | undefined, role: Role): boolean {
  return !!user && user.role === role;
}

export function isAdmin(user: User | null | undefined): boolean {
  return hasRole(user, "admin");
}
