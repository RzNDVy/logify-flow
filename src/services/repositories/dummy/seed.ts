import type {
  Activity,
  ActivityImage,
  Project,
  ProjectColorToken,
  User,
} from "@/types/domain";
import { KEYS, readJSON, writeJSON } from "./store";
import { uid } from "@/lib/id";
import { addDays, format, subDays } from "date-fns";

const PROJECT_SEED: Array<Omit<Project, "id" | "createdAt">> = [
  { name: "Movely", key: "MOV", description: "Movement platform", colorToken: "movely", icon: "Truck", active: true },
  { name: "E-Procurement", key: "EPROC", description: "Procurement portal", colorToken: "eproc", icon: "ShoppingCart", active: true },
  { name: "Company Website", key: "WEB", description: "Marketing website", colorToken: "website", icon: "Globe", active: true },
  { name: "Internal Tools", key: "INT", description: "Ops & internal apps", colorToken: "internal", icon: "Wrench", active: true },
  { name: "Mobile App", key: "APP", description: "iOS + Android app", colorToken: "mobile", icon: "Smartphone", active: true },
];

const MODULES: Record<string, string[]> = {
  MOV: ["Dispatch", "Fleet", "Driver App", "Reports", "Billing"],
  EPROC: ["Catalog", "Approvals", "Vendors", "PO Workflow", "Reports"],
  WEB: ["Landing", "Blog", "Careers", "SEO", "Analytics"],
  INT: ["HR Portal", "Ticketing", "Wiki", "Access Control"],
  APP: ["Auth", "Feed", "Notifications", "Push", "Settings"],
};

const DESCRIPTIONS = [
  "Implemented the new component and covered edge cases.",
  "Refactored the module to reduce duplication and improve readability.",
  "Fixed a regression that caused stale data to render.",
  "Wrote tests for the recently shipped feature.",
  "Reviewed 3 pull requests and left detailed feedback.",
  "Paired on a tricky performance issue with the team.",
  "Investigated a production alert; opened a follow-up ticket.",
  "Sync with product to scope next iteration.",
  "Improved accessibility of primary CTAs.",
  "Updated docs and internal runbooks.",
];

const USER_SEED: Array<Omit<User, "id" | "createdAt">> = [
  { name: "Alex Morgan", email: "admin@wams.dev", role: "admin", status: "active", jobTitle: "Engineering Manager", department: "Engineering" },
  { name: "Jordan Chen", email: "user@wams.dev", role: "user", status: "active", jobTitle: "Frontend Engineer", department: "Engineering" },
  { name: "Priya Shah", email: "priya@wams.dev", role: "user", status: "active", jobTitle: "Product Designer", department: "Design" },
  { name: "Diego Alvarez", email: "diego@wams.dev", role: "user", status: "active", jobTitle: "Backend Engineer", department: "Engineering" },
  { name: "Mika Tanaka", email: "mika@wams.dev", role: "user", status: "inactive", jobTitle: "QA Engineer", department: "Quality" },
  { name: "Sam Rivera", email: "sam@wams.dev", role: "user", status: "active", jobTitle: "DevOps", department: "Platform" },
];

const PASSWORDS: Record<string, string> = {
  "admin@wams.dev": "admin123",
  "user@wams.dev": "user123",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  return Array.from({ length: n }, () => pick(arr));
}

export function seedIfEmpty(): void {
  const existing = readJSON<User[] | null>(KEYS.users, null);
  if (existing && existing.length > 0) return;

  const nowIso = new Date().toISOString();
  const users: User[] = USER_SEED.map((u, i) => ({
    ...u,
    id: `usr_${i + 1}`,
    createdAt: nowIso,
    lastActiveAt: nowIso,
  }));
  writeJSON(KEYS.users, users);

  const projects: Project[] = PROJECT_SEED.map((p, i) => ({
    ...p,
    id: `prj_${i + 1}`,
    createdAt: nowIso,
  }));
  writeJSON(KEYS.projects, projects);

  const passwordsByUserId: Record<string, string> = {};
  for (const u of users) {
    passwordsByUserId[u.id] = PASSWORDS[u.email] ?? "password123";
  }
  writeJSON(KEYS.passwords, passwordsByUserId);

  // Generate 500+ activities across last ~120 days.
  const activities: Activity[] = [];
  const today = new Date();
  for (const u of users) {
    // per-user, up to ~90 activities
    for (let d = 0; d < 120; d++) {
      const day = subDays(today, d);
      const perDay = Math.random() < 0.55 ? Math.floor(Math.random() * 3) + 1 : 0;
      for (let k = 0; k < perDay; k++) {
        const project = pick(projects);
        const module = pick(MODULES[project.key] ?? ["General"]);
        const hour = 8 + Math.floor(Math.random() * 10);
        const min = Math.floor(Math.random() * 60);
        const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        const dateStr = format(day, "yyyy-MM-dd");
        const nImages = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
        const images: ActivityImage[] = Array.from({ length: nImages }, (_, i) => ({
          id: uid("img"),
          url: `https://picsum.photos/seed/${uid("s")}/800/500`,
          name: `screenshot-${i + 1}.jpg`,
          size: 200_000 + Math.floor(Math.random() * 1_800_000),
          mime: "image/jpeg",
          createdAt: day.toISOString(),
          archived: d > 90,
        }));
        activities.push({
          id: uid("act"),
          userId: u.id,
          projectId: project.id,
          module,
          description: pick(DESCRIPTIONS),
          date: dateStr,
          time,
          images,
          createdAt: addDays(day, 0).toISOString(),
          updatedAt: addDays(day, 0).toISOString(),
        });
      }
    }
  }
  writeJSON(KEYS.activities, activities);
  writeJSON(KEYS.notifications, []);
}

export function projectColors(): ProjectColorToken[] {
  return ["movely", "eproc", "website", "internal", "mobile"];
}
