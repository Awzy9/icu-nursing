/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally; their shape is validated by the app's zod schemas */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, grantRole, owner, setupDb, uniqueEmail } from "./helpers";
import { fixtureSeedSql, loadFixtures } from "../../src/lib/question-bank/fixtures";
import { seededOrder } from "../../src/lib/question-bank/shuffle";
import { scoreTenths } from "../../src/lib/question-bank/score";
import { attemptListSchema, attemptSchema, progressSchema } from "../../src/lib/question-bank/types";

let alice: string, bob: string, staff: string;
const A = () => ({ id: alice });
const B = () => ({ id: bob });
const fx = loadFixtures();
const rpc = async (who: { id: string } | null, text: string, params: unknown[] = []) => (await asUser(who, text, params)).rows[0] as Record<string, unknown>;
const startRaw = async (who: { id: string }, mode = "practice", count = 5, domains: string[] | null = null, limit: number | null = null) =>
  (await rpc(who, "select public.qb_start_attempt($1,$2,$3,$4) as id", [mode, count, domains, limit])).id as string;
/** Tidies the learner's earlier unfinished attempts first so tests do not trip the 5-unfinished limit (which has its own test). */
const start = async (who: { id: string }, mode = "practice", count = 5, domains: string[] | null = null, limit: number | null = null) => {
  await owner.query("update public.quiz_attempts set status='abandoned' where user_id=$1 and status='in_progress'", [who.id]);
  return startRaw(who, mode, count, domains, limit);
};
const get = async (who: { id: string }, id: string) => (await rpc(who, "select public.qb_get_attempt($1) as a", [id])).a as any;
const answer = async (who: { id: string }, id: string, pos: number, opt: string | null) => (await rpc(who, "select public.qb_submit_answer($1,$2,$3) as r", [id, pos, opt])).r as any;
const correctFor = (questionId: string) => fx.find((q) => q.id === questionId)!.correctOptionId;
const wrongFor = (questionId: string) => fx.find((q) => q.id === questionId)!.options.find((o) => o.id !== correctFor(questionId))!.id;

beforeAll(async () => {
  await setupDb();
  alice = await createUser(uniqueEmail("alice"));
  bob = await createUser(uniqueEmail("bob"));
  staff = await createUser(uniqueEmail("staff"));
  await grantRole(staff, "author");
  await owner.query(fixtureSeedSql({ makeVisible: false }));
});
afterAll(closePool);

describe("content gate: fixtures are hidden unless the development setting is on", () => {
  it("shows no questions while question_fixtures_visible is false", async () => {
    await expect(start(A())).rejects.toThrow(/no questions are available/);
    const p = (await rpc(A(), "select public.qb_progress() as p")).p as any;
    expect(p.domains.reduce((n: number, d: any) => n + d.available, 0)).toBe(0);
    expect(p.synthetic_fixtures).toBe(false);
  });
  it("shows synthetic questions, labelled as synthetic, once the setting is on", async () => {
    await owner.query("update public.app_settings set environment = 'development', question_fixtures_visible = true");
    const p = (await rpc(A(), "select public.qb_progress() as p")).p as any;
    expect(p.domains.reduce((n: number, d: any) => n + d.available, 0)).toBe(fx.length);
    expect(p.synthetic_fixtures).toBe(true);
    const id = await start(A(), "practice", 3);
    const a = await get(A(), id);
    expect(a.items.every((i: any) => i.synthetic === true)).toBe(true);
  });
});

describe("fixture visibility cannot be enabled outside a development database", () => {
  it("defaults to production and refuses to show fixtures there", async () => {
    await owner.query("update public.app_settings set question_fixtures_visible = false, environment = 'production'");
    await expect(owner.query("update public.app_settings set question_fixtures_visible = true")).rejects.toThrow(/app_settings_fixtures_dev_only/);
    await owner.query("update public.app_settings set environment = 'staging'");
    await expect(owner.query("update public.app_settings set question_fixtures_visible = true")).rejects.toThrow(/app_settings_fixtures_dev_only/);
    await owner.query("update public.app_settings set environment = 'development', question_fixtures_visible = true");
    await expect(owner.query("update public.app_settings set environment = 'production'")).rejects.toThrow(/app_settings_fixtures_dev_only/);
    await expect(owner.query("update public.app_settings set environment = 'prod'")).rejects.toThrow();
  });
  it("hides fixtures even if the visibility flag could somehow be true outside development", async () => {
    await owner.query("alter table public.app_settings drop constraint app_settings_fixtures_dev_only");
    await owner.query("update public.app_settings set environment = 'production', question_fixtures_visible = true");
    expect((await owner.query("select private.question_is_visible($1) v", [fx[0]!.id])).rows[0].v).toBe(false);
    await owner.query("update public.app_settings set question_fixtures_visible = false, environment = 'development'");
    await owner.query("alter table public.app_settings add constraint app_settings_fixtures_dev_only check (not question_fixtures_visible or environment = 'development')");
    await owner.query("update public.app_settings set question_fixtures_visible = true");
  });
});

describe("answer secrecy", () => {
  it("does not return keys, rationale or explanations for unanswered practice questions", async () => {
    const id = await start(A(), "practice", 16);
    const a = await get(A(), id);
    const text = JSON.stringify(a);
    expect(a.items).toHaveLength(16);
    for (const i of a.items) {
      expect(i.feedback).toBeNull();
      expect(i.revealed).toBe(false);
      expect(i.selected_option_id).toBeNull();
      const q = fx.find((f) => f.id === i.question_id)!;
      expect(text).not.toContain(q.rationale.en);
      for (const o of q.options) expect(text).not.toContain(o.explanation.en);
    }
    expect(text).not.toMatch(/correct_option_id|explanations|rationale/);
  });

  it("reveals feedback only for a practice answer already submitted, and never for others", async () => {
    const id = await start(A(), "practice", 4);
    const a0 = await get(A(), id);
    const q0 = a0.items[0].question_id as string;
    const res = await answer(A(), id, 1, wrongFor(q0));
    expect(res.feedback.is_correct).toBe(false);
    expect(res.feedback.correct_option_id).toBe(correctFor(q0));
    expect(Object.keys(res.feedback.explanations)).toHaveLength(4);
    const a1 = await get(A(), id);
    expect(a1.items[0].feedback.correct_option_id).toBe(correctFor(q0));
    expect(a1.items.slice(1).every((i: any) => i.feedback === null)).toBe(true);
  });

  it("practice answers are final: a second submission is refused and cannot change the outcome", async () => {
    const id = await start(A(), "practice", 2);
    const q0 = (await get(A(), id)).items[0].question_id as string;
    await answer(A(), id, 1, wrongFor(q0));
    await expect(answer(A(), id, 1, correctFor(q0))).rejects.toThrow(/already been answered/);
  });

  it("exam mode returns no feedback and stores no correctness until the attempt is submitted", async () => {
    const id = await start(A(), "exam", 4);
    const a = await get(A(), id);
    const q0 = a.items[0].question_id as string;
    const r = await answer(A(), id, 1, correctFor(q0));
    expect(r.feedback).toBeUndefined();
    const own = await asUser(A(), "select position, is_correct, revealed_at from public.quiz_answers where attempt_id=$1", [id]);
    expect(own.rows).toEqual([{ position: 1, is_correct: null, revealed_at: null }]);
    expect((await get(A(), id)).items[0].feedback).toBeNull();
  });
});

describe("table access: learners cannot read content, keys or write anything", () => {
  it("returns no rows from content tables and denies every write", async () => {
    for (const t of ["question_items", "question_options", "question_answer_keys", "question_explanations", "question_stats"]) {
      expect((await asUser(A(), `select * from public.${t}`)).rows).toEqual([]);
    }
    for (const t of ["question_items", "question_options", "question_answer_keys", "question_explanations", "quiz_attempts", "quiz_attempt_items", "quiz_answers", "learner_question_stats", "question_stats", "question_bookmarks"]) {
      await expectDenied(asUser(A(), `insert into public.${t} select * from public.${t} limit 0`));
      await expectDenied(asUser(A(), `update public.${t} set ${t === "question_items" ? "status" : t === "quiz_attempts" ? "score_tenths" : t === "quiz_answers" ? "is_correct" : "question_id"} = null where false`));
      await expectDenied(asUser(A(), `delete from public.${t} where false`));
    }
  });
  it("lets a learner forge neither a score nor an answer", async () => {
    const id = await start(A(), "exam", 2);
    await expectDenied(asUser(A(), "update public.quiz_attempts set score_tenths = 1000, status = 'completed', completed_at = now() where id = $1", [id]));
    await expectDenied(asUser(A(), "insert into public.quiz_answers (attempt_id, position, user_id, selected_option_id, is_correct) select attempt_id, 1, user_id, option_order[1], true from public.quiz_attempt_items where attempt_id=$1 and position=1", [id]));
  });
  it("gives staff read access to the working copy but anonymous users nothing", async () => {
    expect((await asUser({ id: staff, aal: "aal2" }, "select count(*)::int n from public.question_answer_keys")).rows[0].n).toBe(fx.length);
    await expectDenied(asUser(null, "select * from public.question_items"));
    await expectDenied(asUser(null, "select public.qb_progress()"));
    await expectDenied(asUser(null, "select public.qb_start_attempt('practice', 3, null, null)"));
  });
});

describe("private attempts", () => {
  it("hides one learner's attempts, items and answers from another, through tables and RPCs", async () => {
    const id = await start(A(), "practice", 3);
    const q0 = (await get(A(), id)).items[0].question_id as string;
    await answer(A(), id, 1, correctFor(q0));
    expect((await asUser(B(), "select * from public.quiz_attempts where id=$1", [id])).rows).toEqual([]);
    expect((await asUser(B(), "select * from public.quiz_attempt_items where attempt_id=$1", [id])).rows).toEqual([]);
    expect((await asUser(B(), "select * from public.quiz_answers where attempt_id=$1", [id])).rows).toEqual([]);
    expect((await asUser(B(), "select * from public.learner_question_stats")).rows).toEqual([]);
    await expect(get(B(), id)).rejects.toThrow(/attempt not found/);
    await expect(answer(B(), id, 2, correctFor(q0))).rejects.toThrow(/attempt not found/);
    await expect(rpc(B(), "select public.qb_set_flag($1,1,true)", [id])).rejects.toThrow(/attempt not found/);
    await expect(rpc(B(), "select public.qb_submit_attempt($1)", [id])).rejects.toThrow(/attempt not found/);
    await expect(rpc(B(), "select public.qb_discard_attempt($1)", [id])).rejects.toThrow(/attempt not found/);
    const list = (await rpc(B(), "select public.qb_list_attempts(50) as l")).l as any[];
    expect(list.map((x) => x.id)).not.toContain(id);
  });
});

describe("deterministic shuffling and scoring", () => {
  it("stores question and option orders that equal the TypeScript seeded order for the same seed", async () => {
    const id = await start(A(), "exam", 16);
    const seed = (await owner.query("select seed from public.quiz_attempts where id=$1", [id])).rows[0].seed as string;
    const items = (await owner.query("select position, question_id, option_order from public.quiz_attempt_items where attempt_id=$1 order by position", [id])).rows;
    expect(items.map((r) => r.question_id)).toEqual(seededOrder(fx.map((q) => q.id), seed));
    for (const r of items) expect(r.option_order).toEqual(seededOrder(fx.find((q) => q.id === r.question_id)!.options.map((o) => o.id), seed, r.question_id));
  });
  it("never changes which option is correct when options are shuffled", async () => {
    const id = await start(A(), "exam", 16);
    for (const i of (await get(A(), id)).items) {
      const q = fx.find((f) => f.id === i.question_id)!;
      const shown = i.options.map((o: any) => o.id).sort();
      expect(shown).toEqual(q.options.map((o) => o.id).sort());
    }
    await rpc(A(), "select public.qb_discard_attempt($1)", [id]);
  });
  it("scores an exam deterministically on the server: unanswered counts as incorrect", async () => {
    const id = await start(A(), "exam", 6);
    const items = (await get(A(), id)).items as any[];
    await answer(A(), id, 1, correctFor(items[0].question_id));
    await answer(A(), id, 2, correctFor(items[1].question_id));
    await answer(A(), id, 3, wrongFor(items[2].question_id));
    await answer(A(), id, 4, wrongFor(items[3].question_id));
    await answer(A(), id, 4, correctFor(items[3].question_id)); // changing an exam answer is allowed
    await answer(A(), id, 5, correctFor(items[4].question_id));
    await answer(A(), id, 5, null); // cleared again
    await rpc(A(), "select public.qb_set_flag($1,6,true)", [id]);
    const done = (await rpc(A(), "select public.qb_submit_attempt($1) as a", [id])).a as any;
    expect(done.status).toBe("completed");
    expect(done.summary).toMatchObject({ correct: 3, total: 6, answered: 4, flagged: 1, score_tenths: scoreTenths(3, 6) });
    expect(done.summary.score_tenths).toBe(500);
    expect(done.items.every((i: any) => i.feedback && i.revealed)).toBe(true);
    expect(done.items[4].feedback.is_correct).toBe(false);
    // Idempotent and final.
    const again = (await rpc(A(), "select public.qb_submit_attempt($1) as a", [id])).a as any;
    expect(again.summary).toEqual(done.summary);
    await expect(answer(A(), id, 5, correctFor(items[4].question_id))).rejects.toThrow(/no longer in progress/);
  });
  it("rounds half up with integer arithmetic (matches the TypeScript implementation)", async () => {
    for (const [c, t] of [[1, 3], [2, 3], [1, 6], [5, 8], [7, 16], [0, 5], [5, 5], [1, 16]] as [number, number][]) {
      const r = await rpc(A(), "select private.score_tenths($1,$2) as s", [c, t]).catch(async () => (await owner.query("select private.score_tenths($1,$2) as s", [c, t])).rows[0]);
      expect(r.s).toBe(scoreTenths(c, t));
    }
  });
});

describe("wire format parity with the application's zod schemas", () => {
  it("parses every function's real output (in progress, answered, completed)", async () => {
    const d = await createUser(uniqueEmail("wire"));
    const W = { id: d };
    const prog1 = (await rpc(W, "select public.qb_progress() as p")).p;
    expect(() => progressSchema.parse(prog1)).not.toThrow();
    const id = await start(W, "practice", 4);
    const a0 = await get(W, id);
    expect(() => attemptSchema.parse(a0)).not.toThrow();
    const fb = (await answer(W, id, 1, wrongFor(a0.items[0].question_id))).feedback;
    expect(fb.is_correct).toBe(false);
    const mid = await get(W, id);
    expect(() => attemptSchema.parse(mid)).not.toThrow();
    const done = (await rpc(W, "select public.qb_submit_attempt($1) as a", [id])).a;
    const parsed = attemptSchema.parse(done);
    expect(parsed.summary?.total).toBe(4);
    expect(parsed.items.every((i) => i.feedback !== null)).toBe(true);
    const listed = (await rpc(W, "select public.qb_list_attempts(20) as l")).l;
    expect(() => attemptListSchema.parse(listed)).not.toThrow();
    const prog2 = (await rpc(W, "select public.qb_progress() as p")).p;
    expect(() => progressSchema.parse(prog2)).not.toThrow();
  });
});

describe("resumption", () => {
  it("restores answers, flags, position and remaining time for the owner only", async () => {
    const id = await start(A(), "exam", 5, null, 30 * 60);
    const items = (await get(A(), id)).items as any[];
    await answer(A(), id, 2, correctFor(items[1].question_id));
    await rpc(A(), "select public.qb_set_flag($1,3,true)", [id]);
    await rpc(A(), "select public.qb_set_position($1,4)", [id]);
    const r = await get(A(), id);
    expect(r.status).toBe("in_progress");
    expect(r.last_position).toBe(4);
    expect(r.items[1].selected_option_id).toBe(correctFor(items[1].question_id));
    expect(r.items[2].flagged).toBe(true);
    expect(new Date(r.expires_at).getTime()).toBeGreaterThan(new Date(r.server_now).getTime());
    await expect(rpc(A(), "select public.qb_set_position($1,99)", [id])).rejects.toThrow(/invalid position/);
    const list = (await rpc(A(), "select public.qb_list_attempts(50) as l")).l as any[];
    expect(list.find((x) => x.id === id)).toMatchObject({ status: "in_progress", answered: 1 });
  });
  it("closes a timed exam server-side when time runs out and refuses late answers", async () => {
    const id = await start(A(), "exam", 3, null, 60);
    const items = (await get(A(), id)).items as any[];
    await answer(A(), id, 1, correctFor(items[0].question_id));
    await owner.query("update public.quiz_attempts set expires_at = now() - interval '1 second', started_at = now() - interval '2 minutes' where id=$1", [id]);
    await expect(answer(A(), id, 2, correctFor(items[1].question_id))).rejects.toThrow(/no longer in progress/);
    const r = await get(A(), id);
    expect(r.status).toBe("completed");
    expect(r.summary).toMatchObject({ timed_out: true, correct: 1, total: 3 });
  });
  it("limits unfinished attempts and allows discarding", async () => {
    const ids: string[] = [];
    await owner.query("update public.quiz_attempts set status='abandoned' where user_id=$1 and status='in_progress'", [bob]);
    for (let i = 0; i < 5; i++) ids.push(await startRaw(B(), "practice", 1));
    await expect(startRaw(B(), "practice", 1)).rejects.toThrow(/unfinished attempt/);
    await rpc(B(), "select public.qb_discard_attempt($1)", [ids[0]]);
    await startRaw(B(), "practice", 1);
  });
});

describe("validation", () => {
  it("rejects invalid modes, counts, time limits and options", async () => {
    await expect(start(A(), "study", 3)).rejects.toThrow(/invalid mode/);
    await expect(start(A(), "practice", 0)).rejects.toThrow(/question count/);
    await expect(start(A(), "practice", 101)).rejects.toThrow(/question count/);
    await expect(start(A(), "practice", 3, null, 600)).rejects.toThrow(/only available in exam mode/);
    await expect(start(A(), "exam", 3, null, 5)).rejects.toThrow(/1-240 minutes/);
    await expect(start(A(), "practice", 3, ["no-such-domain"])).rejects.toThrow(/no questions are available/);
    const id = await start(A(), "exam", 2);
    const first = (await get(A(), id)).items[0].question_id as string;
    const other = fx.find((q) => q.id !== first)!.options[0]!.id;
    await expect(answer(A(), id, 1, other)).rejects.toThrow(/does not belong/);
    await expect(answer(A(), id, 9, other)).rejects.toThrow(/no such question/);
  });
  it("filters by domain and caps the count at what is available", async () => {
    const id = await start(A(), "practice", 50, ["renal-metabolic"]);
    const a = await get(A(), id);
    expect(a.items.length).toBe(fx.filter((q) => q.domainSlug === "renal-metabolic").length);
    expect(a.items.every((i: any) => i.domain_slug === "renal-metabolic")).toBe(true);
  });
});

describe("statistics, progress and bookmarks", () => {
  it("records learner and aggregate statistics only for revealed answers", async () => {
    const c = await createUser(uniqueEmail("carol"));
    const C = { id: c };
    const id = await start(C, "practice", 2);
    const items = (await get(C, id)).items as any[];
    await answer(C, id, 1, correctFor(items[0].question_id));
    await answer(C, id, 2, wrongFor(items[1].question_id));
    const s = (await asUser(C, "select question_id, times_answered, times_correct, last_correct from public.learner_question_stats order by last_correct")).rows;
    expect(s).toHaveLength(2);
    expect(s.map((r) => r.last_correct)).toEqual([false, true]);
    const agg = (await owner.query("select times_answered, times_correct from public.question_stats where question_id = $1", [items[0].question_id])).rows[0];
    expect(agg.times_answered).toBeGreaterThanOrEqual(1);
    expect((await asUser(C, "select * from public.question_stats")).rows).toEqual([]);
    await rpc(C, "select public.qb_submit_attempt($1)", [id]);
    const p = (await rpc(C, "select public.qb_progress() as p")).p as any;
    expect(p.completed_attempts).toBe(1);
    expect(p.domains.reduce((n: number, d: any) => n + d.answered, 0)).toBe(2);
    expect(p.domains.reduce((n: number, d: any) => n + d.correct, 0)).toBe(1);
  });
  it("bookmarks visible questions only and feeds a bookmarked-only attempt", async () => {
    const d = await createUser(uniqueEmail("dave"));
    const D = { id: d };
    await rpc(D, "select public.qb_set_bookmark($1,true)", [fx[0]!.id]);
    await expect(rpc(D, "select public.qb_set_bookmark($1,true)", ["00000000-0000-4000-8000-00000000dead"])).rejects.toThrow(/not found/);
    const id = (await rpc(D, "select public.qb_start_attempt('practice', 10, null, null, true) as id")).id as string;
    const a = await get(D, id);
    expect(a.items).toHaveLength(1);
    expect(a.items[0].bookmarked).toBe(true);
    await rpc(D, "select public.qb_set_bookmark($1,false)", [fx[0]!.id]);
    expect(((await rpc(D, "select public.qb_progress() as p")).p as any).bookmarked).toBe(0);
  });
});

describe("withdrawn questions", () => {
  it("withholds a retired question from an in-progress attempt and voids it from the score", async () => {
    const e = await createUser(uniqueEmail("erin"));
    const E = { id: e };
    const id = await start(E, "exam", 3);
    const items = (await get(E, id)).items as any[];
    await answer(E, id, 1, correctFor(items[0].question_id));
    await owner.query("update public.question_items set retired_at = now() where id = any($1)", [[items[0].question_id, items[2].question_id]]);
    const mid = await get(E, id);
    expect(mid.items[2]).toMatchObject({ unavailable: true, stem: null, options: [] });
    expect(mid.items[0].stem).not.toBeNull(); // already answered: still shown so the learner can finish the attempt
    await expect(answer(E, id, 3, items[2].options[0].id)).rejects.toThrow(/no longer available/);
    await expect(answer(E, id, 1, correctFor(items[0].question_id))).rejects.toThrow(/no longer available/);
    const done = (await rpc(E, "select public.qb_submit_attempt($1) as a", [id])).a as any;
    expect(done.summary.total).toBe(2); // item 3 voided
    await owner.query("update public.question_items set retired_at = null");
  });
});

describe("clinical content gate (existing publication workflow is not weakened)", () => {
  let domainId: string;
  const clinical = async (over: Record<string, unknown> = {}) => {
    const code = `CLIN-${Math.random().toString(36).slice(2, 8)}`;
    const r = await owner.query(
      `insert into public.question_items (code, kind, status, origin, domain_id, stem, created_by, topic_id, reviewed_by, reviewed_at, approved_by, approved_at, published_at)
       values ($1,'clinical',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
      [code, over.status ?? "draft", over.origin ?? "ai_generated", domainId, JSON.stringify({ en: "A synthetic clinical-kind stem used only by the gate test." }), over.created_by ?? null,
        over.topic_id ?? null, over.reviewed_by ?? null, over.reviewed_at ?? null, over.approved_by ?? null, over.approved_at ?? null, over.published_at ?? null],
    );
    return r.rows[0].id as string;
  };
  const complete = async (q: string) => {
    const opts: string[] = [];
    for (let p = 1; p <= 4; p++) opts.push((await owner.query("insert into public.question_options (question_id, position, text) values ($1,$2,$3) returning id", [q, p, JSON.stringify({ en: `Option ${p}` })])).rows[0].id);
    await owner.query("insert into public.question_answer_keys (question_id, correct_option_id, rationale) values ($1,$2,$3)", [q, opts[0], JSON.stringify({ en: "r" })]);
    for (const o of opts) await owner.query("insert into public.question_explanations (option_id, question_id, explanation) values ($1,$2,$3)", [o, q, JSON.stringify({ en: "Because reasons." })]);
  };
  beforeAll(async () => { domainId = (await owner.query("select id from public.nursing_domains where slug='renal-metabolic'")).rows[0].id; });

  it("keeps clinical drafts invisible to learners, through RPCs and tables", async () => {
    const q = await clinical();
    await complete(q);
    const f = await createUser(uniqueEmail("frank"));
    const pool = (await rpc({ id: f }, "select public.qb_progress() as p")).p as any;
    expect(pool.domains.reduce((n: number, d: any) => n + d.available, 0)).toBe(fx.length); // fixtures only
    expect((await owner.query("select private.question_is_visible($1) v", [q])).rows[0].v).toBe(false);
    expect((await asUser({ id: f }, "select * from public.question_items where kind='clinical'")).rows).toEqual([]);
    await expect(rpc({ id: f }, "select public.qb_set_bookmark($1,true)", [q])).rejects.toThrow(/not found/);
  });
  it("refuses to publish a clinical question without approval, independent review and a published topic", async () => {
    const q = await clinical();
    await complete(q);
    const publish = (set: string, vals: unknown[] = []) => owner.query(`update public.question_items set status='published', ${set} where id=$1`, [q, ...vals]);
    await expect(publish("published_at = now()")).rejects.toThrow(/approval metadata/);
    await expect(publish("approved_at = now(), published_at = now()")).rejects.toThrow(/named approver/);
    await expect(publish("approved_at = now(), approved_by = $2, published_at = now()", [staff])).rejects.toThrow(/independent clinical review/);
    await expect(publish("approved_at = now(), approved_by = $2, published_at = now(), reviewed_at = now(), reviewed_by = $2", [staff])).rejects.toThrow(/clinical_reviewer role|differ from the author|published topic/);
    expect((await owner.query("select status from public.question_items where id=$1", [q])).rows[0].status).toBe("draft");
    await expect(clinical({ status: "published", approved_by: staff, approved_at: new Date(), published_at: new Date() })).rejects.toThrow();
  });
  it("makes a clinical question visible only with every safeguard in place (positive control)", async () => {
    const reviewer = await createUser(uniqueEmail("rev"));
    await grantRole(reviewer, "clinical_reviewer");
    const v = (await owner.query(`insert into public.topics (domain_id, slug, title, summary, kind, status, origin)
       values ($1,'gate-topic','{"en":"T"}','{"en":"S"}','clinical','approved','human') returning id`, [domainId])).rows[0].id;
    const ver = (await owner.query(`insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin, published_at)
       values ($1,1,'published','{}','{NE}','human',now()) returning id`, [v])).rows[0].id;
    await owner.query("update public.topics set published_version_id=$2, status='published' where id=$1", [v, ver]);
    const q = await clinical({ topic_id: v, origin: "human" });
    await complete(q);
    await owner.query("update public.question_items set status='published', reviewed_by=$2, reviewed_at=now(), approved_by=$2, approved_at=now(), published_at=now() where id=$1", [q, reviewer]);
    expect((await owner.query("select private.question_is_visible($1) v", [q])).rows[0].v).toBe(true);
    // Unpublishing the topic hides it again.
    await owner.query("update public.topics set published_version_id=null, status='archived' where id=$1", [v]);
    expect((await owner.query("select private.question_is_visible($1) v", [q])).rows[0].v).toBe(false);
  });
  it("freezes published questions: content cannot be edited in place", async () => {
    const fixture = fx[0]!;
    await expect(owner.query("update public.question_options set text='{\"en\":\"changed\"}' where id=$1", [fixture.options[0]!.id])).rejects.toThrow(/immutable/);
    await expect(owner.query("update public.question_answer_keys set correct_option_id=$2 where question_id=$1", [fixture.id, fixture.options[1]!.id])).rejects.toThrow(/immutable/);
    await expect(owner.query("update public.question_items set stem='{\"en\":\"A different stem that is long enough.\"}' where id=$1", [fixture.id])).rejects.toThrow(/immutable/);
    await expect(owner.query("delete from public.question_explanations where question_id=$1", [fixture.id])).rejects.toThrow(/immutable/);
  });
  it("refuses a demo_synthetic question that is not labelled as a synthetic fixture", async () => {
    const r = await owner.query(`insert into public.question_items (code, kind, status, domain_id, stem, source_note) values ('SYN-LBL','demo_synthetic','draft',$1,$2,'real clinical source') returning id`,
      [domainId, JSON.stringify({ en: "A long enough synthetic stem for the label test." })]);
    await complete(r.rows[0].id);
    await expect(owner.query("update public.question_items set status='published', approved_at=now(), published_at=now() where id=$1", [r.rows[0].id])).rejects.toThrow(/SYNTHETIC FIXTURE/);
  });
  it("hides every synthetic fixture again when the development setting is turned off", async () => {
    await owner.query("update public.app_settings set question_fixtures_visible = false");
    const g = await createUser(uniqueEmail("gina"));
    await expect(start({ id: g }, "practice", 3)).rejects.toThrow(/no questions are available/);
    await owner.query("update public.app_settings set environment = 'development', question_fixtures_visible = true");
  });
});
