/**
 * Live verification of the question bank against the approved DEV project (pinned in mgmt.ts).
 * Impersonates API roles inside one transaction per call (SET LOCAL ROLE + JWT claims, as PostgREST does), using two temporary
 * accounts (qb-live-*@example.test) that are deleted at the end. Loads the 16 synthetic fixtures and turns fixture visibility on
 * for this DEVELOPMENT project only. Never touches Auth settings or the Turnstile secret, and never imports clinical content.
 */
import { readFileSync } from "node:fs";
import { DEV_REF, REF, sql } from "./mgmt";
import { loadFixtures } from "../../src/lib/question-bank/fixtures";
import { seededOrder } from "../../src/lib/question-bank/shuffle";

const fx = loadFixtures();
let failed = 0;
const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); if (!ok) failed++; };
type Row = Record<string, any>;

async function as(user: string | null, query: string): Promise<Row[]> {
  const claims = JSON.stringify(user ? { sub: user, role: "authenticated", aal: "aal1" } : { role: "anon" });
  return sql(`begin; set local role ${user ? "authenticated" : "anon"}; do $c$ begin perform set_config('request.jwt.claims', '${claims}', true); end $c$;\n${query}\n;commit;`);
}
async function fails(user: string | null, query: string, re: RegExp): Promise<boolean> {
  try { await as(user, query); return false; } catch (e) { return re.test((e as Error).message); }
}
const lit = (v: string) => `'${v.replace(/'/g, "''")}'`;

(async () => {
  if (REF !== DEV_REF) throw new Error("refusing: not the approved dev project");
  const proj = (await sql("select current_database() d"))[0]!;
  console.log("target:", REF, "(icu-nursing-dev)", proj.d);

  // --- fixtures (development only) ---------------------------------------------------------------------------------------
  const env = (await sql("select environment, question_fixtures_visible from public.app_settings"))[0]!;
  console.log("app_settings before:", env);
  await sql(readFileSync("supabase/seed_question_fixtures.sql", "utf8"));
  const n = Number((await sql("select count(*)::int n from public.question_items where kind='demo_synthetic' and status='published'"))[0]!.n);
  check("16 synthetic fixtures loaded and published (kind demo_synthetic)", n === 16, String(n));
  check("no clinical question exists in the database", Number((await sql("select count(*)::int n from public.question_items where kind='clinical'"))[0]!.n) === 0);

  // Visibility must be impossible while the database is not marked development.
  await sql("update public.app_settings set environment='production', question_fixtures_visible=false");
  let blocked = false;
  try { await sql("update public.app_settings set question_fixtures_visible=true"); } catch (e) { blocked = /app_settings_fixtures_dev_only/.test((e as Error).message); }
  check("fixture visibility cannot be enabled while environment = production (CHECK constraint)", blocked);

  // --- two temporary learners ------------------------------------------------------------------------------------------------
  await sql("delete from auth.users where email like 'qb-live-%@example.test'");
  const mk = async (e: string) => (await sql(`insert into auth.users (id, email, raw_user_meta_data, aud, role) values (gen_random_uuid(), '${e}', '{}', 'authenticated', 'authenticated') returning id`))[0]!.id as string;
  const A = await mk("qb-live-a@example.test"), B = await mk("qb-live-b@example.test");
  try {
    check("fixtures hidden from learners while the setting is off", (await as(A, "select public.qb_progress() as p"))[0]!.p.synthetic_fixtures === false);
    await sql("update public.app_settings set environment='development', question_fixtures_visible=true");
    const prog = (await as(A, "select public.qb_progress() as p"))[0]!.p;
    check("fixtures visible to learners on the development database after the owner enables them", prog.synthetic_fixtures === true && prog.domains.reduce((s: number, d: Row) => s + d.available, 0) === 16);

    // --- clinical drafts cannot be read -------------------------------------------------------------------------------------
    const dom = (await sql("select id from public.nursing_domains where slug='renal-metabolic'"))[0]!.id;
    const q = (await sql(`insert into public.question_items (code, kind, status, origin, domain_id, stem) values ('LIVE-CLIN-DRAFT','clinical','draft','ai_generated','${dom}','{"en":"Live gate test: unpublished clinical-kind question."}') returning id`))[0]!.id as string;
    check("clinical draft cannot be read from the tables by a learner", (await as(A, `select id from public.question_items where id='${q}'`)).length === 0);
    check("clinical draft is not visible to the gate", (await sql(`select private.question_is_visible('${q}') v`))[0]!.v === false);
    check("clinical draft cannot be bookmarked or served", await fails(A, `select public.qb_set_bookmark('${q}', true)`, /not found/));
    let guard = false;
    try { await sql(`update public.question_items set status='published', approved_at=now(), published_at=now() where id='${q}'`); } catch (e) { guard = /named approver|independent clinical review|exactly 4 options/.test((e as Error).message); }
    check("guard trigger rejects publishing the clinical draft", guard);
    await sql(`delete from public.question_items where id='${q}'`);

    // --- table access ---------------------------------------------------------------------------------------------------------
    for (const t of ["question_items", "question_options", "question_answer_keys", "question_explanations", "question_stats"])
      check(`learner sees 0 rows in ${t}`, (await as(A, `select 1 from public.${t} limit 1`)).length === 0);
    check("learner cannot write question content", await fails(A, "update public.question_answer_keys set rationale = rationale", /permission denied/));
    check("learner cannot forge an attempt row", await fails(A, "insert into public.quiz_attempts (user_id, mode, seed, question_count) values (auth.uid(), 'exam', 'abcdefgh', 1)", /permission denied/));
    check("anon cannot call qb functions", await fails(null, "select public.qb_progress()", /permission denied/));

    // --- secrecy, scoring, privacy ---------------------------------------------------------------------------------------
    const idA = (await as(A, "select public.qb_start_attempt('practice', 16, null, null) as id"))[0]!.id as string;
    const a0 = (await as(A, `select public.qb_get_attempt('${idA}') as a`))[0]!.a;
    const body = JSON.stringify(a0);
    check("unanswered practice attempt exposes no key, rationale or explanation", !/correct_option_id|explanations|rationale/.test(body) && a0.items.every((i: Row) => i.feedback === null));
    const seed = (await sql(`select seed from public.quiz_attempts where id='${idA}'`))[0]!.seed as string;
    check("question order equals the TypeScript seeded order", JSON.stringify(a0.items.map((i: Row) => i.question_id)) === JSON.stringify(seededOrder(fx.map((x) => x.id), seed)));
    const q1 = fx.find((f) => f.id === a0.items[0].question_id)!;
    const wrong = q1.options.find((o) => o.id !== q1.correctOptionId)!.id;
    const r1 = (await as(A, `select public.qb_submit_answer('${idA}', 1, '${wrong}') as r`))[0]!.r;
    check("practice answer reveals feedback for that question only", r1.feedback.is_correct === false && r1.feedback.correct_option_id === q1.correctOptionId);
    check("practice answer is final", await fails(A, `select public.qb_submit_answer('${idA}', 1, '${q1.correctOptionId}')`, /already been answered/));
    check("another learner cannot read, answer or submit the attempt", (await as(B, `select * from public.quiz_attempts where id='${idA}'`)).length === 0
      && await fails(B, `select public.qb_get_attempt('${idA}')`, /attempt not found/) && await fails(B, `select public.qb_submit_attempt('${idA}')`, /attempt not found/));

    const idE = (await as(A, "select public.qb_start_attempt('exam', 4, null, 600) as id"))[0]!.id as string;
    const e0 = (await as(A, `select public.qb_get_attempt('${idE}') as a`))[0]!.a;
    const qa = fx.find((f) => f.id === e0.items[0].question_id)!, qb = fx.find((f) => f.id === e0.items[1].question_id)!;
    await as(A, `select public.qb_submit_answer('${idE}', 1, '${qa.correctOptionId}')`);
    await as(A, `select public.qb_submit_answer('${idE}', 2, '${qb.correctOptionId}')`);
    await as(A, `select public.qb_submit_answer('${idE}', 2, '${qb.options.find((o) => o.id !== qb.correctOptionId)!.id}')`);
    const own = await as(A, `select is_correct, revealed_at from public.quiz_answers where attempt_id='${idE}'`);
    check("exam answers carry no correctness before submission (own rows)", own.length === 2 && own.every((r) => r.is_correct === null && r.revealed_at === null));
    const done = (await as(A, `select public.qb_submit_attempt('${idE}') as a`))[0]!.a;
    check("server scores the exam: 1 of 4 correct = 25.0%", done.summary.correct === 1 && done.summary.total === 4 && done.summary.score_tenths === 250);
    check("completed attempt reveals every explanation", done.items.every((i: Row) => i.feedback && Object.keys(i.feedback.explanations).length === 4));
    check("completed attempt is final", await fails(A, `select public.qb_submit_answer('${idE}', 3, '${qa.options[0]!.id}')`, /no longer in progress/));

    // --- clean up test data ------------------------------------------------------------------------------------------------
  } finally {
    await sql("delete from auth.users where email like 'qb-live-%@example.test'");
    await sql("delete from public.question_stats");
  }
  const left = (await sql("select (select count(*) from auth.users where email like 'qb-live-%') u, (select count(*) from public.quiz_attempts) a, (select count(*) from public.learner_question_stats) s"))[0]!;
  check("temporary test accounts and their attempts were removed", Number(left.u) === 0 && Number(left.a) === 0 && Number(left.s) === 0);
  console.log("app_settings after:", (await sql("select environment, question_fixtures_visible from public.app_settings"))[0]);
  console.log(failed ? `\n${failed} check(s) FAILED` : "\nall live checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
