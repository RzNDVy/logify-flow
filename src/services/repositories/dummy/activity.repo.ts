import type {
  ActivityQuery,
  ActivityRepo,
  NewActivityDTO,
  UpdateActivityDTO,
} from "../types";
import type { Activity, ActivityImage, DateRange, HeatmapCell, Paginated } from "@/types/domain";
import { delay, loadActivities, saveActivities } from "./store";
import { uid } from "@/lib/id";
import {
  canCreateForDate,
  canDelete,
  canModify,
  lockReason,
} from "@/lib/rules/activity-rules";
import { validateImageBatch, isArchived } from "@/lib/rules/image-rules";
import { daysBetween, todayISO } from "@/lib/date";

function fileToImage(file: File): ActivityImage {
  return {
    id: uid("img"),
    url: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
    mime: file.type,
    createdAt: new Date().toISOString(),
    archived: false,
  };
}

function within(activity: Activity, query: ActivityQuery): boolean {
  if (query.userId && activity.userId !== query.userId) return false;
  if (query.projectId && activity.projectId !== query.projectId) return false;
  if (query.range) {
    if (activity.date < query.range.start || activity.date > query.range.end) return false;
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    if (
      !activity.module.toLowerCase().includes(q) &&
      !activity.description.toLowerCase().includes(q)
    )
      return false;
  }
  return true;
}

function sortByDateTimeDesc(a: Activity, b: Activity): number {
  const da = `${a.date}T${a.time}`;
  const db = `${b.date}T${b.time}`;
  return db.localeCompare(da);
}

function refreshArchived(images: ActivityImage[]): ActivityImage[] {
  const now = new Date();
  return images.map((img) => ({ ...img, archived: isArchived(img, now) }));
}

export const dummyActivityRepo: ActivityRepo = {
  async list(query: ActivityQuery): Promise<Paginated<Activity>> {
    await delay();
    const all = loadActivities().filter((a) => within(a, query));
    all.sort(sortByDateTimeDesc);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const data = all.slice(start, start + pageSize).map((a) => ({
      ...a,
      images: refreshArchived(a.images),
    }));
    return { data, total: all.length, page, pageSize };
  },
  async byDate(userId: string, date: string): Promise<Activity[]> {
    await delay();
    return loadActivities()
      .filter((a) => a.userId === userId && a.date === date)
      .map((a) => ({ ...a, images: refreshArchived(a.images) }))
      .sort((a, b) => a.time.localeCompare(b.time));
  },
  async byId(id: string) {
    await delay(80);
    const a = loadActivities().find((x) => x.id === id) ?? null;
    return a ? { ...a, images: refreshArchived(a.images) } : null;
  },
  async recent(userId: string, limit: number) {
    await delay(140);
    return loadActivities()
      .filter((a) => a.userId === userId)
      .sort(sortByDateTimeDesc)
      .slice(0, limit)
      .map((a) => ({ ...a, images: refreshArchived(a.images) }));
  },
  async create(input: NewActivityDTO): Promise<Activity> {
    await delay();
    if (!canCreateForDate(input.date)) {
      throw new Error("You can only log activities within the last 7 days.");
    }
    const batch = validateImageBatch(0, input.images);
    if (batch.rejected.length > 0) {
      throw new Error(batch.rejected[0].reason);
    }
    const now = new Date().toISOString();
    const activity: Activity = {
      id: uid("act"),
      userId: input.userId,
      projectId: input.projectId,
      module: input.module.trim(),
      description: input.description.trim(),
      date: input.date,
      time: input.time,
      images: batch.accepted.map(fileToImage),
      createdAt: now,
      updatedAt: now,
    };
    const all = loadActivities();
    saveActivities([activity, ...all]);
    return activity;
  },
  async update(id: string, patch: UpdateActivityDTO): Promise<Activity> {
    await delay();
    const all = loadActivities();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Activity not found.");
    const activity = all[idx];
    const reason = lockReason(activity);
    if (reason) throw new Error(reason);
    const nextImages = patch.removeImageIds
      ? activity.images.filter((img) => !patch.removeImageIds!.includes(img.id))
      : activity.images;
    const addBatch = patch.addImages
      ? validateImageBatch(nextImages.length, patch.addImages)
      : { accepted: [] as File[], rejected: [] as { file: string; reason: string }[] };
    if (addBatch.rejected.length > 0) throw new Error(addBatch.rejected[0].reason);
    const updated: Activity = {
      ...activity,
      projectId: patch.projectId ?? activity.projectId,
      module: (patch.module ?? activity.module).trim(),
      description: (patch.description ?? activity.description).trim(),
      time: patch.time ?? activity.time,
      images: [...nextImages, ...addBatch.accepted.map(fileToImage)],
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    saveActivities(all);
    return updated;
  },
  async remove(id: string) {
    await delay();
    const all = loadActivities();
    const activity = all.find((a) => a.id === id);
    if (!activity) return;
    if (!canDelete(activity)) throw new Error(lockReason(activity) ?? "Cannot delete.");
    saveActivities(all.filter((a) => a.id !== id));
  },
  async heatmap(userId: string, range: DateRange): Promise<HeatmapCell[]> {
    await delay(120);
    const acts = loadActivities().filter(
      (a) => a.userId === userId && a.date >= range.start && a.date <= range.end,
    );
    const counts = new Map<string, number>();
    for (const a of acts) counts.set(a.date, (counts.get(a.date) ?? 0) + 1);
    const cells: HeatmapCell[] = [];
    // enumerate days in range
    const start = new Date(range.start);
    const end = new Date(range.end);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const count = counts.get(iso) ?? 0;
      const intensity: 0 | 1 | 2 | 3 | 4 =
        count === 0 ? 0 : count <= 1 ? 1 : count <= 2 ? 2 : count <= 4 ? 3 : 4;
      cells.push({ date: iso, count, intensity });
    }
    return cells;
  },
};

export { canModify, canDelete, lockReason };
export function isTodayISO(d: string): boolean {
  return d === todayISO();
}
export function ageInDays(d: string): number {
  return daysBetween(d, new Date());
}
