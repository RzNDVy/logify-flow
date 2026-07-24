import type { ActivityImage } from "@/types/domain";
import { daysBetween } from "@/lib/date";

export const MAX_IMAGES_PER_ACTIVITY = 5;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export const IMAGE_ARCHIVE_DAYS = 90;

export interface ImageRuleError {
  file: string;
  reason: string;
}

export interface ValidatedBatch {
  accepted: File[];
  rejected: ImageRuleError[];
}

export function validateImageBatch(
  existingCount: number,
  incoming: File[],
): ValidatedBatch {
  const accepted: File[] = [];
  const rejected: ImageRuleError[] = [];
  const remaining = Math.max(0, MAX_IMAGES_PER_ACTIVITY - existingCount);

  for (const file of incoming) {
    if (accepted.length >= remaining) {
      rejected.push({
        file: file.name,
        reason: `Max ${MAX_IMAGES_PER_ACTIVITY} images per activity.`,
      });
      continue;
    }
    if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
      rejected.push({ file: file.name, reason: "Only PNG, JPG or WebP allowed." });
      continue;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      rejected.push({ file: file.name, reason: "File exceeds 10MB." });
      continue;
    }
    accepted.push(file);
  }
  return { accepted, rejected };
}

export function isArchived(image: ActivityImage, now: Date = new Date()): boolean {
  return daysBetween(image.createdAt, now) > IMAGE_ARCHIVE_DAYS;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}
