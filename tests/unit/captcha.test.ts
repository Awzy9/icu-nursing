import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCsp } from "@/lib/csp";
import { parseEnv } from "@/lib/env";

describe("CAPTCHA configuration", () => {
  const base = { NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "x".repeat(40), NEXT_PUBLIC_SITE_URL: "https://x.org" };
  it("is off without a site key and in demo mode, on with both Supabase and a site key", () => {
    expect(parseEnv({ ...base }).captchaEnabled).toBe(false);
    expect(parseEnv({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" }).captchaEnabled).toBe(false); // demo mode has no accounts
    expect(parseEnv({ ...base, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" }).captchaEnabled).toBe(true);
    expect(parseEnv({ ...base, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "" }).captchaEnabled).toBe(false);
  });
  it("rejects a malformed site key", () => {
    expect(() => parseEnv({ ...base, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "has spaces!" })).toThrow(/Turnstile/);
  });
  it("opens the CSP to Turnstile's iframe only when CAPTCHA is on", () => {
    expect(buildCsp({ nonce: "n" })).not.toContain("challenges.cloudflare.com");
    const csp = buildCsp({ nonce: "n", captcha: true });
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(csp.split("; ").find((d) => d.startsWith("script-src"))).not.toContain("cloudflare"); // script comes through strict-dynamic, not a host allow-list
  });
});

const calls: { fn: string; args: unknown[] }[] = [];
let authError: { code?: string; status?: number; message: string } | null = null;
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: async (...a: unknown[]) => { calls.push({ fn: "signIn", args: a }); return { error: authError }; },
      signUp: async (...a: unknown[]) => { calls.push({ fn: "signUp", args: a }); return { error: authError }; },
      resetPasswordForEmail: async (...a: unknown[]) => { calls.push({ fn: "reset", args: a }); return { error: authError }; },
    },
  }),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "198.51.100.7" }) }));
vi.mock("next-intl/server", () => ({ getLocale: async () => "en" }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn() }));

const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.append(k, v); return f; };

describe("auth server actions with CAPTCHA enabled", () => {
  beforeEach(async () => {
    calls.length = 0; authError = null;
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "x".repeat(40));
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    const { _resetRateLimit } = await import("@/lib/rate-limit");
    _resetRateLimit();
  });

  it("refuses to contact Supabase without a CAPTCHA token (sign-in, sign-up, reset)", async () => {
    const a = await import("@/app/[locale]/(auth)/actions");
    expect((await a.signInAction({}, fd({ email: "a@b.co", password: "x" }))).error).toBe("captchaRequired");
    expect((await a.signUpAction({}, fd({ email: "a@b.co", password: "correct-horse-battery", confirmPassword: "correct-horse-battery", displayName: "A" }))).error).toBe("captchaRequired");
    expect((await a.requestPasswordResetAction({}, fd({ email: "a@b.co" }))).error).toBe("captchaRequired");
    expect(calls).toHaveLength(0);
  });
  it("forwards the token to Supabase Auth, which verifies it with the secret it holds", async () => {
    const a = await import("@/app/[locale]/(auth)/actions");
    await a.signInAction({}, fd({ email: "a@b.co", password: "x", captchaToken: "tok-1" }));
    expect(calls[0]).toMatchObject({ fn: "signIn", args: [{ email: "a@b.co", password: "x", options: { captchaToken: "tok-1" } }] });
    await a.requestPasswordResetAction({}, fd({ email: "a@b.co", captchaToken: "tok-2" }));
    expect((calls[1]!.args[1] as { captchaToken: string }).captchaToken).toBe("tok-2");
    await a.signUpAction({}, fd({ email: "a@b.co", password: "correct-horse-battery", confirmPassword: "correct-horse-battery", displayName: "A", captchaToken: "tok-3" }));
    expect((calls[2]!.args[0] as { options: { captchaToken: string } }).options.captchaToken).toBe("tok-3");
  });
  it("shows a clear message when Supabase rejects the CAPTCHA", async () => {
    const a = await import("@/app/[locale]/(auth)/actions");
    authError = { code: "captcha_failed", status: 400, message: "captcha verification process failed" };
    expect((await a.signInAction({}, fd({ email: "a@b.co", password: "x", captchaToken: "bad" }))).error).toBe("captchaFailed");
    expect((await a.requestPasswordResetAction({}, fd({ email: "a@b.co", captchaToken: "bad" }))).error).toBe("captchaFailed");
  });
  it("rejects absurdly large tokens", async () => {
    const a = await import("@/app/[locale]/(auth)/actions");
    expect((await a.signInAction({}, fd({ email: "a@b.co", password: "x", captchaToken: "x".repeat(5000) }))).error).toBe("captchaRequired");
  });
});
