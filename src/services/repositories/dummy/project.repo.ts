import type { NewProjectDTO, ProjectRepo, UpdateProjectDTO } from "../types";
import type { Project } from "@/types/domain";
import { delay, loadProjects, saveProjects } from "./store";
import { uid } from "@/lib/id";

export const dummyProjectRepo: ProjectRepo = {
  async list(): Promise<Project[]> {
    await delay(120);
    return [...loadProjects()].sort((a, b) => a.name.localeCompare(b.name));
  },
  async byId(id) {
    await delay(80);
    return loadProjects().find((p) => p.id === id) ?? null;
  },
  async create(input: NewProjectDTO) {
    await delay();
    const projects = loadProjects();
    if (projects.some((p) => p.key.toLowerCase() === input.key.toLowerCase())) {
      throw new Error("Project key must be unique.");
    }
    const project: Project = {
      id: uid("prj"),
      name: input.name,
      key: input.key.toUpperCase(),
      description: input.description,
      colorToken: input.colorToken,
      icon: input.icon,
      active: true,
      createdAt: new Date().toISOString(),
    };
    saveProjects([...projects, project]);
    return project;
  },
  async update(id: string, patch: UpdateProjectDTO) {
    await delay();
    const projects = loadProjects();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Project not found.");
    projects[idx] = { ...projects[idx], ...patch };
    saveProjects(projects);
    return projects[idx];
  },
  async remove(id: string) {
    await delay();
    saveProjects(loadProjects().filter((p) => p.id !== id));
  },
};
