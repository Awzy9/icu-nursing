import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const key = "x".repeat(40);
describe("parseEnv", () => {
  it("runs in demo mode with no Supabase config", () => {
    expect(parseEnv({ NODE_ENV: "development" }).demoMode).toBe(true);
    expect(parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }).demoMode).toBe(true);
  });
  it("is live when both url and key are set", () => {
    const e = parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: key, NEXT_PUBLIC_SITE_URL: "https://x.org" });
    expect(e.demoMode).toBe(false);
  });
  it("rejects a half-configured Supabase setup", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" })).toThrow(/both/i);
    expect(() => parseEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: key })).toThrow(/both/i);
  });
  it("rejects malformed values", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "not-a-url", NEXT_PUBLIC_SUPABASE_ANON_KEY: key })).toThrow();
    expect(() => parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://a.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "short" })).toThrow(/too short/);
  });
  it("requires a site URL in production when Supabase is on", () => {
    expect(() => parseEnv({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://a.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: key })).toThrow(/SITE_URL/);
  });
  it("never exposes a service-role key", () => {
    const e = parseEnv({ "SUPABASE_SERVICE_ROLE_KEY": "secret" } as never) as Record<string, unknown>;
    expect(JSON.stringify(e)).not.toContain("secret");
  });
});
