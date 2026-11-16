import { afterEach, describe, expect, it, vi } from "vitest";
import { detectRefusal } from "@/lib/tutor/refusal";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => undefined }) }));
vi.mock("@/lib/auth", () => ({ getSessionUser: async () => null }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => null }));

describe("tutor refusal detection", () => {
  it("lets ordinary educational questions through", () => {
    expect(detectRefusal("what are the indications for an arterial line?")).toBeUndefined();
    expect(detectRefusal("how does NEWS2 work?")).toBeUndefined();
    expect(detectRefusal("what are the signs of sepsis?")).toBeUndefined();
  });
  it("refuses a patient-specific question", () => {
    expect(detectRefusal("my patient is hypotensive, what should I do")).toBe("patient_specific");
    expect(detectRefusal("should I give more fluids to this patient")).toBe("patient_specific");
    expect(detectRefusal("can I give lorazepam now")).toBe("patient_specific");
  });
  it("refuses a dosing request", () => {
    expect(detectRefusal("what dose of norepinephrine should I use")).toBe("dosing");
    expect(detectRefusal("how much propofol in mg/kg/hr")).toBe("dosing");
  });
  it("refuses diagnosis/prescription requests", () => {
    expect(detectRefusal("can you diagnose my symptoms")).toBe("out_of_scope");
    expect(detectRefusal("please write me a prescription")).toBe("out_of_scope");
  });
  it("refuses a too-short query", () => {
    expect(detectRefusal("x")).toBe("too_short");
    expect(detectRefusal("")).toBe("too_short");
  });
});

describe("askTutor (demo mode, no live database)", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

  it("retrieves only already-published/synthetic content and never touches drafts", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const { askTutor } = await import("@/lib/tutor");
    const r = await askTutor("oxygen", "en");
    expect(r.refused).toBe(false);
    expect(r.hits.every((h) => typeof h.href === "string" && !h.href.includes("/drafts/"))).toBe(true);
  });

  it("refuses a patient-specific question before any retrieval, logging no citations", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const { askTutor } = await import("@/lib/tutor");
    const r = await askTutor("my patient needs a dose, what should I give them", "en");
    expect(r.refused).toBe(true);
    expect(r.refusalKind).toBe("patient_specific");
    expect(r.hits).toEqual([]);
  });

  it("returns no citations, not a fabricated answer, for a query with no match", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const { askTutor } = await import("@/lib/tutor");
    const r = await askTutor("zzzznonexistentquerytermzzzz", "en");
    expect(r.refused).toBe(false);
    expect(r.hits).toEqual([]);
  });
});
