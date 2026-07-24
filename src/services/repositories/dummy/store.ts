// LocalStorage-backed dummy store. Simulates async latency to match a real backend.
import type {
  Activity,
  Project,
  Session,
  User,
} from "@/types/domain";
import { seedIfEmpty } from "./seed";

const NS = "wams";

export const KEYS = {
  users: `${NS}.users`,
  projects: `${NS}.projects`,
  activities: `${NS}.activities`,
  session: `${NS}.session`,
  notifications: `${NS}.notifications`,
  passwords: `${NS}.passwords`, // { [userId]: password }
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function delay(ms = 180): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 120));
}

export function ensureSeeded(): void {
  if (typeof window === "undefined") return;
  seedIfEmpty();
}

export function loadUsers(): User[] {
  ensureSeeded();
  return readJSON<User[]>(KEYS.users, []);
}
export function saveUsers(u: User[]): void {
  writeJSON(KEYS.users, u);
}
export function loadProjects(): Project[] {
  ensureSeeded();
  return readJSON<Project[]>(KEYS.projects, []);
}
export function saveProjects(p: Project[]): void {
  writeJSON(KEYS.projects, p);
}
export function loadActivities(): Activity[] {
  ensureSeeded();
  return readJSON<Activity[]>(KEYS.activities, []);
}
export function saveActivities(a: Activity[]): void {
  writeJSON(KEYS.activities, a);
}
export function loadSession(): Session | null {
  return readJSON<Session | null>(KEYS.session, null);
}
export function saveSession(s: Session | null): void {
  if (!s) removeKey(KEYS.session);
  else writeJSON(KEYS.session, s);
}
export function loadPasswords(): Record<string, string> {
  ensureSeeded();
  return readJSON<Record<string, string>>(KEYS.passwords, {});
}
export function savePasswords(p: Record<string, string>): void {
  writeJSON(KEYS.passwords, p);
}
