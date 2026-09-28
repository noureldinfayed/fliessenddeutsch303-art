import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { createLocalSupabaseClient, localProfile, localUser } from "@/lib/local-db";
import type { Role, UserProfile } from "@/lib/types";

export const roleHome: Record<Role, string> = {
  admin: "/admin/dashboard",
  reception: "/reception/attendance/students",
  sales: "/sales/leads",
  teacher: "/teacher/attendance",
};

type AuthContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: Pick<User, "id" | "email">;
  profile: UserProfile;
};

export async function getCurrentUser(requiredRole?: Role | Role[]): Promise<AuthContext> {
  if (!hasSupabaseEnv()) {
    const fallbackRole = (Array.isArray(requiredRole) ? requiredRole[0] : requiredRole) ?? "admin";
    const cookieStore = await cookies();
    const role = (cookieStore.get("fd_local_role")?.value as Role | undefined) ?? fallbackRole;
    const profile = localProfile(role, cookieStore.get("fd_local_user_id")?.value);
    return { supabase: createLocalSupabaseClient() as unknown as AuthContext["supabase"], user: { id: profile.id, email: profile.email ?? localUser.email }, profile };
  }
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: profile, error } = await supabase.from("users").select("*").eq("id", auth.user.id).single();
  if (error || !profile || !profile.is_active) redirect("/login?deactivated=1");
  const typed = profile as UserProfile;
  const allowed = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : null;
  if (allowed && !allowed.includes(typed.role)) redirect(roleHome[typed.role]);
  return { supabase, user: auth.user, profile: typed };
}
