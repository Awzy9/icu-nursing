import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";

export type AppRole = "learner" | "author" | "clinical_reviewer" | "publisher" | "admin";
export const STAFF_ROLES: readonly AppRole[] = ["author", "clinical_reviewer", "publisher", "admin"];

export interface SessionUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

/** Current user, validated with the auth server (never trusts the cookie alone). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const meta = data.user.user_metadata as { display_name?: string } | null;
  return { id: data.user.id, email: data.user.email ?? null, displayName: meta?.display_name ?? null };
});

export const getRoles = cache(async (userId: string): Promise<AppRole[]> => {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as AppRole);
});

export async function requireUser(locale: string, next?: string) {
  const user = await getSessionUser();
  if (!user) redirect({ href: `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`, locale });
  return user!;
}

/** Staff pages: signed in, holds one of `allowed`, and (for staff) has completed MFA (aal2). */
export async function requireStaff(locale: string, allowed: readonly AppRole[] = STAFF_ROLES, next?: string) {
  const user = await requireUser(locale, next);
  const roles = await getRoles(user.id);
  if (!roles.some((r) => allowed.includes(r))) redirect({ href: "/dashboard", locale });
  const supabase = await createClient();
  const { data } = await supabase!.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel !== "aal2") redirect({ href: `/mfa?next=${encodeURIComponent(next ?? "/admin")}`, locale });
  return { user: user!, roles };
}
