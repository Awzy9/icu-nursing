/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, grantRole, owner, setupDb, uniqueEmail } from "./helpers";

let author: string, reviewer: string, learner: string, admin: string;
const A = (id: string) => ({ id, aal: "aal2" as const });
const call = async (id: string | null, sql: string, p: unknown[] = []) => (await asUser(id ? A(id) : null, sql, p)).rows[0] as Record<string, any>;
const GOOD = { tool: "ChatGPT (GPT-5.1), web browsing enabled, 2026-11-16", sources: ["KDIGO 2012 AKI guideline, section 3"], currency: "current", discrepancies: false, summary: "The draft's wording matches the cited recommendation; no change needed.", recommendation: "no_action" };
const set = (id: string | null, key: string, o: typeof GOOD = GOOD) =>
  call(id, "select public.adm_ai_evidence_set($1,$2,$3,$4,$5,$6,$7) as r", [key, o.tool, o.sources, o.currency, o.discrepancies, o.summary, o.recommendation]);
const list = async (id: string, key: string) => (await call(id, "select public.adm_ai_evidence_list($1) as l", [key])).l as any[];

beforeAll(async () => {
  await setupDb();
  author = await createUser(uniqueEmail("author")); await grantRole(author, "author");
  reviewer = await createUser(uniqueEmail("reviewer")); await grantRole(reviewer, "clinical_reviewer");
  admin = await createUser(uniqueEmail("admin")); await grantRole(admin, "admin");
  learner = await createUser(uniqueEmail("learner"));
});
afterAll(closePool);

describe("AI evidence review: authorization", () => {
  it("refuses learners and anonymous callers everywhere, and everyone any direct table access", async () => {
    for (const who of [learner, null]) {
      await expectDenied(call(who, "select public.adm_ai_evidence_summary()"));
      await expectDenied(call(who, "select public.adm_ai_evidence_list('SK-01')"));
      await expectDenied(set(who, "SK-01"));
    }
    for (const who of [learner, author, admin, reviewer]) {
      await expectDenied(asUser(A(who), "select * from public.ai_evidence_reviews"));
      await expectDenied(asUser(A(who), "insert into public.ai_evidence_reviews (draft_key, tool, sources_checked, guideline_currency, discrepancies_found, summary, recommendation) values ('SK-01','x','{x}','current',false,'x','no_action')"));
    }
  });
  it("needs MFA (aal2) for staff reads and writes", async () => {
    await expectDenied(asUser({ id: author, aal: "aal1" as const }, "select public.adm_ai_evidence_summary()"));
    await expectDenied(asUser({ id: author, aal: "aal1" as const }, "select public.adm_ai_evidence_set('SK-01','x','{x}','current',false,'x','no_action')"));
  });
  it("lets a clinical reviewer read but not write, and this never assigns or records a clinical review", async () => {
    await set(author, "SK-02");
    expect((await list(reviewer, "SK-02"))[0].tool).toMatch(/ChatGPT/);
    await expectDenied(set(reviewer, "SK-02"));
  });
});

describe("AI evidence review: never an approval", () => {
  it("has no column or function path to clinically_reviewed, content_reviews, or draft status", async () => {
    const cols = (await owner.query("select column_name from information_schema.columns where table_schema='public' and table_name='ai_evidence_reviews'")).rows.map((r) => r.column_name);
    expect(cols).not.toEqual(expect.arrayContaining(["clinically_reviewed", "approved", "published", "status"]));
    const before = (await owner.query("select count(*)::int n from public.content_reviews")).rows[0].n;
    await set(author, "SK-03", { ...GOOD, recommendation: "major_gap_flagged" });
    const after = (await owner.query("select count(*)::int n from public.content_reviews")).rows[0].n;
    expect(after).toBe(before); // flagging a major gap writes nothing to the real review table
  });
  it("a major gap flag changes nothing about the draft's own review status fields (those live in the draft file, not here)", async () => {
    await set(admin, "MD-01", { ...GOOD, recommendation: "major_gap_flagged", discrepancies: true, summary: "The draft's escalation wording does not match the 2026 update; flagging for human review." });
    const rows = await list(admin, "MD-01");
    expect(rows[0]).toMatchObject({ recommendation: "major_gap_flagged", discrepancies_found: true });
    // content_reviews has no notion of a draft file key at all: a "major gap" flag here cannot be mistaken for, or linked to, a real clinical review
    const cols = (await owner.query("select column_name from information_schema.columns where table_schema='public' and table_name='content_reviews'")).rows.map((r) => r.column_name);
    expect(cols).not.toContain("draft_key");
  });
});

describe("AI evidence review: log, validation, audit and immutability", () => {
  it("accumulates a history (append-only) rather than overwriting, newest first, with the summary surfaced", async () => {
    await set(author, "EQ-01", { ...GOOD, summary: "First check: matches the AARC guideline." });
    await set(admin, "EQ-01", { ...GOOD, recommendation: "minor_update_suggested", summary: "Second check: the cited guideline has a newer edition; wording should be refreshed." });
    const rows = await list(admin, "EQ-01");
    expect(rows).toHaveLength(2);
    expect(rows[0].summary).toMatch(/newer edition/); // newest first
    expect(rows[1].summary).toMatch(/First check/);
    const sum = (await call(admin, "select public.adm_ai_evidence_summary() as s")).s;
    expect(sum["EQ-01"]).toMatchObject({ count: 2, last_recommendation: "minor_update_suggested", ever_flagged: false });
    expect(sum["MD-01"]).toMatchObject({ ever_flagged: true });
  });
  it("audits every entry with the outcome only, never the free text, and the table is append-only", async () => {
    const r = await set(author, "XQ-01", { ...GOOD, summary: "Checked against the AHRQ TeamSTEPPS material." });
    const a = (await owner.query("select actor, action, details::text d from public.audit_log where entity_type='ai_evidence_review' and entity_id='XQ-01'")).rows;
    expect(a).toHaveLength(1);
    expect(a[0].actor).toBe(author); expect(a[0].action).toBe("ai_evidence_review_set");
    expect(a[0].d).not.toMatch(/TeamSTEPPS/);
    expect(JSON.parse(a[0].d)).toMatchObject({ id: r.r.id, recommendation: "no_action", discrepancies_found: false });
    await expect(owner.query("update public.ai_evidence_reviews set summary='x'")).rejects.toThrow(/append-only/);
    await expect(owner.query("delete from public.ai_evidence_reviews")).rejects.toThrow(/append-only/);
  });
  it("validates the draft key, tool, sources, currency, summary and recommendation, and refuses doses and rates", async () => {
    await expect(set(author, "NOPE-01")).rejects.toThrow(/invalid draft key/);
    await expect(call(author, "select public.adm_ai_evidence_set($1,$2,$3,$4,$5,$6,$7)", ["SK-01", "", ["x"], "current", false, "x", "no_action"])).rejects.toThrow(/name the tool/);
    await expect(call(author, "select public.adm_ai_evidence_set($1,$2,$3,$4,$5,$6,$7)", ["SK-01", "ChatGPT", [], "current", false, "x", "no_action"])).rejects.toThrow(/1 to 20 sources/);
    await expect(call(author, "select public.adm_ai_evidence_set($1,$2,$3,$4,$5,$6,$7)", ["SK-01", "ChatGPT", Array(21).fill("x"), "current", false, "x", "no_action"])).rejects.toThrow(/1 to 20 sources/);
    await expect(call(author, "select public.adm_ai_evidence_set($1,$2,$3,$4,$5,$6,$7)", ["SK-01", "ChatGPT", ["x"], "obsolete", false, "x", "no_action"])).rejects.toThrow(/invalid guideline currency/);
    await expect(call(author, "select public.adm_ai_evidence_set($1,$2,$3,$4,$5,$6,$7)", ["SK-01", "ChatGPT", ["x"], "current", false, "x", "approved"])).rejects.toThrow(/invalid recommendation/);
    await expect(set(author, "SK-01", { ...GOOD, summary: "Give 5 mg per hour" })).rejects.toThrow(/refused/);
    await expect(set(author, "SK-01", { ...GOOD, summary: "x".repeat(2001) })).rejects.toThrow(/refused/);
  });
  it("throttles at 20 entries per user per hour", async () => {
    const fresh = await createUser(uniqueEmail("author2")); await grantRole(fresh, "author");
    for (let i = 0; i < 20; i++) await set(fresh, "SK-04", { ...GOOD, summary: `Check ${i}` });
    await expect(set(fresh, "SK-04")).rejects.toThrow(/too many entries/);
  });
});
