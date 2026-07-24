import { supabase } from "@/lib/supabase";
import type { ProjectRepo, NewProjectDTO, UpdateProjectDTO } from "../types";
import type { Project, ProjectColorToken } from "@/types/domain";

const mapProject = (row: any): Project => ({
  id: row.id,
  name: row.name,
  key: row.code,
  description: row.description || "",
  colorToken: row.color as ProjectColorToken,
  icon: row.icon,
  active: row.is_active,
  moduleCount: 0,
});

export const supabaseProjectRepo: ProjectRepo = {
  async list(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) throw new Error(error.message);
    
    return (data || []).map(row => ({
      ...mapProject(row),
      moduleCount: 0
    }));
  },

  async byId(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    
    return {
      ...mapProject(data),
      moduleCount: 0
    };
  },

  async create(input: NewProjectDTO): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: input.name,
        code: input.key,
        color: input.colorToken,
        icon: input.icon,
        description: input.description,
      })
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    
    return mapProject(data);
  },

  async update(id: string, patch: UpdateProjectDTO): Promise<Project> {
    const updateData: any = {};
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.key !== undefined) updateData.code = patch.key;
    if (patch.description !== undefined) updateData.description = patch.description;
    if (patch.colorToken !== undefined) updateData.color = patch.colorToken;
    if (patch.icon !== undefined) updateData.icon = patch.icon;
    if (patch.active !== undefined) updateData.is_active = patch.active;
    
    const { data, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    
    return mapProject(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
};
