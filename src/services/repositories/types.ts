import type {
  Activity,
  ActivityImage,
  AdminStats,
  DateRange,
  HeatmapCell,
  Paginated,
  Project,
  ProjectColorToken,
  Session,
  User,
  UserStats,
  UserStatus,
  Role,
} from "@/types/domain";

// --------- DTOs ---------

export interface Credentials {
  email: string;
  password: string;
}

export interface NewActivityDTO {
  userId: string;
  projectId: string;
  module: string;
  description: string;
  date: string;
  time: string;
  images: File[];
}

export interface UpdateActivityDTO {
  projectId?: string;
  module?: string;
  description?: string;
  time?: string;
  addImages?: File[];
  removeImageIds?: string[];
}

export interface ActivityQuery {
  userId?: string;
  projectId?: string;
  search?: string;
  range?: DateRange;
  page?: number;
  pageSize?: number;
}

export interface NewProjectDTO {
  name: string;
  key: string;
  description?: string;
  colorToken: ProjectColorToken;
  icon: string;
}

export interface UpdateProjectDTO extends Partial<NewProjectDTO> {
  active?: boolean;
}

export interface NewUserDTO {
  name: string;
  email: string;
  role: Role;
  password: string;
  jobTitle?: string;
  department?: string;
}

export interface UpdateUserDTO {
  name?: string;
  role?: Role;
  status?: UserStatus;
  jobTitle?: string;
  department?: string;
  avatarUrl?: string;
}

export interface StorageSummary {
  totalBytes: number;
  imageCount: number;
  archivedCount: number;
  byProject: Array<{ projectId: string; bytes: number; count: number }>;
}

// --------- Repositories ---------

export interface AuthRepo {
  currentSession(): Promise<Session | null>;
  login(creds: Credentials): Promise<Session>;
  logout(): Promise<void>;
  changePassword(userId: string, current: string, next: string): Promise<void>;
  updateProfile(userId: string, patch: UpdateUserDTO): Promise<User>;
}

export interface UserRepo {
  list(query?: { search?: string; role?: Role; status?: UserStatus }): Promise<User[]>;
  byId(id: string): Promise<User | null>;
  create(input: NewUserDTO): Promise<User>;
  update(id: string, patch: UpdateUserDTO): Promise<User>;
  setStatus(id: string, status: UserStatus): Promise<User>;
  remove(id: string): Promise<void>;
}

export interface ProjectRepo {
  list(): Promise<Project[]>;
  byId(id: string): Promise<Project | null>;
  create(input: NewProjectDTO): Promise<Project>;
  update(id: string, patch: UpdateProjectDTO): Promise<Project>;
  remove(id: string): Promise<void>;
}

export interface ActivityRepo {
  list(query: ActivityQuery): Promise<Paginated<Activity>>;
  byDate(userId: string, date: string): Promise<Activity[]>;
  byId(id: string): Promise<Activity | null>;
  recent(userId: string, limit: number): Promise<Activity[]>;
  create(input: NewActivityDTO): Promise<Activity>;
  update(id: string, patch: UpdateActivityDTO): Promise<Activity>;
  remove(id: string): Promise<void>;
  heatmap(userId: string, range: DateRange): Promise<HeatmapCell[]>;
}

export interface StatsRepo {
  forUser(userId: string): Promise<UserStats>;
  forAdmin(): Promise<AdminStats>;
  activityTrend(range: DateRange): Promise<Array<{ date: string; count: number }>>;
  byProject(): Promise<Array<{ projectId: string; count: number }>>;
  topUsers(limit: number): Promise<Array<{ userId: string; count: number }>>;
}

export interface StorageRepo {
  summary(): Promise<StorageSummary>;
  archiveOlderThan(days: number): Promise<number>;
  deleteArchived(): Promise<number>;
}

export interface NotificationRepo {
  list(userId: string): Promise<Array<{ id: string; message: string; createdAt: string; read: boolean }>>;
  markAllRead(userId: string): Promise<void>;
}

export interface Repositories {
  auth: AuthRepo;
  users: UserRepo;
  projects: ProjectRepo;
  activities: ActivityRepo;
  stats: StatsRepo;
  storage: StorageRepo;
  notifications: NotificationRepo;
}

// Re-export image helpers as a canonical spot
export type { ActivityImage };
