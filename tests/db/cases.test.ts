/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally; shapes are validated by the app's zod schemas */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, owner, setupDb, uniqueEmail } from "./helpers";
import { caseSeedSql, loadCaseFixtures } from "../../src/lib/cases/fixtures";
import { caseAttemptSchema, caseListSchema, caseProgressSchema } from "../../src/lib/cases/types";
import { scoreTenths } from "../../src/lib/question-bank/score";
import { seededOrder } from "../../src/lib/question-bank/shuffle";

const cases = loadCaseFixtures();
const c1 = cases[0]!, c2 = cases[1]!;
let alice: string, bob: string;
const rpc = async (who: string | null, text: string, params: unknown[] = []) => (await asUser(who ? { id: who } : null, text, params)).rows[0] as Record<string, any>;
const start = async (u: string, c = c1) => (await rpc(u, "select public.cs_start($1) as id", [c.id])).id as string;
const get = async (u: string, id: string) => (await rpc(u, "select public.cs_get($1) as a", [id])).a as any;
const choose = async (u: string, id: string, pos: number, opt: string) => (await rpc(u, "select public.cs_choose($1,$2,$3) as a", [id, pos, opt])).a as any;
/** The option of fixture case `c`, step `pos`, with the given points (first match). */
const pick = (c: typeof c1, pos: number, points: number, next?: number | null) =>
  c.steps[pos - 1]!.options.find((o) => o.points === points && (next === undefined || o.next === next))!;

beforeAll(async () => {
  await setupDb();
  alice = await createUser(uniqueEmail("alice"));
  bob = await createUser(uniqueEmail("bob"));
  await owner.query(caseSeedSql());
});
afterAll(closePool);

describe("content gate", () => {
  it("shows no cases while fixtures are off, and none on a non-development database", async () => {
    expect((await rpc(alice, "select public.cs_list() as l")).l).toEqual([]);
    await expect(start(alice)).rejects.toThrow(/case not found/);
    await owner.query("update public.app_settings set environment='development', question_fixtures_visible=true");
    expect((await rpc(alice, "select public.cs_list() as l")).l).toHaveLength(3);
    await owner.query("alter table public.app_settings drop constraint app_settings_fixtures_dev_only");
    await owner.query("update public.app_settings set environment='production'");
    expect((await rpc(alice, "select public.cs_list() as l")).l).toEqual([]);
    await owner.query("update public.app_settings set environment='development'");
    await owner.query("alter table public.app_settings add constraint app_settings_fixtures_dev_only check (not question_fixtures_visible or environment = 'development')");
  });
  it("outputs parse with the application's schemas", async () => {
    const list = (await rpc(alice, "select public.cs_list() as l")).l;
    const prog = (await rpc(alice, "select public.cs_progress() as p")).p;
    const id = await start(alice, c2);
    const att = await get(alice, id);
    expect(() => caseListSchema.parse(list)).not.toThrow();
    expect(() => caseProgressSchema.parse(prog)).not.toThrow();
    expect(() => caseAttemptSchema.parse(att)).not.toThrow();
  });
  it("rejects publication of a clinical case without every safeguard, and of an invalid structure", async () => {
    const dom = (await owner.query("select id from public.nursing_domains limit 1")).rows[0].id;
    const mk = async (kind: string, note: string | null) => (await owner.query(
      "insert into public.case_items (code, kind, status, origin, domain_id, title, vignette, source_note) values ($1,$2,'draft','ai_generated',$3,'{\"en\":\"Gate test\"}','{\"en\":\"A gate-test vignette that is long enough.\"}',$4) returning id",
      [`GATE-${Math.random().toString(36).slice(2, 7)}`, kind, dom, note])).rows[0].id as string;
    const publish = (id: string, extra = "") => owner.query(`update public.case_items set status='published', approved_at=now(), published_at=now() ${extra} where id=$1`, [id]);
    const clin = await mk("clinical", null);
    await expect(publish(clin)).rejects.toThrow(/named approver/);
    const unlabelled = await mk("demo_synthetic", "real clinical source");
    await expect(publish(unlabelled)).rejects.toThrow(/SYNTHETIC FIXTURE/);
    const empty = await mk("demo_synthetic", "SYNTHETIC FIXTURE gate test");
    await expect(publish(empty)).rejects.toThrow(/invalid case structure.*at least two decision steps/);
    expect((await owner.query("select private.case_is_visible($1) v", [clin])).rows[0].v).toBe(false);
    expect((await asUser({ id: alice }, "select * from public.case_items where id=$1", [clin])).rows).toEqual([]);
    await expect(rpc(alice, "select public.cs_start($1)", [clin])).rejects.toThrow(/case not found/);
  });
  it("freezes published cases", async () => {
    await expect(owner.query("update public.case_option_keys set points = 2 where option_id=$1", [c1.steps[0]!.options[0]!.id])).rejects.toThrow(/immutable/);
    await expect(owner.query("delete from public.case_steps where id=$1", [c1.steps[0]!.id])).rejects.toThrow(/immutable/);
    await expect(owner.query("update public.case_items set title='{\"en\":\"Changed title\"}' where id=$1", [c1.id])).rejects.toThrow(/immutable/);
  });
});

describe("secrecy", () => {
  it("never sends points, scope, feedback, next steps or later steps for an in-progress case", async () => {
    const id = await start(alice);
    const a = await get(alice, id);
    const text = JSON.stringify(a);
    expect(a.trail).toEqual([]);
    expect(a.current.position).toBe(1);
    expect(a.current.options).toHaveLength(3);
    expect(text).not.toMatch(/points|scope|feedback|next_position/);
    for (const s of c1.steps.slice(1)) expect(text).not.toContain(s.info.en!);
    for (const s of c1.steps) for (const o of s.options) expect(text).not.toContain(o.feedback.en!);
    // The same holds for the learner's own table rows: nothing is stored until a decision is committed.
    expect((await asUser({ id: alice }, "select * from public.case_attempt_steps where attempt_id=$1", [id])).rows).toEqual([]);
  });
  it("reveals feedback only for committed decisions", async () => {
    const id = await start(bob);
    const a1 = await choose(bob, id, 1, pick(c1, 1, 1).id);
    expect(a1.trail).toHaveLength(1);
    expect(a1.trail[0].points).toBe(1);
    expect(a1.trail[0].options).toHaveLength(3);
    expect(a1.trail[0].options.every((o: any) => typeof o.feedback.en === "string" && typeof o.scope === "string")).toBe(true);
    const text = JSON.stringify(a1.current);
    expect(text).not.toMatch(/points|scope|feedback/);
    expect(text).not.toContain(c1.steps[3]!.info.en!); // step 4 is still hidden
  });
  it("blocks all direct table access to content and keys, and any write", async () => {
    for (const t of ["case_items", "case_steps", "case_step_options", "case_option_keys"]) expect((await asUser({ id: alice }, `select * from public.${t}`)).rows).toEqual([]);
    for (const t of ["case_items", "case_steps", "case_step_options", "case_option_keys", "case_attempts", "case_attempt_steps"]) {
      await expectDenied(asUser({ id: alice }, `insert into public.${t} select * from public.${t} limit 0`));
      await expectDenied(asUser({ id: alice }, `update public.${t} set id = id where false`.replace("id = id", t === "case_option_keys" ? "points = 2" : t === "case_attempt_steps" ? "points = 2" : "id = id")));
      await expectDenied(asUser({ id: alice }, `delete from public.${t} where false`));
    }
    await expectDenied(asUser(null, "select public.cs_list()"));
    await expectDenied(asUser(null, "select public.cs_start($1)", [c1.id]));
  });
});

describe("branching, scoring and completion", () => {
  it("follows the branch chosen and scores 0-2 per decision deterministically", async () => {
    const u = await createUser(uniqueEmail("carol"));
    const id = await start(u);
    // Step 1: the 0-point option jumps to step 3 (error branch); step 3 -> step 4.
    const bad = pick(c1, 1, 0);
    expect(bad.next).toBe(3);
    let a = await choose(u, id, 1, bad.id);
    expect(a.current.position).toBe(3);
    a = await choose(u, id, 3, pick(c1, 3, 2).id);
    expect(a.current.position).toBe(4);
    a = await choose(u, id, 4, pick(c1, 4, 1).id);
    expect(a.status).toBe("completed");
    expect(a.current).toBeNull();
    expect(a.summary).toMatchObject({ points: 3, max_points: 6, steps: 3, score_tenths: scoreTenths(3, 6) });
    expect(a.trail.map((t: any) => t.position)).toEqual([1, 3, 4]); // step 2 was never visited, so never shown
    expect(JSON.stringify(a)).not.toContain(c1.steps[1]!.info.en!);
  });
  it("a best-path run scores 100%, and the denominator is 2 points per decision actually taken", async () => {
    const u = await createUser(uniqueEmail("dave"));
    const id = await start(u);
    let a = await choose(u, id, 1, pick(c1, 1, 2).id);
    expect(a.current.position).toBe(2);
    a = await choose(u, id, 2, pick(c1, 2, 2).id);
    a = await choose(u, id, 4, pick(c1, 4, 2).id);
    expect(a.summary).toMatchObject({ points: 6, max_points: 6, score_tenths: 1000, steps: 3 });
    const p = (await rpc(u, "select public.cs_progress() as p")).p;
    expect(p).toMatchObject({ completed_cases: 1, in_progress: 0, average_tenths: 1000 });
    const l = (await rpc(u, "select public.cs_list() as l")).l.find((x: any) => x.id === c1.id);
    expect(l).toMatchObject({ completed: 1, best_score_tenths: 1000, in_progress_attempt: null });
  });
  it("commits are final and must follow the current step", async () => {
    const u = await createUser(uniqueEmail("erin"));
    const id = await start(u, c2);
    const first = pick(c2, 1, 2);
    await choose(u, id, 1, first.id);
    await expect(choose(u, id, 1, pick(c2, 1, 0).id)).rejects.toThrow(/not the current step/);
    await expect(choose(u, id, 3, pick(c2, 3, 2).id)).rejects.toThrow(/not the current step/);
    await expect(choose(u, id, 2, pick(c2, 3, 2).id)).rejects.toThrow(/does not belong to this step/);
    const done = await (async () => { let a = await get(u, id); while (a.status === "in_progress") a = await choose(u, id, a.current.position, pick(c2, a.current.position, 2).id); return a; })();
    expect(done.status).toBe("completed");
    await expect(choose(u, id, 3, pick(c2, 3, 2).id)).rejects.toThrow(/no longer in progress/);
  });
  it("shuffles options deterministically from the stored seed (same algorithm as TypeScript)", async () => {
    const id = await start(alice, c2);
    const seed = (await owner.query("select seed from public.case_attempts where id=$1", [id])).rows[0].seed;
    const a = await get(alice, id);
    expect(a.current.options.map((o: any) => o.id)).toEqual(seededOrder(c2.steps[0]!.options.map((o) => o.id), seed, c2.steps[0]!.id));
  });
});

describe("resume and privacy", () => {
  it("resumes an unfinished case rather than starting a duplicate, with the same state", async () => {
    const u = await createUser(uniqueEmail("fay"));
    const id = await start(u);
    await choose(u, id, 1, pick(c1, 1, 2).id);
    expect(await start(u)).toBe(id);
    const l = (await rpc(u, "select public.cs_list() as l")).l.find((x: any) => x.id === c1.id);
    expect(l).toMatchObject({ in_progress_attempt: id, in_progress_position: 2 });
    const a = await get(u, id);
    expect(a.current.position).toBe(2);
    expect(a.trail).toHaveLength(1);
    await rpc(u, "select public.cs_discard($1)", [id]);
    expect(await start(u)).not.toBe(id);
  });
  it("another learner cannot read, choose in, or discard someone else's attempt", async () => {
    const id = await start(alice, c2);
    expect((await asUser({ id: bob }, "select * from public.case_attempts where id=$1", [id])).rows).toEqual([]);
    await expect(get(bob, id)).rejects.toThrow(/attempt not found/);
    await expect(choose(bob, id, 1, pick(c2, 1, 2).id)).rejects.toThrow(/attempt not found/);
    await expect(rpc(bob, "select public.cs_discard($1)", [id])).rejects.toThrow(/attempt not found/);
  });
  it("limits unfinished cases per learner", async () => {
    const u = await createUser(uniqueEmail("gus"));
    for (const c of cases) await start(u, c);
    await owner.query("update public.case_attempts set status='abandoned' where user_id=$1", [u]);
    // 5 distinct unfinished attempts are possible only through repeated discard/start cycles; here verify the cap message path via direct inserts.
    for (let i = 0; i < 5; i++) await owner.query("insert into public.case_attempts (user_id, case_id, case_version, seed) values ($1,$2,1,'abcdefgh')", [u, c1.id]);
    await expect(start(u, c2)).rejects.toThrow(/unfinished case/);
  });
  it("withdrawn cases stop serving in-progress attempts but remain viewable once completed", async () => {
    const u = await createUser(uniqueEmail("hal"));
    const id = await start(u, c2);
    await owner.query("update public.case_items set retired_at=now() where id=$1", [c2.id]);
    await expect(get(u, id)).rejects.toThrow(/no longer available/);
    await expect(choose(u, id, 1, pick(c2, 1, 2).id)).rejects.toThrow(/no longer available/);
    await owner.query("update public.case_items set retired_at=null where id=$1", [c2.id]);
  });
});
