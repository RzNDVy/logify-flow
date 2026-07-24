import type { Repositories } from "./types";
import { dummyAuthRepo } from "./dummy/auth.repo";
import { dummyUserRepo } from "./dummy/user.repo";
import { dummyProjectRepo } from "./dummy/project.repo";
import { dummyActivityRepo } from "./dummy/activity.repo";
import { dummyStatsRepo } from "./dummy/stats.repo";
import { dummyStorageRepo } from "./dummy/storage.repo";
import { dummyNotificationRepo } from "./dummy/notification.repo";

// Factory. Swap `dummy*` for `supabase*` implementations in one place.
export const repositories: Repositories = {
  auth: dummyAuthRepo,
  users: dummyUserRepo,
  projects: dummyProjectRepo,
  activities: dummyActivityRepo,
  stats: dummyStatsRepo,
  storage: dummyStorageRepo,
  notifications: dummyNotificationRepo,
};

export type { Repositories };
