import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => undefined }) }));
vi.mock("@/lib/auth", () => ({ getSessionUser: async () => null }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => null }));

async function modeWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const k of ["QUESTION_BANK_MODE", "NEXT_PUBLIC_APP_ENV", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]) delete process.env[k];
  for (const [k, v] of Object.entries(env)) if (v !== undefined) process.env[k] = v;
  const m = await import("@/lib/question-bank");
  return m.resolveMode();
}
afterEach(() => { for (const k of ["QUESTION_BANK_MODE", "NEXT_PUBLIC_APP_ENV", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]) delete process.env[k]; });

const SB = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(40) };

describe("question bank mode resolution (content gate at the application layer)", () => {
  it("uses synthetic fixtures in demo mode", async () => expect(await modeWith({})).toBe("fixtures"));
  it("uses the database when Supabase is configured", async () => expect(await modeWith(SB)).toBe("database"));
  it("allows an explicit fixture mode for development against Supabase", async () => expect(await modeWith({ ...SB, QUESTION_BANK_MODE: "fixtures" })).toBe("fixtures"));
  it("REFUSES fixtures in a production deployment, even when requested explicitly", async () => {
    expect(await modeWith({ NEXT_PUBLIC_APP_ENV: "production" })).toBe("disabled");
    expect(await modeWith({ ...SB, NEXT_PUBLIC_APP_ENV: "production", QUESTION_BANK_MODE: "fixtures" })).toBe("disabled");
  });
  it("is disabled when the database mode is requested without a database", async () => expect(await modeWith({ QUESTION_BANK_MODE: "database" })).toBe("disabled"));
  it("ignores unknown mode values", async () => expect(await modeWith({ ...SB, QUESTION_BANK_MODE: "everything" })).toBe("database"));
});
