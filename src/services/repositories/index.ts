import type { Repositories } from "./types";
import { supabaseAuthRepo } from "./supabase/auth.repo";
import { supabaseUserRepo } from "./supabase/user.repo";
import { supabaseProjectRepo } from "./supabase/project.repo";
import { supabaseActivityRepo } from "./supabase/activity.repo";
import { supabaseStatsRepo } from "./supabase/stats.repo";
import { supabaseStorageRepo } from "./supabase/storage.repo";
import { supabaseNotificationRepo } from "./supabase/notification.repo";

// Factory. Swap `dummy*` for `supabase*` implementations in one place.
export const repositories: Repositories = {
  auth: supabaseAuthRepo,
  users: supabaseUserRepo,
  projects: supabaseProjectRepo,
  activities: supabaseActivityRepo,
  stats: supabaseStatsRepo,
  storage: supabaseStorageRepo,
  notifications: supabaseNotificationRepo,
};

export type { Repositories };
