import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetRateLimit } from "@/lib/rate-limit";

const calls: { fn: string; args: unknown }[] = [];
let dbError: { message: string } | null = null;

const builder = (table: string) => ({
  insert: (row: unknown) => { calls.push({ fn: `${table}.insert`, args: row }); return Object.assign(Promise.resolve({ error: dbError }), { select: () => ({ single: async () => ({ data: { id: "11111111-1111-4111-8111-111111111111" }, error: dbError }) }) }); },
  update: (row: unknown) => { calls.push({ fn: `${table}.update`, args: row }); return { eq: async () => ({ error: dbError }) }; },
  upsert: async (row: unknown) => { calls.push({ fn: `${table}.upsert`, args: row }); return { error: dbError }; },
  delete: () => ({ eq: async () => ({ error: dbError }) }),
});
const client = { from: builder, rpc: async (fn: string, args: unknown) => { calls.push({ fn, args }); return { error: dbError }; } };

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => client }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }) }));
vi.mock("next-intl/server", () => ({ getLocale: async () => "en" }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn() }));

const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.append(k, v); return f; };
const U = "11111111-1111-4111-8111-111111111111";
const V = "22222222-2222-4222-8222-222222222222";

beforeEach(() => { calls.length = 0; dbError = null; _resetRateLimit(); });

describe("admin server actions", () => {
  it("passes workflow calls straight to the database functions (no client-side authority)", async () => {
    const a = await import("@/app/[locale]/admin/actions");
    expect((await a.submitAction({}, fd({ topicId: U }))).ok).toBe(true);
    expect(calls.at(-1)).toEqual({ fn: "submit_for_review", args: { p_topic: U } });
    await a.assignReviewerAction({}, fd({ versionId: V, reviewerId: U, specialty: "PH" }));
    expect(calls.at(-1)).toEqual({ fn: "assign_reviewer", args: { p_version: V, p_reviewer: U, p_specialty: "PH" } });
    await a.recordReviewAction({}, fd({ versionId: V, specialty: "NE", decision: "approve" }));
    expect(calls.at(-1)).toEqual({ fn: "record_review", args: { p_version: V, p_specialty: "NE", p_decision: "approve", p_comments: null } });
    await a.publishAction({}, fd({ topicId: U, versionId: V }));
    expect(calls.at(-1)).toEqual({ fn: "publish_topic", args: { p_topic: U, p_version: V, p_review_months: 12 } });
  });

  it("never sends a review decision that is not one of the three allowed values", async () => {
    const a = await import("@/app/[locale]/admin/actions");
    const r = await a.recordReviewAction({}, fd({ versionId: V, specialty: "NE", decision: "auto_approve" }));
    expect(r.error).toMatch(/Invalid input/);
    expect(calls).toHaveLength(0);
  });

  it("surfaces the database's authorisation errors to the staff user", async () => {
    const a = await import("@/app/[locale]/admin/actions");
    dbError = { message: "publisher access with MFA required" };
    const r = await a.publishAction({}, fd({ topicId: U, versionId: V }));
    expect(r.ok).toBeUndefined();
    expect(r.error).toBe("publisher access with MFA required");
  });

  it("validates identifiers and rejects malformed input before reaching the database", async () => {
    const a = await import("@/app/[locale]/admin/actions");
    expect((await a.submitAction({}, fd({ topicId: "not-a-uuid" }))).error).toMatch(/Invalid input/);
    expect((await a.saveSourceAction({}, fd({ organization: "x", title: "y", url: "http://insecure.example", licenceClass: "GREEN" }))).error).toMatch(/https/);
    expect((await a.uploadImageAction({}, fd({ topicId: "not-a-uuid", licence: "x", licenceClass: "GREEN" }))).error).toMatch(/Invalid input/);
    expect((await a.grantRoleAction({}, fd({ userId: U, role: "learner" }))).error).toMatch(/Invalid input/);
    expect(calls).toHaveLength(0);
  });

  it("builds localized content rows and keeps Arabic optional", async () => {
    const a = await import("@/app/[locale]/admin/actions");
    await a.saveSectionAction({}, fd({ topicId: U, kind: "objectives", sort: "1", titleEn: "Objectives", bodyEn: "- one" }));
    expect(calls.at(-1)).toEqual({ fn: "topic_sections.insert", args: { topic_id: U, kind: "objectives", sort: 1, title: { en: "Objectives" }, body: { en: "- one" } } });
    await a.saveSectionAction({}, fd({ topicId: U, kind: "overview", sort: "2", titleEn: "T", titleAr: "ع", bodyEn: "b", bodyAr: "ب" }));
    expect((calls.at(-1)!.args as { title: unknown }).title).toEqual({ en: "T", ar: "ع" });
  });

  it("cannot grant administrator-only functions with an unknown specialty code", async () => {
    const a = await import("@/app/[locale]/admin/actions");
    expect((await a.setSpecialtyAction({}, fd({ userId: U, specialty: "ROOT" }))).error).toMatch(/Invalid input/);
  });

  it("throttles runaway staff-action clients per IP", async () => {
    const a = await import("@/app/[locale]/admin/actions");
    let blocked = 0;
    for (let i = 0; i < 125; i++) if ((await a.submitAction({}, fd({ topicId: U }))).error?.match(/Too many actions/)) blocked++;
    expect(blocked).toBe(5);
  });
});
