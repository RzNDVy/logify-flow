import type { StorageRepo, StorageSummary } from "../types";
import { delay, loadActivities, saveActivities } from "./store";
import { isArchived, IMAGE_ARCHIVE_DAYS } from "@/lib/rules/image-rules";

export const dummyStorageRepo: StorageRepo = {
  async summary(): Promise<StorageSummary> {
    await delay(140);
    const acts = loadActivities();
    const byProject = new Map<string, { bytes: number; count: number }>();
    let totalBytes = 0;
    let imageCount = 0;
    let archivedCount = 0;
    const now = new Date();
    for (const a of acts) {
      const b = byProject.get(a.projectId) ?? { bytes: 0, count: 0 };
      for (const img of a.images) {
        totalBytes += img.size;
        imageCount++;
        if (isArchived(img, now)) archivedCount++;
        b.bytes += img.size;
        b.count++;
      }
      byProject.set(a.projectId, b);
    }
    return {
      totalBytes,
      imageCount,
      archivedCount,
      byProject: Array.from(byProject.entries()).map(([projectId, v]) => ({ projectId, ...v })),
    };
  },
  async archiveOlderThan(days: number): Promise<number> {
    await delay(200);
    const acts = loadActivities();
    let n = 0;
    const now = new Date();
    for (const a of acts) {
      for (const img of a.images) {
        const age = (now.getTime() - new Date(img.createdAt).getTime()) / 86400000;
        if (age > days && !img.archived) {
          img.archived = true;
          n++;
        }
      }
    }
    saveActivities(acts);
    return n;
  },
  async deleteArchived(): Promise<number> {
    await delay(200);
    const acts = loadActivities();
    let n = 0;
    for (const a of acts) {
      const before = a.images.length;
      a.images = a.images.filter((img) => !img.archived);
      n += before - a.images.length;
    }
    saveActivities(acts);
    return n;
  },
};

export { IMAGE_ARCHIVE_DAYS };
