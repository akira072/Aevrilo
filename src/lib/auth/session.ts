import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { AppRole, Profile } from "@/types/database";

export interface UserSessionContext {
  isConfigured: boolean;
  userId: string | null;
  email: string | null;
  emailConfirmed: boolean;
  profile: Profile | null;
  roles: AppRole[];
  isAdmin: boolean;
  isOrganizer: boolean;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
}

export async function getCurrentUserContext(): Promise<UserSessionContext> {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      userId: null,
      email: null,
      emailConfirmed: false,
      profile: null,
      roles: [],
      isAdmin: false,
      isOrganizer: false,
      unreadNotificationsCount: 0,
      unreadMessagesCount: 0,
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      isConfigured: false,
      userId: null,
      email: null,
      emailConfirmed: false,
      profile: null,
      roles: [],
      isAdmin: false,
      isOrganizer: false,
      unreadNotificationsCount: 0,
      unreadMessagesCount: 0,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isConfigured: true,
      userId: null,
      email: null,
      emailConfirmed: false,
      profile: null,
      roles: [],
      isAdmin: false,
      isOrganizer: false,
      unreadNotificationsCount: 0,
      unreadMessagesCount: 0,
    };
  }

  const [{ data: profile }, { data: roleRows }, { count: unreadNotifs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  const roles = (roleRows ?? []).map((r) => r.role as AppRole);

  return {
    isConfigured: true,
    userId: user.id,
    email: user.email ?? null,
    emailConfirmed: Boolean(user.email_confirmed_at),
    profile: (profile as Profile | null) ?? null,
    roles,
    isAdmin: roles.includes("admin"),
    isOrganizer: roles.includes("organizer") || roles.includes("admin"),
    unreadNotificationsCount: unreadNotifs ?? 0,
    unreadMessagesCount: 0,
  };
}

export async function requireAuthenticatedUser(redirectTo = "/login") {
  const ctx = await getCurrentUserContext();
  if (!ctx.isConfigured) {
    return { ...ctx, unconfigured: true as const };
  }
  if (!ctx.userId) {
    redirect(redirectTo);
  }
  if (ctx.profile?.account_status === "suspended") {
    redirect("/account-suspended");
  }
  return { ...ctx, unconfigured: false as const };
}

export async function requireAdminUser() {
  const ctx = await requireAuthenticatedUser("/login");
  if (!ctx.unconfigured && !ctx.isAdmin) {
    redirect("/dashboard?error=admin_required");
  }
  return ctx;
}
