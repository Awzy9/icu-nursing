import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetRateLimit, rateLimit } from "@/lib/rate-limit";
import { errorKey, newPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation";

describe("rateLimit", () => {
  beforeEach(_resetRateLimit);
  it("allows up to the limit then blocks, then recovers", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, 0)).toBe(true);
    expect(rateLimit("k", 3, 1000, 10)).toBe(false);
    expect(rateLimit("other", 3, 1000, 10)).toBe(true);
    expect(rateLimit("k", 3, 1000, 2000)).toBe(true);
  });
});

describe("sign-up validation", () => {
  const ok = { email: " Nurse@Example.COM ", password: "correct-horse-battery", confirmPassword: "correct-horse-battery", displayName: " Sam " };
  it("normalises email and display name", () => {
    const r = signUpSchema.parse(ok);
    expect(r.email).toBe("nurse@example.com");
    expect(r.displayName).toBe("Sam");
  });
  it("rejects short passwords, mismatches, bad emails and empty names", () => {
    expect(errorKey(signUpSchema.safeParse({ ...ok, password: "short", confirmPassword: "short" }).error?.issues[0])).toBe("passwordTooShort");
    expect(errorKey(signUpSchema.safeParse({ ...ok, confirmPassword: "different-different" }).error?.issues[0])).toBe("passwordsMismatch");
    expect(errorKey(signUpSchema.safeParse({ ...ok, email: "nope" }).error?.issues[0])).toBe("invalidEmail");
    expect(errorKey(signUpSchema.safeParse({ ...ok, displayName: "  " }).error?.issues[0])).toBe("nameRequired");
  });
  it("accepts only two-letter country codes and known levels", () => {
    expect(signUpSchema.safeParse({ ...ok, country: "sa" }).data?.country).toBe("SA");
    expect(signUpSchema.safeParse({ ...ok, country: "Saudi" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...ok, experience: "guru" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...ok, country: "" }).success).toBe(true);
  });
  it("sign-in and new-password schemas validate", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "a-very-long-password", confirmPassword: "a-very-long-password" }).success).toBe(true);
  });
});

describe("auth callback route", () => {
  it("never redirects to an external site", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({ auth: { exchangeCodeForSession: async () => ({ error: null }), verifyOtp: async () => ({ error: null }) } }),
    }));
    const { GET } = await import("@/app/auth/callback/route");
    const mk = (qs: string) => GET(new Request(`https://app.example.org/auth/callback?${qs}`) as never);
    const good = await mk("code=abc&next=/ar/dashboard");
    expect(good.headers.get("location")).toBe("https://app.example.org/ar/dashboard");
    const evil = await mk("code=abc&next=https://evil.example/phish");
    expect(evil.headers.get("location")).toBe("https://app.example.org/en/dashboard");
    const evil2 = await mk("code=abc&next=//evil.example");
    expect(evil2.headers.get("location")).toBe("https://app.example.org/en/dashboard");
    vi.doUnmock("@/lib/supabase/server");
  });
  it("sends failed exchanges to the login page", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: async () => ({ error: new Error("bad") }) } }) }));
    const { GET } = await import("@/app/auth/callback/route");
    const res = await GET(new Request("https://app.example.org/auth/callback?code=bad&next=/ar/dashboard") as never);
    expect(res.headers.get("location")).toBe("https://app.example.org/ar/login");
  });
});
