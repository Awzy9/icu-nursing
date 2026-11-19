import { describe, expect, it } from "vitest";
import { createChunkedStorage, CHUNK_SIZE, type SecureValueStore } from "../../mobile/src/auth/chunkedStorage";
import { readAuthConfig } from "../../mobile/src/auth/config";
import { allowCaptchaNavigation, captchaUrl, parseCaptchaMessage } from "../../mobile/src/auth/captcha";
import { parseAuthCallback } from "../../mobile/src/auth/deepLinks";
import { createSessionManager, mapSignInError } from "../../mobile/src/auth/session";
import { createRpc, RpcError } from "../../mobile/src/api/rpc";
import type { SupabaseClient } from "@supabase/supabase-js";

const SITE = "https://example-staging.test";
/** A secure store that, like the real ones, refuses large values. */
const limited = (max = 2048): SecureValueStore & { data: Map<string, string> } => { const data = new Map<string, string>(); return { data, get: async (k) => data.get(k) ?? null, set: async (k, v) => { if (v.length > max) throw new Error("value too large for secure storage"); if (!/^[A-Za-z0-9._-]+$/.test(k)) throw new Error("bad key"); data.set(k, v); }, remove: async (k) => void data.delete(k) }; };
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (claims: object) => `${b64({ alg: "HS256" })}.${b64(claims)}.sig`;

describe("secure session storage (chunked)", () => {
  it("round-trips a session larger than the secure-store limit, using only valid key characters", async () => {
    const raw = limited(); const s = createChunkedStorage(raw);
    const session = JSON.stringify({ access_token: "a".repeat(2500), refresh_token: "r".repeat(40), user: { email: "x@y.test", meta: "m".repeat(2000) } });
    await s.setItem("sb-abc-auth-token", session);
    expect(await s.getItem("sb-abc-auth-token")).toBe(session);
    expect(raw.data.size).toBeGreaterThan(2);
    for (const v of raw.data.values()) expect(v.length).toBeLessThanOrEqual(2048);
  });
  it("shrinking and removing leave no stale chunks; a torn write reads as no session", async () => {
    const raw = limited(); const s = createChunkedStorage(raw, 100);
    await s.setItem("k", "x".repeat(950)); const big = raw.data.size;
    await s.setItem("k", "y".repeat(120)); expect(raw.data.size).toBeLessThan(big); expect(await s.getItem("k")).toBe("y".repeat(120));
    raw.data.delete("k.1"); expect(await s.getItem("k")).toBeNull();
    await s.setItem("k", "z".repeat(500)); await s.removeItem("k"); expect(raw.data.size).toBe(0); expect(await s.getItem("k")).toBeNull();
    expect(CHUNK_SIZE).toBeLessThanOrEqual(2000);
  });
});

describe("configuration", () => {
  const ok = { EXPO_PUBLIC_SUPABASE_URL: "https://abc.supabase.co", EXPO_PUBLIC_SUPABASE_ANON_KEY: jwt({ role: "anon" }) + "x".repeat(20), EXPO_PUBLIC_SITE_URL: SITE };
  it("accepts public https configuration, allows local development addresses, and runs offline when unset", () => {
    expect(readAuthConfig(ok)?.siteOrigin).toBe(SITE);
    expect(readAuthConfig({ ...ok, EXPO_PUBLIC_SUPABASE_URL: "http://10.0.2.2:54321", EXPO_PUBLIC_SITE_URL: "http://10.0.2.2:3100" })).not.toBeNull();
    expect(readAuthConfig({})).toBeNull();
  });
  it("refuses plain http to a real host and any service-role key", () => {
    expect(readAuthConfig({ ...ok, EXPO_PUBLIC_SUPABASE_URL: "http://abc.supabase.co" })).toBeNull();
    expect(readAuthConfig({ ...ok, EXPO_PUBLIC_SUPABASE_ANON_KEY: jwt({ role: "service_role" }) + "x".repeat(20) })).toBeNull();
    expect(readAuthConfig({ ...ok, EXPO_PUBLIC_SUPABASE_ANON_KEY: "my-service_role-key-0123456789abcdef" })).toBeNull();
  });
});

describe("CAPTCHA bridge", () => {
  const good = JSON.stringify({ type: "icu.turnstile", v: 1, token: "0.AbCdEf_ghij-KLMNOP" });
  it("accepts the exact message from the site's own origin only", () => {
    expect(parseCaptchaMessage(good, `${SITE}/en/mobile-captcha`, SITE)).toEqual({ token: "0.AbCdEf_ghij-KLMNOP" });
    expect(parseCaptchaMessage(good, "https://evil.test/en/mobile-captcha", SITE)).toEqual({ error: "origin" });
    expect(parseCaptchaMessage(good, "not a url", SITE)).toEqual({ error: "origin" });
    expect(parseCaptchaMessage("{bad", `${SITE}/x`, SITE)).toEqual({ error: "shape" });
    expect(parseCaptchaMessage(JSON.stringify({ type: "other", v: 1, token: "abcdefghijk" }), `${SITE}/x`, SITE)).toEqual({ error: "shape" });
    expect(parseCaptchaMessage(JSON.stringify({ type: "icu.turnstile", v: 2, token: "abcdefghijk" }), `${SITE}/x`, SITE)).toEqual({ error: "shape" });
    expect(parseCaptchaMessage(JSON.stringify({ type: "icu.turnstile", v: 1, token: "<script>alert(1)</script>" }), `${SITE}/x`, SITE)).toEqual({ error: "token" });
    expect(parseCaptchaMessage(JSON.stringify({ type: "icu.turnstile", v: 1, token: "a" }), `${SITE}/x`, SITE)).toEqual({ error: "token" });
  });
  it("limits WebView navigation to the captcha page and Cloudflare's challenge origin", () => {
    expect(captchaUrl(SITE, "ar")).toBe(`${SITE}/ar/mobile-captcha`);
    expect(allowCaptchaNavigation(`${SITE}/en/mobile-captcha`, SITE)).toBe(true);
    expect(allowCaptchaNavigation("https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b", SITE)).toBe(true);
    for (const bad of [`${SITE}/en/dashboard`, `${SITE}/en/skills`, "https://evil.test/en/mobile-captcha", "javascript:alert(1)", "file:///etc/passwd", "intent://x#Intent;end"]) expect(allowCaptchaNavigation(bad, SITE), bad).toBe(false);
    expect(allowCaptchaNavigation("about:blank", SITE)).toBe(true);
  });
});

describe("authentication callbacks (deep links)", () => {
  it("accepts only the two exact callback shapes", () => {
    expect(parseAuthCallback("nursingmastery://auth/callback?code=abcDEF123456&type=recovery", SITE)).toEqual({ ok: true, intent: { kind: "recovery", code: "abcDEF123456" } });
    expect(parseAuthCallback(`${SITE}/auth/callback?code=abcDEF123456`, SITE)).toEqual({ ok: true, intent: { kind: "magiclink", code: "abcDEF123456" } });
  });
  it("refuses other schemes, hosts, paths and malformed or hostile parameters", () => {
    const cases: [string, string][] = [
      ["javascript:alert(1)", "scheme"], ["file:///etc/passwd", "scheme"], ["not a url", "scheme"], ["http://example-staging.test/auth/callback?code=abcDEF123456", "scheme"],
      ["https://evil.test/auth/callback?code=abcDEF123456", "host"], [`${SITE}.evil.test/auth/callback?code=abcDEF123456`, "host"],
      [`${SITE}/auth/other?code=abcDEF123456`, "path"], ["nursingmastery://evil/callback?code=abcDEF123456", "path"], ["nursingmastery://auth/callback/../x?code=abcDEF123456", "path"],
      ["nursingmastery://auth/callback", "params"], ["nursingmastery://auth/callback?code=short", "params"], ["nursingmastery://auth/callback?code=abcDEF123456&type=admin", "params"], ["nursingmastery://auth/callback?code=<script>alert(1)</script>", "params"],
    ];
    for (const [url, why] of cases) expect(parseAuthCallback(url, SITE), url).toEqual({ ok: false, reason: why });
  });
});

describe("session lifecycle", () => {
  it("maps sign-in failures to translated categories without leaking raw text", () => {
    expect(mapSignInError({ code: "captcha_failed", message: "captcha verification process failed" })).toBe("captcha");
    expect(mapSignInError({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe("invalid");
    expect(mapSignInError({ code: "email_not_confirmed" })).toBe("unconfirmed");
    expect(mapSignInError({ status: 429, message: "x" })).toBe("rate"); expect(mapSignInError({ message: "Failed to fetch" })).toBe("network"); expect(mapSignInError(null)).toBe("generic");
  });
  const fakeClient = (state: { session: { access_token: string; expires_at: number } | null; refreshed: number; error?: { code: string; message: string } | null; rpc?: { error: { code: string; message: string } | null } }) => ({
    auth: {
      getSession: async () => ({ data: { session: state.session } }),
      refreshSession: async () => { state.refreshed++; return { error: state.error ?? null }; },
      signOut: async () => { state.session = null; return { error: null }; },
      signInWithPassword: async () => ({ error: state.error ?? null }),
    },
    rpc: async () => state.rpc ?? { data: { deleted: true }, error: null },
  }) as unknown as SupabaseClient;
  it("validates input before any network call, refreshes only near expiry, and wipes a revoked session", async () => {
    const st = { session: { access_token: jwt({}), expires_at: 10_000 }, refreshed: 0 as number };
    const m = createSessionManager(fakeClient(st as never), { now: () => 1000 });
    expect(await m.signIn("not-an-email", "pw", "tok")).toEqual({ ok: false, error: "input" });
    expect(await m.signIn("a@b.test", "pw", "")).toEqual({ ok: false, error: "input" });
    await m.onForeground(); expect(st.refreshed).toBe(0);
    const near = createSessionManager(fakeClient({ ...st, session: { access_token: jwt({}), expires_at: 1050 } } as never), { now: () => 1000 }); await near.onForeground();
    const revoked = { session: { access_token: jwt({}), expires_at: 1050 } as { access_token: string; expires_at: number } | null, refreshed: 0, error: { code: "refresh_token_not_found", message: "Invalid Refresh Token" } };
    await createSessionManager(fakeClient(revoked as never), { now: () => 1000 }).onForeground();
    expect(revoked.refreshed).toBe(1); expect(revoked.session).toBeNull();
  });
  it("knows whether the sign-in is recent (from the verified amr claim) and maps deletion refusals", async () => {
    const now = 1_800_000_000;
    const recent = createSessionManager(fakeClient({ session: { access_token: jwt({ amr: [{ method: "password", timestamp: now - 20 }] }), expires_at: now + 3000 }, refreshed: 0 }), { now: () => now });
    expect(await recent.recentlyAuthenticated()).toBe(true);
    const stale = createSessionManager(fakeClient({ session: { access_token: jwt({ amr: [{ method: "password", timestamp: now - 4000 }] }), expires_at: now + 3000 }, refreshed: 0 }), { now: () => now });
    expect(await stale.recentlyAuthenticated()).toBe(false);
    for (const [code, message, want] of [["28000", "recent sign-in required", "recent"], ["28000", "second-factor verification required", "secondFactor"], ["22023", "confirmation does not match", "mismatch"], ["55000", "staff accounts are removed by an administrator", "staff"]] as const)
      expect(await createSessionManager(fakeClient({ session: null, refreshed: 0, rpc: { error: { code, message } } })).deleteAccount("a@b.test")).toEqual({ ok: false, error: want });
    const done = { session: { access_token: jwt({}), expires_at: 1 } as never, refreshed: 0 }; expect(await createSessionManager(fakeClient(done)).deleteAccount("a@b.test")).toEqual({ ok: true }); expect(done.session).toBeNull();
  });
});

describe("validated RPC contracts", () => {
  const client = (data: unknown, error: { code: string; message: string } | null = null) => ({ rpc: async () => ({ data, error }) }) as unknown as SupabaseClient;
  it("parses responses with the shared schemas and rejects drift", async () => {
    expect(await createRpc(client({ fixtures: true, bookmarks: ["SYN-EQ-001"], viewed: { "SYN-EQ-001": ["sensor"] } })).equipmentState()).toEqual({ fixtures: true, bookmarks: ["SYN-EQ-001"], viewed: { "SYN-EQ-001": ["sensor"] } });
    await expect(createRpc(client({ fixtures: "yes" })).equipmentState()).rejects.toMatchObject({ code: "contract" });
    await expect(createRpc(client([{ nonsense: 1 }])).caseList()).rejects.toMatchObject({ code: "contract" });
    await expect(createRpc(client(null, { code: "42501", message: "sign in required" })).equipmentState()).rejects.toMatchObject({ code: "auth" });
    await expect(createRpc(client(null, { code: "P0002", message: "module not found" })).equipmentState()).rejects.toBeInstanceOf(RpcError);
  });
  it("exposes no staff function", () => { expect(Object.keys(createRpc(client(null))).some((k) => /adm|admin|staff|draft/i.test(k))).toBe(false); });
});
