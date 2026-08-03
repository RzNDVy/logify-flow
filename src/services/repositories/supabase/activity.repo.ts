import { supabase } from "@/lib/supabase";
import type { ActivityRepo, NewActivityDTO, UpdateActivityDTO, ActivityQuery } from "../types";
import type { Activity, DateRange, HeatmapCell, Paginated } from "@/types/domain";
import { getAutoEndTime } from "@/lib/activity-time";

const LOCAL_END_TIMES_KEY = "wams_activity_end_times";

function getLocalEndTime(id: string): string | undefined {
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(LOCAL_END_TIMES_KEY) : null;
    if (!stored) return undefined;
    const parsed = JSON.parse(stored);
    return parsed[id];
  } catch {
    return undefined;
  }
}

function setLocalEndTime(id: string, endTime: string) {
  try {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(LOCAL_END_TIMES_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[id] = endTime;
    localStorage.setItem(LOCAL_END_TIMES_KEY, JSON.stringify(parsed));
  } catch {}
}

const mapActivity = (row: any): Activity => {
  const startTime = row.activity_time || "00:00";
  const desc = row.description || "";
  const localEndTime = getLocalEndTime(row.id);
  const rawEndTime = row.end_time || row.activity_end_time || row.endTime || localEndTime;
  const endTime = rawEndTime ? String(rawEndTime).slice(0, 5) : getAutoEndTime(startTime, desc);

  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    user: row.users
      ? {
          id: row.users.id,
          name: row.users.name || "Unknown",
          email: row.users.email || "",
          role: row.users.role || "user",
          status: row.users.status || "active",
          avatarUrl: row.users.avatar_url,
          createdAt: row.users.created_at || new Date().toISOString(),
        }
      : undefined,
    project: row.projects
      ? {
          id: row.projects.id,
          name: row.projects.name || "Unknown",
          key: row.projects.code || "",
          colorToken: row.projects.color || "gray",
          icon: row.projects.icon || "",
          active: row.projects.is_active,
          createdAt: row.projects.created_at || new Date().toISOString(),
        }
      : undefined,
    module: row.module_name || "General",
    description: row.description,
    date: row.activity_date,
    time: startTime,
    endTime,
    images: (row.activity_images || []).map((img: any) => ({
      id: img.id,
      url: img.public_url,
      fileSize: img.file_size,
      type: img.mime_type,
      name: img.file_name,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const supabaseActivityRepo: ActivityRepo = {
  async list(query: ActivityQuery): Promise<Paginated<Activity>> {
    let q = supabase
      .from("activities")
      .select(`
        *,
        users!activities_user_id_fkey ( id, name, email, role, status, avatar_url ),
        projects ( id, name, code, color, icon, is_active ),
        activity_images ( id, public_url, file_size, mime_type, file_name )
      `, { count: 'exact' });

    if (query.userId) q = q.eq("user_id", query.userId);
    if (query.projectId) q = q.eq("project_id", query.projectId);
    if (query.range) {
      if (query.range.start) q = q.gte("activity_date", query.range.start);
      if (query.range.end) q = q.lte("activity_date", query.range.end);
    }
    if (query.search) {
      q = q.ilike("description", `%${query.search}%`);
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    q = q.order("activity_date", { ascending: false }).order("activity_time", { ascending: false });
    q = q.range(from, to);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    return {
      data: (data || []).map(mapActivity),
      total: count || 0,
      page,
      pageSize,
    };
  },

  async byDate(userId: string, date: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from("activities")
      .select(`
        *,
        users!activities_user_id_fkey ( id, name, email, role, status, avatar_url ),
        projects ( id, name, code, color, icon, is_active ),
        activity_images ( id, public_url, file_size, mime_type, file_name )
      `)
      .eq("user_id", userId)
      .eq("activity_date", date)
      .order("activity_time", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapActivity);
  },

  async byId(id: string): Promise<Activity | null> {
    const { data, error } = await supabase
      .from("activities")
      .select(`
        *,
        users!activities_user_id_fkey ( id, name, email, role, status, avatar_url ),
        projects ( id, name, code, color, icon, is_active ),
        activity_images ( id, public_url, file_size, mime_type, file_name )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return mapActivity(data);
  },

  async recent(userId: string, limit: number): Promise<Activity[]> {
    const { data, error } = await supabase
      .from("activities")
      .select(`
        *,
        users!activities_user_id_fkey ( id, name, email, role, status, avatar_url ),
        projects ( id, name, code, color, icon, is_active ),
        activity_images ( id, public_url, file_size, mime_type, file_name )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data || []).map(mapActivity);
  },

  async create(input: NewActivityDTO): Promise<Activity> {
    // Basic insert without image upload logic which will be handled by StorageRepo or separate calls
    // Usually images are uploaded first, then activity created, or vice-versa.
    // Assuming UI handles image upload and passes URLs, but the DTO accepts File[].
    // Note: DTO uses File[]. In a real app, we'd upload them to supabase storage here.
    // For simplicity in the repo layer without access to window/File APIs reliably or 
    // requiring complex multiparts, we'll assume the caller uploads them or we do it here.

    const insertPayload: any = {
      user_id: input.userId,
      project_id: input.projectId,
      description: input.description,
      activity_date: input.date,
      activity_time: input.time,
      title: "Activity",
      module_name: input.module
    };
    if (input.endTime) {
      insertPayload.end_time = input.endTime;
    }

    let { data: act, error: actError } = await supabase
      .from("activities")
      .insert(insertPayload)
      .select()
      .single();

    if (actError && (actError.message?.includes("end_time") || actError.code === "PGRST204" || actError.code === "42703")) {
      // Database schema does not have 'end_time' column yet, retry insert without end_time
      delete insertPayload.end_time;
      const retry = await supabase
        .from("activities")
        .insert(insertPayload)
        .select()
        .single();
      act = retry.data;
      actError = retry.error;
    }

    if (actError) throw new Error(actError.message);

    if (act && input.endTime) {
      setLocalEndTime(act.id, input.endTime);
    }

    if (input.images && input.images.length > 0) {
      for (const file of input.images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${act.id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("activity-images")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });
          
        if (uploadError) {
          console.error("Failed to upload image:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("activity-images")
          .getPublicUrl(uploadData.path);
          
        await supabase.from("activity_images").insert({
          activity_id: act.id,
          file_name: file.name,
          storage_path: uploadData.path,
          public_url: publicUrl,
          mime_type: file.type,
          file_size: file.size
        });
      }
    }

    return this.byId(act.id) as Promise<Activity>;
  },

  async update(id: string, patch: UpdateActivityDTO): Promise<Activity> {
    const updateData: any = {};
    if (patch.projectId !== undefined) updateData.project_id = patch.projectId;
    if (patch.module !== undefined) updateData.module_name = patch.module;
    if (patch.description !== undefined) updateData.description = patch.description;
    if (patch.time !== undefined) updateData.activity_time = patch.time;
    if (patch.endTime !== undefined) updateData.end_time = patch.endTime;

    let { error } = await supabase
      .from("activities")
      .update(updateData)
      .eq("id", id);

    if (error && (error.message?.includes("end_time") || error.code === "PGRST204" || error.code === "42703")) {
      // Database schema does not have 'end_time' column yet, retry update without end_time
      delete updateData.end_time;
      const retry = await supabase
        .from("activities")
        .update(updateData)
        .eq("id", id);
      error = retry.error;
    }

    if (error) throw new Error(error.message);

    if (patch.endTime) {
      setLocalEndTime(id, patch.endTime);
    }

    if (patch.removeImageIds && patch.removeImageIds.length > 0) {
      // Fetch paths to delete from storage
      const { data: imagesToRemove } = await supabase
        .from("activity_images")
        .select("storage_path")
        .in("id", patch.removeImageIds);
        
      if (imagesToRemove && imagesToRemove.length > 0) {
        const paths = imagesToRemove.map(img => img.storage_path);
        await supabase.storage.from("activity-images").remove(paths);
      }
      
      // Delete from DB
      await supabase.from("activity_images").delete().in("id", patch.removeImageIds);
    }

    if (patch.addImages && patch.addImages.length > 0) {
      for (const file of patch.addImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("activity-images")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });
          
        if (uploadError) {
          console.error("Failed to upload image during update:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("activity-images")
          .getPublicUrl(uploadData.path);
          
        await supabase.from("activity_images").insert({
          activity_id: id,
          file_name: file.name,
          storage_path: uploadData.path,
          public_url: publicUrl,
          mime_type: file.type,
          file_size: file.size
        });
      }
    }

    return this.byId(id) as Promise<Activity>;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async heatmap(userId: string, range: DateRange): Promise<HeatmapCell[]> {
    const { data, error } = await supabase
      .from("activities")
      .select("activity_date")
      .eq("user_id", userId)
      .gte("activity_date", range.start)
      .lte("activity_date", range.end);

    if (error) throw new Error(error.message);

    const counts: Record<string, number> = {};
    (data || []).forEach((row) => {
      counts[row.activity_date] = (counts[row.activity_date] || 0) + 1;
    });

    const cells: HeatmapCell[] = [];
    const start = new Date(range.start);
    const end = new Date(range.end);
    let current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const count = counts[dateStr] || 0;
      let intensity: 0 | 1 | 2 | 3 | 4 = 0;
      if (count === 1) intensity = 1;
      else if (count === 2) intensity = 2;
      else if (count === 3) intensity = 3;
      else if (count >= 4) intensity = 4;

      cells.push({ date: dateStr, count, intensity });
      current.setDate(current.getDate() + 1);
    }

    return cells;
  }
};
