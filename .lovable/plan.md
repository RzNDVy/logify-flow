# WAMS — Work Activity Management System

Production-quality frontend-only build. Repository interfaces are the sole seam between UI and data; dummy in-memory repositories back them today, Supabase will back them tomorrow — the UI cannot tell the difference.

## 1. Architectural Principles (non-negotiable)

- **Repository-first.** UI, hooks, and features only import `services/repositories/types` — never a concrete implementation. A factory in `services/repositories/index.ts` returns the active impl (dummy now, Supabase later).
- **SOLID.**
  - *SRP:* one component, one hook, one repo method — one job.
  - *OCP:* new features add repos/adapters, don't fork existing code.
  - *LSP:* dummy and Supabase impls satisfy the exact same interface + return shapes (DTOs, not class instances).
  - *ISP:* per-aggregate interfaces (`AuthRepo`, `UserRepo`, `ProjectRepo`, `ActivityRepo`, `StorageRepo`, `StatsRepo`, `NotificationRepo`) instead of one god-repo.
  - *DIP:* features depend on interfaces; concrete impls are injected via a `RepositoryProvider` (Context) so tests / Storybook / Supabase can swap freely.
- **Composition over inheritance.** No class hierarchies; components compose primitives and hooks.
- **Business rules live in one place** — `lib/rules/` pure functions (e.g. `isActivityEditable(activity, now)`, `canAddOnDate(date, now)`, `isImageArchived(image, now)`, `validateImageUploads(files)`). Repositories AND UI both call these helpers; never inlined.
- **UI is dumb.** Presentational components take props; container hooks (`useActivities`, `useProject`, `useHeatmap`) wrap TanStack Query on top of repositories and expose typed data + mutations.
- **Component budget:** target ≤300 lines; if exceeded, split into subcomponents or extract hooks.
- **No prop drilling** beyond 2 levels — otherwise use Context (Auth, Theme, Repositories, CommandPalette) or a colocated hook.
- **Optimistic UI** for add/edit/delete activity, project CRUD, user status toggles (TanStack Query `onMutate` + rollback).
- **Strict TS, no `any`, no `unknown` leaks.** All DTOs typed; Zod schemas both validate forms and infer TS types.

## 2. Tech Stack

React 19 · TypeScript (strict) · TanStack Start & Router · Tailwind v4 · shadcn/ui · React Hook Form · Zod · TanStack Query · Framer Motion · Lucide · Recharts (admin charts) · cmdk (palette) · react-dropzone (uploads).

## 3. Design System

- **Font:** Inter (loaded via `<link>` in `__root.tsx`).
- **Radius:** `--radius: 0.75rem` → `rounded-xl` default.
- **Palette (light + dark, oklch tokens in `src/styles.css`):** very light gray background / near-black; white cards with soft shadow tokens (`--shadow-sm/md/lg`); Primary `#2563EB`, Success `#22C55E`, Warning `#F59E0B`, Danger `#EF4444`; project color tokens (`--project-movely` blue, `--project-eproc` green, `--project-website` orange, `--project-internal` purple, `--project-mobile` pink).
- **Motion:** Framer Motion presets in `lib/motion.ts` (fade+rise 200ms ease-out, drawer slide, staggered lists) — subtle, premium.
- **Theme toggle:** class-based dark mode, persisted; read in `useEffect` to avoid hydration mismatch.

## 4. Folder Structure (Feature-Based)

```text
src/
  routes/                              # TanStack Start file routes only
    __root.tsx
    index.tsx                          # session-aware redirect (dummy)
    login.tsx
    _app.tsx                           # auth gate + AppShell
    _app/dashboard.tsx
    _app/activity.$date.tsx
    _app/history.tsx
    _app/profile.tsx
    _app/change-password.tsx
    _app/_admin.tsx                    # role gate
    _app/_admin/admin.index.tsx        # users
    _app/_admin/admin.projects.tsx
    _app/_admin/admin.statistics.tsx
    _app/_admin/admin.storage.tsx
    _app/_admin/admin.monitor.tsx
  features/
    auth/          { components, hooks, schemas }
    dashboard/     { hero, stats-cards, heatmap, recent-activities }
    activity/      { timeline, activity-card, add-activity-drawer, image-uploader, image-viewer, project-badge, lock-banner }
    history/
    profile/
    admin/         { users-table, projects-crud, statistics, storage-card, activity-monitor }
    command-palette/
  components/
    ui/            # shadcn primitives
    common/        # PageHeader, EmptyState, ErrorState, Skeletons, DataTable, ConfirmDialog, Kbd, StatCard
    layout/        # AppShell, AppSidebar, TopNavbar, MobileFAB
  services/
    repositories/
      types.ts                         # interfaces + DTOs
      index.ts                         # factory + RepositoryProvider
      dummy/                           # in-memory impls, localStorage-persisted
        auth.repo.ts
        user.repo.ts
        project.repo.ts
        activity.repo.ts
        storage.repo.ts
        stats.repo.ts
        notification.repo.ts
        seed.ts                        # 500+ activities, users, projects
      supabase/                        # empty placeholders + README (drop-in later)
    notifications/  comments/  audit/  realtime/  export/   # future-ready stubs
  contexts/       AuthContext, ThemeContext, RepositoryContext, CommandPaletteContext
  hooks/          useAuth, useActivities, useActivity, useProjects, useStats, useHeatmap,
                  useHotkeys, useHydrated, useMediaQuery, useOptimisticMutation
  lib/
    rules/        activity-rules.ts, image-rules.ts, permissions.ts
    date.ts, format.ts, cn.ts, motion.ts, constants.ts, id.ts
  types/          domain models (User, Role, Project, Activity, ActivityImage, HeatmapCell, Stats)
  assets/         inline illustrations for empty states
```

## 5. Domain Types & Repository Interfaces

```ts
// types/domain.ts (excerpt)
export type Role = 'admin' | 'user';
export interface User { id: string; name: string; email: string; role: Role; avatarUrl?: string; status: 'active'|'inactive'; createdAt: string; lastActiveAt?: string; }
export interface Project { id: string; name: string; key: string; colorToken: ProjectColorToken; icon: LucideIconName; }
export interface ActivityImage { id: string; url: string; name: string; size: number; createdAt: string; archived: boolean; }
export interface Activity { id: string; userId: string; projectId: string; module: string; description: string; date: string; time: string; images: ActivityImage[]; createdAt: string; updatedAt: string; }
```

```ts
// services/repositories/types.ts (excerpt)
export interface ActivityRepo {
  list(query: ActivityQuery): Promise<Paginated<Activity>>;
  byDate(userId: string, date: string): Promise<Activity[]>;
  byId(id: string): Promise<Activity | null>;
  create(input: NewActivityDTO): Promise<Activity>;
  update(id: string, patch: UpdateActivityDTO): Promise<Activity>;
  remove(id: string): Promise<void>;
  heatmap(userId: string, range: DateRange): Promise<HeatmapCell[]>;
}
```

All methods return Promises and plain DTOs so the Supabase impl is a literal drop-in. Dummy impl persists to `localStorage` under `wams.*` keys and simulates 150–300ms latency.

## 6. Business Rules (single source)

`lib/rules/activity-rules.ts`:
- `isWithinEditWindow(dateISO, now = new Date())` → boolean (≤7 days).
- `canCreateForDate(date, now)` / `canModify(activity, now)` / `canDelete(activity, now)`.
- `lockReason(activity, now)` → i18n-safe string.

`lib/rules/image-rules.ts`:
- `MAX_IMAGES = 5`, `MAX_BYTES = 10 * 1024 * 1024`, `ALLOWED_MIME = ['image/png','image/jpeg','image/webp']`.
- `validateImageBatch(existing, incoming) → Result<ValidFiles, RuleError[]>`.
- `isArchived(image, now)` (>90d) — used by UI badge AND repo response mapping.

Repositories call the same helpers before persisting; UI calls them for enable/disable state. No duplication.

## 7. Pages

- **/login** — centered card, Inter, RHF+Zod, dummy accounts (`admin@wams.dev` / `admin123`, `user@wams.dev` / `user123`).
- **/dashboard** — Hero greeting + date + streak chip · Stats grid (6 cards, animated counters) · GitHub heatmap (custom, 53 wks, 5 intensities, Radix tooltip, click → `/activity/{date}`) · Recent 5 activities + View All.
- **/activity/:date** — Prev/next/today nav · Lock banner when locked · Linear-style vertical timeline · Add Activity button → Drawer (RHF+Zod, project select, module, description, dropzone) · edit/delete on each card gated by rules.
- **/history** — Filterable (project, date range, search), grouped by day, paginated.
- **/profile** — Read + edit basic fields, link to /change-password.
- **/change-password** — RHF+Zod strength rules; calls `authRepo.changePassword`.
- **/admin/** — nested layout with sub-nav for Users, Projects, Statistics, Storage, Activity Monitor (all specs from the brief; charts via lazy-loaded Recharts).

## 8. Shell & Interaction

`AppShell` composes shadcn `Sidebar` (icon-collapsible; Admin section conditional on `hasRole('admin')`) and `TopNavbar` (palette-trigger search, notifications, theme toggle, avatar menu). Mobile: sidebar becomes offcanvas Sheet + floating FAB on `/activity/:date`.

**Command palette** (`cmdk`): ⌘/Ctrl+K. Sections: Navigate · Projects · Modules · Recent activities · Quick dates. **Hotkeys** via `useHotkeys`: Ctrl+S in Add Drawer, ESC everywhere, arrows in Image Viewer.

**Image Viewer:** fullscreen dialog, zoom (wheel + buttons), rotate, fit/original, prev/next, download, focus trap, ESC.

## 9. States, A11y, Responsiveness

- **Empty:** inline SVG + copy + primary CTA.
- **Loading:** per-surface skeletons.
- **Error:** friendly panel + Retry (`router.invalidate()` + `queryClient.invalidateQueries`).
- **A11y:** aria-labels on all icon buttons, focus trap in dialogs (Radix), keyboard navigation everywhere, WCAG AA contrast enforced by semantic tokens only.
- **Responsive:** grid + `min-w-0` + `shrink-0` patterns; breakpoints sm/md/lg/xl.

## 10. Performance & Future-Ready

- Automatic route-level code splitting; `React.lazy` for admin charts and Image Viewer.
- `React.memo` on ActivityCard, HeatmapCell; virtualized History if long.
- Object URLs released on unmount.
- TanStack Query staleTime tuned per key.
- Future-ready service stubs: `notifications`, `comments`, `audit`, `realtime`, `export` (typed interfaces + no-op dummy) so bell menu, comment slots on ActivityCard, and admin Export buttons exist without expanding scope.

## 11. Build Order

1. Tokens, theme provider, Inter, base shell scaffolding, head metadata per route.
2. Domain types + repository interfaces + dummy repos + seed generator (≥500 activities).
3. AuthContext + `/login` + route guards + `_app` shell (sidebar + navbar).
4. Business-rule helpers + hooks (useActivities, useActivity, useProjects, useStats, useHeatmap).
5. Dashboard (hero, stats, heatmap, recent).
6. Activity page (timeline, add drawer, image uploader, image viewer, lock rules).
7. History, Profile, Change Password.
8. Admin section (users, projects, statistics, storage, monitor).
9. Command palette + hotkeys + mobile FAB.
10. States pass (empty/loading/error), a11y pass, responsive pass, polish.

## Notes

- No Supabase enablement now — repositories are the seam; a follow-up turn swaps `services/repositories/index.ts` to the Supabase impls without touching UI.
- `src/routes/index.tsx` becomes a session-aware redirect (`/dashboard` if authed, `/login` otherwise) — placeholder removed.
- All shareable routes get unique `head()` (title/description/og/twitter).
- Zero `any`; Zod schemas colocated in `features/*/schemas.ts` and re-used across forms and repository input validation.

Approve to start building in the order above.
