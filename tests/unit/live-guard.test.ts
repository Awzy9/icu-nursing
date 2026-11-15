import { describe, expect, it } from "vitest";
import { DEV_REF, refuseCaptchaWeakeningOnDev } from "../../scripts/live/mgmt";

describe("live-test guard for the real CAPTCHA secret", () => {
  it("refuses to weaken CAPTCHA (test key or off) on the approved dev project", () => {
    expect(() => refuseCaptchaWeakeningOnDev(DEV_REF)).toThrow(/real Turnstile secret/);
  });
  it("allows an isolated project reference", () => {
    expect(() => refuseCaptchaWeakeningOnDev("isolatedtestprojectref")).not.toThrow();
  });
});

import { assertIsolatedApi, assertIsolatedDb, assertTestCaptchaSecret, requireIsolated } from "../../scripts/live/target";

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
  it("test-key operations refuse to run outside LIVE_TARGET=isolated (the default targets the hosted dev project)", () => {
    expect(() => requireIsolated("send the test token")).toThrow(/never against a hosted project/);
  });
  it("the dev project can never be the isolated target, and its CAPTCHA guard still fires", () => {
    expect(() => refuseCaptchaWeakeningOnDev()).toThrow(/real Turnstile secret/);
  });
});
