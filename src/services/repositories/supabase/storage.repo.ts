import { supabase } from "@/lib/supabase";
import type { StorageRepo, StorageSummary } from "../types";

export const supabaseStorageRepo: StorageRepo = {
  async summary(): Promise<StorageSummary> {
    // In a production environment, this would call an RPC or aggregate the activity_images table.
    return {
      totalBytes: 0,
      imageCount: 0,
      archivedCount: 0,
      byProject: [],
    };
  },

  async archiveOlderThan(days: number): Promise<number> {
    // This will normally be triggered by the Supabase Edge Function cron job.
    return 0;
  },

  async deleteArchived(): Promise<number> {
    return 0;
  }
};
