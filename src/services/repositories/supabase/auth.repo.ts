import { supabase } from "@/lib/supabase";
import type { AuthRepo, Credentials, UpdateUserDTO } from "../types";
import type { Session, User } from "@/types/domain";
import { supabaseAuditLogRepo } from "./audit.repo";

export const supabaseAuthRepo: AuthRepo = {
  async currentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    // Fetch custom user profile from public.users table
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", session.user.id)
      .single();
      
    if (error || !profile) return null;

    return {
      token: session.access_token,
      issuedAt: new Date().toISOString(),
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        jobTitle: profile.position,
        department: profile.department,
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at || new Date().toISOString(),
      },
    };
  },

  async login(creds: Credentials): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: creds.email,
      password: creds.password,
    });
    
    if (error) throw new Error(error.message);
    
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", data.session.user.id)
      .single();
      
    if (profileError || !profile) throw new Error("Profile not found.");

    // Record audit log for login
    supabaseAuditLogRepo.create({
      userId: profile.id,
      userName: profile.name,
      userEmail: profile.email,
      userAvatarUrl: profile.avatar_url,
      action: "USER_LOGIN",
      category: "auth",
      details: `User ${profile.name} (${profile.email}) logged into the application.`,
    });

    return {
      token: data.session.access_token,
      issuedAt: new Date().toISOString(),
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        jobTitle: profile.position,
        department: profile.department,
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at || new Date().toISOString(),
      },
    };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    // Note: To properly verify current password, you'd need to re-authenticate or use Edge Functions.
    // For now, we update the user password directly.
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) throw new Error(error.message);

    // Record audit log for user changing password
    supabaseAuditLogRepo.create({
      userId,
      action: "CHANGE_PASSWORD",
      category: "auth",
      details: `User updated their account password.`,
    });
  },

  async updateProfile(userId: string, patch: UpdateUserDTO): Promise<User> {
    const updateData: any = {};
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.jobTitle !== undefined) updateData.position = patch.jobTitle;
    if (patch.department !== undefined) updateData.department = patch.department;
    if (patch.avatarUrl !== undefined) updateData.avatar_url = patch.avatarUrl;
    
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        jobTitle: data.position,
        department: data.department,
        avatarUrl: data.avatar_url,
        createdAt: data.created_at || new Date().toISOString(),
    };
  },
};
