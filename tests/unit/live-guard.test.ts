import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEV_REF } from "../../scripts/live/target";

import { assertIsolatedApi, assertIsolatedDb, assertTestCaptchaSecret } from "../../scripts/live/target";

describe("live-test guard for the real CAPTCHA secret", () => {
  const KEYS = ["LIVE_TARGET", "LIVE_SUPABASE_URL", "LIVE_DB_URL"];
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => { for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; } vi.resetModules(); });
  afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } vi.resetModules(); });
  it("refuses to weaken CAPTCHA (test key or off) on the approved dev project", async () => {
    const { refuseCaptchaWeakeningOnDev } = await import("../../scripts/live/mgmt");
    expect(() => refuseCaptchaWeakeningOnDev(DEV_REF)).toThrow(/real Turnstile secret/);
  });
  it("allows an isolated project reference", async () => {
    const { refuseCaptchaWeakeningOnDev } = await import("../../scripts/live/mgmt");
    expect(() => refuseCaptchaWeakeningOnDev("isolatedtestprojectref")).not.toThrow();
  });
});

describe("isolated-target allow-list (Cloudflare test keys may only touch the local CI stack)", () => {
  it("accepts only the explicit loopback API origins", () => {
    expect(assertIsolatedApi("http://127.0.0.1:54321")).toBe("http://127.0.0.1:54321");
    expect(assertIsolatedApi("http://localhost:54321/auth/v1")).toBe("http://localhost:54321");
  });
  it("rejects hosted projects, including the approved dev project, and other loopback ports", () => {
    for (const u of [`https://${DEV_REF}.supabase.co`, "https://abcdefghijklmnop.supabase.co", "http://127.0.0.1:54399", "http://evil.example", "https://127.0.0.1:54321", "", undefined])
      expect(() => assertIsolatedApi(u as string | undefined), String(u)).toThrow(/not an allow-listed isolated target/);
  });
  it("accepts only the local database URL", () => {
    expect(() => assertIsolatedDb("postgresql://postgres:postgres@127.0.0.1:54322/postgres")).not.toThrow();
    expect(() => assertIsolatedDb("postgresql://postgres:secret@db.abcdefghijklmnop.supabase.co:5432/postgres")).toThrow(/allow-list/);
  });
  it("accepts only Cloudflare's public test secrets", () => {
    for (const s of ["1x0000000000000000000000000000000AA", "2x0000000000000000000000000000000AA"]) expect(() => assertTestCaptchaSecret(s)).not.toThrow();
    for (const s of ["0x4AAAAAAAreal-looking-secret", "", "1x0000000000000000000000000000000AB"]) expect(() => assertTestCaptchaSecret(s)).toThrow(/public TEST secrets/);
  });
  describe("module-level target selection (independent of the environment this test runs in)", () => {
    const KEYS = ["LIVE_TARGET", "LIVE_SUPABASE_URL", "LIVE_DB_URL", "LIVE_ANON_KEY"];
    const saved: Record<string, string | undefined> = {};
    beforeEach(() => { for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; } vi.resetModules(); });
    afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } vi.resetModules(); });

    it("default target is the hosted dev project: test-key operations are refused and the dev CAPTCHA guard fires", async () => {
      const t = await import("../../scripts/live/target");
      const m = await import("../../scripts/live/mgmt");
      expect(t.ISOLATED).toBe(false);
      expect(() => t.requireIsolated("send the test token")).toThrow(/never against a hosted project/);
      expect(m.REF).toBe(m.DEV_REF);
      expect(() => m.refuseCaptchaWeakeningOnDev()).toThrow(/real Turnstile secret/);
    });
    it("LIVE_TARGET=isolated with the loopback stack is accepted and is NOT the dev project", async () => {
      process.env.LIVE_TARGET = "isolated";
      process.env.LIVE_SUPABASE_URL = "http://127.0.0.1:54321";
      process.env.LIVE_DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
      const t = await import("../../scripts/live/target");
      const m = await import("../../scripts/live/mgmt");
      expect(() => t.requireIsolated("send the test token")).not.toThrow();
      expect(m.REF).not.toBe(m.DEV_REF);
      expect(m.PROJECT_URL).toBe("http://127.0.0.1:54321");
      expect(() => m.refuseCaptchaWeakeningOnDev(m.DEV_REF)).toThrow(/real Turnstile secret/); // still refuses the dev ref explicitly
    });
    it("LIVE_TARGET=isolated pointed at a hosted project (including dev) fails at import time", async () => {
      process.env.LIVE_TARGET = "isolated";
      process.env.LIVE_SUPABASE_URL = `https://${DEV_REF}.supabase.co`;
      process.env.LIVE_DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
      await expect(import("../../scripts/live/mgmt")).rejects.toThrow(/not an allow-listed isolated target/);
    });
  });
});
