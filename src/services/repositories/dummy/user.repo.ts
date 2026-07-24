import type { NewUserDTO, UpdateUserDTO, UserRepo } from "../types";
import type { Role, User, UserStatus } from "@/types/domain";
import { delay, loadPasswords, loadUsers, savePasswords, saveUsers } from "./store";
import { uid } from "@/lib/id";

export const dummyUserRepo: UserRepo = {
  async list(query): Promise<User[]> {
    await delay();
    let users = loadUsers();
    if (query?.search) {
      const q = query.search.toLowerCase();
      users = users.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    if (query?.role) users = users.filter((u) => u.role === query.role);
    if (query?.status) users = users.filter((u) => u.status === query.status);
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  },
  async byId(id: string) {
    await delay(80);
    return loadUsers().find((u) => u.id === id) ?? null;
  },
  async create(input: NewUserDTO) {
    await delay();
    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("A user with that email already exists.");
    }
    const now = new Date().toISOString();
    const user: User = {
      id: uid("usr"),
      name: input.name,
      email: input.email,
      role: input.role,
      status: "active",
      jobTitle: input.jobTitle,
      department: input.department,
      createdAt: now,
    };
    saveUsers([...users, user]);
    const pw = loadPasswords();
    pw[user.id] = input.password;
    savePasswords(pw);
    return user;
  },
  async update(id: string, patch: UpdateUserDTO) {
    await delay();
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User not found.");
    users[idx] = { ...users[idx], ...patch };
    saveUsers(users);
    return users[idx];
  },
  async setStatus(id: string, status: UserStatus) {
    return this.update(id, { status });
  },
  async remove(id: string) {
    await delay();
    saveUsers(loadUsers().filter((u) => u.id !== id));
    const pw = loadPasswords();
    delete pw[id];
    savePasswords(pw);
  },
};

export type { Role };
