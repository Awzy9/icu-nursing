"use server";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { safeRedirectPath } from "@/lib/utils";
import { errorKey, newPasswordSchema, profileSchema, resetRequestSchema, signInSchema, signUpSchema } from "@/lib/validation";

export interface FormState { error?: string; ok?: boolean; message?: string }

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}
const siteUrl = () => (getEnv().NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
/** CAPTCHA: when Turnstile is configured a token is mandatory; Supabase Auth verifies it server-side (secret kept in Supabase). */
function captcha(form: FormData): { captchaToken?: string } | { error: string } {
  if (!getEnv().captchaEnabled) return {};
  const token = String(form.get("captchaToken") ?? "").trim();
  if (!token || token.length > 4096) return { error: "captchaRequired" };
  return { captchaToken: token };
}
const isCaptchaError = (e: { code?: string; message?: string }) => e.code === "captcha_failed" || /captcha/i.test(e.message ?? "");
const fd = (f: FormData) => Object.fromEntries([...f.entries()].filter(([, v]) => typeof v === "string"));

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = await getLocale();
  const supabase = await createClient();
  if (!supabase) return { error: "demoUnavailable" };
  if (!rateLimit(`signin:${await clientIp()}`)) return { error: "rateLimited" };
  const parsed = signInSchema.safeParse(fd(form));
  if (!parsed.success) return { error: errorKey(parsed.error.issues[0]) };
  const cap = captcha(form);
  if ("error" in cap) return { error: cap.error };
  const { error } = await supabase.auth.signInWithPassword({ ...parsed.data, options: { captchaToken: cap.captchaToken } });
  if (error) {
    if (isCaptchaError(error)) return { error: "captchaFailed" };
    if (error.code === "email_not_confirmed") return { error: "emailNotConfirmed" };
    if (error.status === 429) return { error: "rateLimited" };
    return { error: "invalidCredentials" }; // identical message for unknown user / wrong password
  }
  const next = safeRedirectPath(String(form.get("next") ?? ""), "/dashboard");
  redirect({ href: next, locale });
  return {};
}

export async function signUpAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = await getLocale();
  const supabase = await createClient();
  if (!supabase) return { error: "demoUnavailable" };
  if (!rateLimit(`signup:${await clientIp()}`, 5)) return { error: "rateLimited" };
  const parsed = signUpSchema.safeParse(fd(form));
  if (!parsed.success) return { error: errorKey(parsed.error.issues[0]) };
  const v = parsed.data;
  const cap = captcha(form);
  if ("error" in cap) return { error: cap.error };
  const { error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      captchaToken: cap.captchaToken,
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(`/${locale}/dashboard`)}`,
      data: { display_name: v.displayName, experience_level: v.experience, country: v.country, preferred_locale: locale },
    },
  });
  if (error) {
    if (isCaptchaError(error)) return { error: "captchaFailed" };
    if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") return { error: "rateLimited" };
    // These reveal nothing about other accounts and let the person fix their input.
    if (error.code === "email_address_invalid") return { error: "invalidEmail" };
    if (error.code === "weak_password") return { error: "passwordTooShort" };
  }
  // Any other outcome (including "already registered") looks identical: no account enumeration.
  redirect({ href: `/check-email?email=${encodeURIComponent(v.email)}`, locale });
  return {};
}

export async function requestPasswordResetAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = await getLocale();
  const supabase = await createClient();
  if (!supabase) return { error: "demoUnavailable" };
  if (!rateLimit(`reset:${await clientIp()}`, 5)) return { error: "rateLimited" };
  const parsed = resetRequestSchema.safeParse(fd(form));
  if (!parsed.success) return { error: errorKey(parsed.error.issues[0]) };
  const cap = captcha(form);
  if ("error" in cap) return { error: cap.error };
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    captchaToken: cap.captchaToken,
    redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(`/${locale}/reset-password`)}`,
  });
  if (resetError && isCaptchaError(resetError)) return { error: "captchaFailed" };
  return { ok: true }; // identical outcome whether or not the address exists
}

export async function updatePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = await getLocale();
  const supabase = await createClient();
  if (!supabase) return { error: "demoUnavailable" };
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect({ href: "/login", locale });
  const parsed = newPasswordSchema.safeParse(fd(form));
  if (!parsed.success) return { error: errorKey(parsed.error.issues[0]) };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "generic" };
  return { ok: true };
}

export async function signOutAction() {
  const locale = await getLocale();
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect({ href: "/", locale });
}

export async function updateProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "demoUnavailable" };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "generic" };
  const parsed = profileSchema.safeParse(fd(form));
  if (!parsed.success) return { error: errorKey(parsed.error.issues[0]) };
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName, experience_level: parsed.data.experience ?? null, country: parsed.data.country ?? null, preferred_locale: parsed.data.locale })
    .eq("id", data.user.id);
  return error ? { error: "generic" } : { ok: true };
}
