import type { AuthRepo, Credentials, UpdateUserDTO } from "../types";
import type { Session, User } from "@/types/domain";
import {
  delay,
  loadPasswords,
  loadSession,
  loadUsers,
  saveSession,
  savePasswords,
  saveUsers,
} from "./store";

export const dummyAuthRepo: AuthRepo = {
  async currentSession(): Promise<Session | null> {
    await delay(60);
    return loadSession();
  },
  async login({ email, password }: Credentials): Promise<Session> {
    await delay();
    const users = loadUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error("Invalid email or password.");
    if (user.status === "inactive") throw new Error("Account is inactive. Contact an admin.");
    const passwords = loadPasswords();
    if (passwords[user.id] !== password) throw new Error("Invalid email or password.");
    const session: Session = {
      user,
      token: `dummy.${user.id}.${Date.now()}`,
      issuedAt: new Date().toISOString(),
    };
    saveSession(session);
    return session;
  },
  async logout(): Promise<void> {
    await delay(80);
    saveSession(null);
  },
  async changePassword(userId: string, current: string, next: string): Promise<void> {
    await delay();
    const passwords = loadPasswords();
    if (passwords[userId] !== current) throw new Error("Current password is incorrect.");
    if (next.length < 8) throw new Error("New password must be at least 8 characters.");
    passwords[userId] = next;
    savePasswords(passwords);
  },
  async updateProfile(userId: string, patch: UpdateUserDTO): Promise<User> {
    await delay();
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error("User not found.");
    const updated: User = { ...users[idx], ...patch };
    users[idx] = updated;
    saveUsers(users);
    const session = loadSession();
    if (session && session.user.id === userId) {
      saveSession({ ...session, user: updated });
    }
    return updated;
  },
};
