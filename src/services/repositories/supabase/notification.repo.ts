import { supabase } from "@/lib/supabase";
import type { NotificationRepo } from "../types";

export const supabaseNotificationRepo: NotificationRepo = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) throw new Error(error.message);
    
    return (data || []).map(row => ({
      id: row.id,
      message: row.message,
      createdAt: row.created_at,
      read: row.is_read
    }));
  },

  async markAllRead(userId: string): Promise<void> {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
  }
};
