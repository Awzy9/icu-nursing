/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally; shapes are validated by the app's zod schemas */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, owner, setupDb, uniqueEmail } from "./helpers";
import { fixtureSeedSql, loadFixtures } from "../../src/lib/question-bank/fixtures";
import { daysForBox, nextBox } from "../../src/lib/question-bank/leitner";
import { historySchema, studyOverviewSchema } from "../../src/lib/question-bank/types";

const fx = loadFixtures();
let alice: string, bob: string;
const rpc = async (who: string | null, text: string, params: unknown[] = []) => (await asUser(who ? { id: who } : null, text, params)).rows[0] as Record<string, any>;
const sched = async (u: string) => (await owner.query("select question_id, box, due_at, reps, lapses from public.learner_review_schedule where user_id=$1 order by question_id", [u])).rows;
const correct = (q: string) => fx.find((f) => f.id === q)!.correctOptionId;
const wrong = (q: string) => fx.find((f) => f.id === q)!.options.find((o) => o.id !== correct(q))!.id;
const reset = (u: string) => owner.query("update public.quiz_attempts set status='abandoned' where user_id=$1 and status='in_progress'", [u]);
/** Starts a practice attempt (optionally via a revision kind) and answers items by a rule: 'c' correct, 'w' wrong, '-' skip. */
async function run(u: string, pattern: string, kind?: string) {
  await reset(u);
  const id = kind ? (await rpc(u, "select public.st_start_revision($1, 20) as id", [kind])).id : (await rpc(u, "select public.qb_start_attempt('practice', 16, null, null) as id")).id;
  const a = (await rpc(u, "select public.qb_get_attempt($1) as a", [id])).a;
  for (let i = 0; i < pattern.length && i < a.items.length; i++) {
    const q = a.items[i].question_id;
    if (pattern[i] === "c") await rpc(u, "select public.qb_submit_answer($1,$2,$3)", [id, i + 1, correct(q)]);
    if (pattern[i] === "w") await rpc(u, "select public.qb_submit_answer($1,$2,$3)", [id, i + 1, wrong(q)]);
  }
  return { id: id as string, a };
}

beforeAll(async () => {
  await setupDb();
  alice = await createUser(uniqueEmail("alice"));
  bob = await createUser(uniqueEmail("bob"));
  await owner.query(fixtureSeedSql({ makeVisible: false }));
  await owner.query("update public.app_settings set environment='development', question_fixtures_visible=true");
});
afterAll(closePool);

describe("Leitner schedule (deterministic)", () => {
  it("TypeScript and SQL agree on boxes and intervals", async () => {
    for (let b = 0; b <= 5; b++) for (const c of [true, false]) expect((await owner.query("select private.leitner_next_box($1,$2) n", [b, c])).rows[0].n).toBe(nextBox(b, c));
    for (let b = 1; b <= 5; b++) expect((await owner.query("select private.leitner_days($1) d", [b])).rows[0].d).toBe(daysForBox(b));
    expect([1, 2, 3, 4, 5].map(daysForBox)).toEqual([0, 1, 3, 7, 14]);
  });
  it("wrong -> box 1 due now; correct -> up one box with the right interval; capped at box 5", async () => {
    const { a } = await run(alice, "wc");
    const [w, c] = [a.items[0].question_id, a.items[1].question_id];
    let rows = await sched(alice);
    const rw = rows.find((r) => r.question_id === w)!, rc = rows.find((r) => r.question_id === c)!;
    expect(rw).toMatchObject({ box: 1, lapses: 1, reps: 1 });
    expect(new Date(rw.due_at).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    expect(rc).toMatchObject({ box: 2, lapses: 0 });
    const days = (new Date(rc.due_at).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(0.99);
    expect(days).toBeLessThan(1.01);
    // Climb the same question to box 5 and beyond.
    for (let i = 0; i < 5; i++) {
      await owner.query("update public.learner_review_schedule set due_at = now() where user_id=$1", [alice]);
      await reset(alice);
      const id = (await rpc(alice, "select public.st_start_revision('due', 5) as id")).id;
      const g = (await rpc(alice, "select public.qb_get_attempt($1) as a", [id])).a;
      for (const it of g.items) if (it.question_id === c) await rpc(alice, "select public.qb_submit_answer($1,$2,$3)", [id, it.position, correct(c)]);
    }
    rows = await sched(alice);
    expect(rows.find((r) => r.question_id === c)!.box).toBe(5);
    const d5 = (new Date(rows.find((r) => r.question_id === c)!.due_at).getTime() - Date.now()) / 86_400_000;
    expect(Math.round(d5)).toBe(14);
  });
  it("a lapse sends a high-box question back to box 1", async () => {
    const q = (await sched(alice)).find((r) => r.box === 5)!.question_id as string;
    await owner.query("update public.learner_review_schedule set due_at = now() where user_id=$1", [alice]);
    await reset(alice);
    const id = (await rpc(alice, "select public.st_start_revision('due', 10) as id")).id;
    const g = (await rpc(alice, "select public.qb_get_attempt($1) as a", [id])).a;
    const pos = g.items.find((i: any) => i.question_id === q).position;
    await rpc(alice, "select public.qb_submit_answer($1,$2,$3)", [id, pos, wrong(q)]);
    expect((await sched(alice)).find((r) => r.question_id === q)).toMatchObject({ box: 1 });
  });
});

describe("revision launchers", () => {
  it("'incorrect' serves exactly the questions whose latest answer was wrong", async () => {
    const c = await createUser(uniqueEmail("carol"));
    const { a } = await run(c, "wwcc");
    const wrongIds = [a.items[0].question_id, a.items[1].question_id].sort();
    await reset(c);
    const id = (await rpc(c, "select public.st_start_revision('incorrect', 20) as id")).id;
    const g = (await rpc(c, "select public.qb_get_attempt($1) as a", [id])).a;
    expect(g.items.map((i: any) => i.question_id).sort()).toEqual(wrongIds);
    expect(JSON.stringify(g)).not.toMatch(/correct_option_id|rationale|explanations/); // secrecy holds in revision attempts too
    // Fixing one removes it from the set.
    await rpc(c, "select public.qb_submit_answer($1,1,$2)", [id, correct(g.items[0].question_id)]);
    await reset(c);
    const id2 = (await rpc(c, "select public.st_start_revision('incorrect', 20) as id")).id;
    expect((await rpc(c, "select public.qb_get_attempt($1) as a", [id2])).a.items).toHaveLength(1);
  });
  it("'flagged' and 'bookmarked' use only the learner's own flags and bookmarks", async () => {
    const d = await createUser(uniqueEmail("dave"));
    const { id, a } = await run(d, "");
    await rpc(d, "select public.qb_set_flag($1,2,true)", [id]);
    await rpc(d, "select public.qb_set_bookmark($1,true)", [a.items[2].question_id]);
    await reset(d);
    const f = (await rpc(d, "select public.st_start_revision('flagged', 10) as id")).id;
    expect((await rpc(d, "select public.qb_get_attempt($1) as a", [f])).a.items.map((i: any) => i.question_id)).toEqual([a.items[1].question_id]);
    await reset(d);
    const b = (await rpc(d, "select public.st_start_revision('bookmarked', 10) as id")).id;
    expect((await rpc(d, "select public.qb_get_attempt($1) as a", [b])).a.items.map((i: any) => i.question_id)).toEqual([a.items[2].question_id]);
    const e = await createUser(uniqueEmail("erin"));
    await expect(rpc(e, "select public.st_start_revision('flagged', 10)")).rejects.toThrow(/no questions are available/);
    await expect(rpc(e, "select public.st_start_revision('bookmarked', 10)")).rejects.toThrow(/no questions are available/);
  });
  it("rejects unknown kinds and anonymous callers", async () => {
    await expect(rpc(alice, "select public.st_start_revision('everything', 5)")).rejects.toThrow(/invalid revision kind/);
    await expectDenied(asUser(null, "select public.st_overview()"));
    await expectDenied(asUser(null, "select public.st_start_revision('due', 5)"));
    await expectDenied(asUser(null, "select public.st_history(5)"));
  });
});

describe("overview, history and privacy", () => {
  it("reports counters, boxes and per-topic progress that parse with the app schema", async () => {
    const f = await createUser(uniqueEmail("frank"));
    await run(f, "wcwc");
    const o = (await rpc(f, "select public.st_overview() as o")).o;
    expect(() => studyOverviewSchema.parse(o)).not.toThrow();
    expect(o).toMatchObject({ due: 2, incorrect: 2, reviewed_today: 4 });
    expect(o.boxes).toEqual([2, 2, 0, 0, 0]);
    expect(o.domains.reduce((n: number, d: any) => n + d.due, 0)).toBe(2);
    expect(o.next_due_at).not.toBeNull();
  });
  it("history lists only the caller's revealed answers", async () => {
    const g = await createUser(uniqueEmail("gina"));
    const h = await createUser(uniqueEmail("hank"));
    await run(g, "wc");
    const mine = (await rpc(g, "select public.st_history(10) as h")).h;
    expect(() => historySchema.parse(mine)).not.toThrow();
    expect(mine).toHaveLength(2);
    expect(mine.map((x: any) => x.is_correct).sort()).toEqual([false, true]);
    expect((await rpc(h, "select public.st_history(10) as h")).h).toEqual([]);
    expect((await asUser({ id: h }, "select * from public.learner_review_schedule")).rows).toEqual([]);
  });
  it("an exam answer enters the schedule only when the attempt is submitted (never earlier)", async () => {
    const i = await createUser(uniqueEmail("ivy"));
    const id = (await rpc(i, "select public.qb_start_attempt('exam', 3, null, null) as id")).id;
    const a = (await rpc(i, "select public.qb_get_attempt($1) as a", [id])).a;
    await rpc(i, "select public.qb_submit_answer($1,1,$2)", [id, wrong(a.items[0].question_id)]);
    expect(await sched(i)).toHaveLength(0);
    expect(((await rpc(i, "select public.st_overview() as o")).o).due).toBe(0);
    await rpc(i, "select public.qb_submit_attempt($1)", [id]);
    expect(await sched(i)).toHaveLength(1);
  });
  it("learners cannot write the schedule", async () => {
    for (const q of ["insert into public.learner_review_schedule (user_id, question_id) select auth.uid(), id from public.question_items limit 1",
      "update public.learner_review_schedule set box = 5", "delete from public.learner_review_schedule"]) await expectDenied(asUser({ id: alice }, q));
  });
  it("withdrawn questions leave the due set and the counters (content gate is inherited)", async () => {
    const j = await createUser(uniqueEmail("jon"));
    const { a } = await run(j, "ww");
    expect(((await rpc(j, "select public.st_overview() as o")).o).due).toBe(2);
    await owner.query("update public.question_items set retired_at = now() where id=$1", [a.items[0].question_id]);
    const o = (await rpc(j, "select public.st_overview() as o")).o;
    expect(o).toMatchObject({ due: 1, incorrect: 1 });
    expect((await rpc(j, "select public.st_history(10) as h")).h).toHaveLength(1);
    await reset(j);
    const id = (await rpc(j, "select public.st_start_revision('due', 10) as id")).id;
    expect((await rpc(j, "select public.qb_get_attempt($1) as a", [id])).a.items).toHaveLength(1);
    await owner.query("update public.question_items set retired_at = null");
    void bob;
  });
});
