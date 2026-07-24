import type { NotificationRepo } from "../types";
import { delay, KEYS, readJSON, writeJSON } from "./store";

interface Notification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
  userId: string;
}

export const dummyNotificationRepo: NotificationRepo = {
  async list(userId: string) {
    await delay(80);
    return readJSON<Notification[]>(KEYS.notifications, [])
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async markAllRead(userId: string) {
    await delay(80);
    const all = readJSON<Notification[]>(KEYS.notifications, []);
    for (const n of all) if (n.userId === userId) n.read = true;
    writeJSON(KEYS.notifications, all);
  },
};
