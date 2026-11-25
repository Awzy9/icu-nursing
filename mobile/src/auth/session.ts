import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { isRecentlyAuthenticated, mapDeletionError, type DeletionError } from "@icu/schemas/account-deletion";

export type SignInError = "invalid" | "captcha" | "rate" | "network" | "unconfirmed" | "weak" | "generic";
export function mapSignInError(e: { code?: string; message?: string; status?: number } | null | undefined): SignInError {
  const m = `${e?.code ?? ""} ${e?.message ?? ""}`.toLowerCase();
  if (/captcha/.test(m)) return "captcha";
  if (/weak_password|password.*weak|password.*short/.test(m)) return "weak";
  if (/invalid[_ ]login|invalid credentials|invalid_credentials/.test(m)) return "invalid";
  if (/email[_ ]not[_ ]confirmed/.test(m)) return "unconfirmed";
  if (e?.status === 429 || /rate|too many|over_.*_rate_limit/.test(m)) return "rate";
  if (/fetch|network|timeout/.test(m)) return "network";
  return "generic";
}
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export interface SessionManager {
  signIn(email: string, password: string, captchaToken?: string): Promise<{ ok: true } | { ok: false; error: SignInError | "input" }>;
  signUp(input: { email: string; password: string; displayName: string; locale: "en" | "ar"; captchaToken?: string; redirectTo: string }): Promise<{ ok: true; confirmationRequired: boolean } | { ok: false; error: SignInError | "input" }>;
  updatePassword(password: string): Promise<{ ok: true } | { ok: false; error: SignInError | "input" }>;
  requestPasswordReset(email: string, captchaToken: string | undefined, redirectTo: string): Promise<{ ok: boolean }>;
  exchangeCallback(code: string): Promise<{ ok: boolean }>;
  current(): Promise<Session | null>;
  /** Call when the app returns to the foreground; refreshes a session that is close to expiry. */
  onForeground(): Promise<void>;
  signOut(): Promise<void>;
  recentlyAuthenticated(): Promise<boolean>;
  deleteAccount(email: string): Promise<{ ok: true } | { ok: false; error: DeletionError }>;
}

export function createSessionManager(client: SupabaseClient, opts: { now?: () => number; refreshMarginSeconds?: number; captchaRequired?: boolean; callbackScheme?: string } = {}): SessionManager {
  const now = opts.now ?? (() => Math.floor(Date.now() / 1000));
  const margin = opts.refreshMarginSeconds ?? 120;
  const captchaRequired = opts.captchaRequired ?? true;
  const callbackScheme = opts.callbackScheme ?? "nursingmastery";
  const validRedirect = (value: string) => { try { const u = new URL(value); return u.protocol === `${callbackScheme}:` && u.hostname === "auth" && u.pathname === "/callback" && !u.username && !u.password && !u.port && !u.hash; } catch { return false; } };
  const claimsOf = (s: Session | null): { amr?: unknown } | null => { if (!s) return null; try { const b = s.access_token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"); return JSON.parse(globalThis.atob(b)) as { amr?: unknown }; } catch { return null; } };
  async function wipeLocal() { await client.auth.signOut({ scope: "local" }).catch(() => undefined); }
  return {
    async signIn(email, password, captchaToken) {
      if (!EMAIL.test(email.trim()) || password.length < 1 || password.length > 256 || (captchaRequired && !captchaToken)) return { ok: false, error: "input" };
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password, ...(captchaToken ? { options: { captchaToken } } : {}) });
      return error ? { ok: false, error: mapSignInError(error) } : { ok: true };
    },
    async signUp(input) {
      const { email, password, displayName, locale, captchaToken, redirectTo } = input;
      if (!EMAIL.test(email.trim()) || password.length < 12 || password.length > 128 || !displayName.trim() || displayName.trim().length > 80 || (captchaRequired && !captchaToken) || !validRedirect(redirectTo)) return { ok: false, error: "input" };
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          ...(captchaToken ? { captchaToken } : {}),
          emailRedirectTo: redirectTo,
          data: { display_name: displayName.trim(), preferred_locale: locale },
        },
      });
      if (error) return { ok: false, error: mapSignInError(error) };
      return { ok: true, confirmationRequired: !data.session };
    },
    async updatePassword(password) {
      if (password.length < 12 || password.length > 128) return { ok: false, error: "input" };
      const { error } = await client.auth.updateUser({ password });
      return error ? { ok: false, error: mapSignInError(error) } : { ok: true };
    },
    async requestPasswordReset(email, captchaToken, redirectTo) {
      if (!EMAIL.test(email.trim()) || (captchaRequired && !captchaToken) || !validRedirect(redirectTo)) return { ok: false };
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { ...(captchaToken ? { captchaToken } : {}), redirectTo });
      return { ok: !error }; // the result never reveals whether the address exists
    },
    async exchangeCallback(code) { const { error } = await client.auth.exchangeCodeForSession(code); return { ok: !error }; },
    async current() { const { data } = await client.auth.getSession(); return data.session; },
    async onForeground() {
      const { data } = await client.auth.getSession();
      if (data.session?.expires_at && data.session.expires_at - now() < margin) {
        const { error } = await client.auth.refreshSession();
        if (error && /refresh_token|invalid|not found|revoked/i.test(`${error.code} ${error.message}`)) await wipeLocal(); // a revoked session ends here, no zombie state
      }
    },
    async signOut() { await client.auth.signOut({ scope: "global" }).catch(() => undefined); await wipeLocal(); },
    async recentlyAuthenticated() { return isRecentlyAuthenticated(claimsOf(await this.current())?.amr, now()); },
    async deleteAccount(email) {
      const { error } = await client.rpc("delete_my_account", { p_email: email.trim() });
      if (error) return { ok: false, error: mapDeletionError(error) };
      await wipeLocal(); // the account and every session are gone on the server; clear the device too
      return { ok: true };
    },
  };
}
