import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import type { UserRepo, NewUserDTO, UpdateUserDTO } from "../types";
import type { User, UserStatus, Role } from "@/types/domain";

const mapUser = (row: any): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  status: row.status,
  jobTitle: row.position,
  department: row.department,
  avatarUrl: row.avatar_url,
});

export const supabaseUserRepo: UserRepo = {
  async list(query?: { search?: string; role?: Role; status?: UserStatus }): Promise<User[]> {
    let q = supabase.from("users").select("*");
    
    if (query?.role) {
      q = q.eq("role", query.role);
    }
    if (query?.status) {
      q = q.eq("status", query.status);
    }
    if (query?.search) {
      q = q.ilike("name", `%${query.search}%`);
    }

    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    
    return (data || []).map(mapUser);
  },

  async byId(id: string): Promise<User | null> {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return mapUser(data);
  },

  async create(input: NewUserDTO): Promise<User> {
    // 1. Create a temporary client that doesn't persist the session,
    // so we don't accidentally log the admin out.
    const tempClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // 2. Sign up the new user in Supabase Auth using the password provided by the admin
    const emailToUse = input.email.trim();
    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: emailToUse,
      password: input.password,
    });

    if (authError) throw new Error("Gagal membuat akun login: " + authError.message);
    if (!authData.user) throw new Error("Email mungkin sudah terdaftar di sistem.");

    // 3. Now insert the profile into public.users using the admin's existing authenticated client
    const { data, error } = await supabase
      .from("users")
      .insert({
        auth_id: authData.user.id,
        name: input.name.trim(),
        email: emailToUse,
        role: input.role,
        position: input.jobTitle,
        department: input.department,
      })
      .select()
      .single();
      
    if (error) throw new Error("Gagal menyimpan profil: " + error.message);
    
    return mapUser(data);
  },

  async update(id: string, patch: UpdateUserDTO): Promise<User> {
    const updateData: any = {};
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.role !== undefined) updateData.role = patch.role;
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.jobTitle !== undefined) updateData.position = patch.jobTitle;
    if (patch.department !== undefined) updateData.department = patch.department;
    if (patch.avatarUrl !== undefined) updateData.avatar_url = patch.avatarUrl;
    
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    
    return mapUser(data);
  },

  async setStatus(id: string, status: UserStatus): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    
    return mapUser(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
