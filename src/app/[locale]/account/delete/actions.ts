"use server";
import { cookies, headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { deletionFormSchema, mapDeletionError, type DeletionError } from "@/lib/account/deletion";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export interface DeletionState { error?: DeletionError }

/**
 * Permanently deletes the signed-in person's own account. All authorization happens in the database function delete_my_account():
 * it acts only on auth.uid(), requires a recent sign-in (and a second factor when one is enrolled), and refuses staff and retained-review accounts.
 * This action adds input validation, throttling, session clean-up and the redirect.
 */
export async function deleteAccountAction(_prev: DeletionState, form: FormData): Promise<DeletionState> {
  const supabase = await createClient();
  if (!supabase) return { error: "generic" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "auth" };
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  if (!rateLimit(`acct-del:${auth.user.id}`, 5, 10 * 60_000) || !rateLimit(`acct-del-ip:${ip}`, 20, 10 * 60_000)) return { error: "rate" };
  const parsed = deletionFormSchema.safeParse({ email: String(form.get("email") ?? ""), understand: form.get("understand") ?? "" });
  if (!parsed.success) return { error: "invalid" };

  const { error } = await supabase.rpc("delete_my_account", { p_email: parsed.data.email });
  if (error) return { error: mapDeletionError(error) };

  // The auth user and all its sessions and refresh tokens are gone. Clear this browser's session cookies and leave.
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  const jar = await cookies();
  for (const c of jar.getAll()) if (c.name.startsWith("sb-")) jar.delete(c.name);
  redirect({ href: "/account/deleted", locale: await getLocale() });
  return {};
}
