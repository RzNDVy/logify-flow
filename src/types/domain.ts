export type Role = "admin" | "user";
export type UserStatus = "active" | "inactive";
export type ProjectColorToken =
  | "movely"
  | "eproc"
  | "website"
  | "internal"
  | "mobile";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  jobTitle?: string;
  department?: string;
  createdAt: string; // ISO
  lastActiveAt?: string; // ISO
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  colorToken: ProjectColorToken;
  icon: string; // lucide icon name
  active: boolean;
  createdAt: string;
}

export interface ActivityImage {
  id: string;
  url: string; // object URL or remote URL
  name: string;
  size: number; // bytes
  mime: string;
  createdAt: string;
  archived: boolean;
}

export interface Activity {
  id: string;
  userId: string;
  projectId: string;
  user?: User;
  project?: Project;
  module: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  images: ActivityImage[];
  createdAt: string;
  updatedAt: string;
}

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface UserStats {
  totalActivities: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
  streak: number;
  activeProjects: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalActivities: number;
  activitiesToday: number;
  activitiesThisWeek: number;
  activitiesThisMonth: number;
  totalProjects: number;
  storageUsedBytes: number;
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Session {
  user: User;
  token: string;
  issuedAt: string;
}

export type AuditActionCategory = "auth" | "user" | "activity" | "project" | "system";

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  action: string; // e.g. USER_LOGIN, CHANGE_PASSWORD, ADMIN_EDIT_PASSWORD, CREATE_USER, etc.
  category: AuditActionCategory;
  details: string;
  metadata?: Record<string, any>;
  createdAt: string; // ISO
}
