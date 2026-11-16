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
import { loadCaseFixtures } from "../../src/lib/cases/fixtures";
import { loadSkillFixtures } from "../../src/lib/skills/fixtures";
import { loadMedicationFixtures } from "../../src/lib/medications/fixtures";

const fx = loadFixtures();
let failed = 0;
const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); if (!ok) failed++; };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

async function as(user: string | null, query: string): Promise<Row[]> {
  const claims = JSON.stringify(user ? { sub: user, role: "authenticated", aal: "aal1" } : { role: "anon" });
  return sql(`begin; set local role ${user ? "authenticated" : "anon"}; do $c$ begin perform set_config('request.jwt.claims', '${claims}', true); end $c$;\n${query}\n;commit;`);
}
async function fails(user: string | null, query: string, re: RegExp): Promise<boolean> {
  try { await as(user, query); return false; } catch (e) { return re.test((e as Error).message); }
}

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

    // --- study mode (migration 0008) ---------------------------------------------------------------------------------------
    const C = await mk("qb-live-c@example.test");
    const sidA = (await as(C, "select public.qb_start_attempt('practice', 4, null, null) as id"))[0]!.id as string;
    const s0 = (await as(C, `select public.qb_get_attempt('${sidA}') as a`))[0]!.a;
    const sq = (i: number) => fx.find((f) => f.id === s0.items[i].question_id)!;
    const wr = (q: (typeof fx)[number]) => q.options.find((o) => o.id !== q.correctOptionId)!.id;
    await as(C, `select public.qb_submit_answer('${sidA}', 1, '${wr(sq(0))}')`);
    await as(C, `select public.qb_submit_answer('${sidA}', 2, '${sq(1).correctOptionId}')`);
    const sch = await sql(`select question_id, box, (due_at <= now()) as due from public.learner_review_schedule where user_id='${C}' order by box`);
    check("Leitner: wrong answer -> box 1, due now; correct answer -> box 2, due later", sch.length === 2 && sch[0]!.box === 1 && sch[0]!.due === true && sch[1]!.box === 2 && sch[1]!.due === false);
    const ov = (await as(C, "select public.st_overview() as o"))[0]!.o;
    check("study overview counters (due 1, incorrect 1) and boxes [1,1,0,0,0]", ov.due === 1 && ov.incorrect === 1 && JSON.stringify(ov.boxes) === "[1,1,0,0,0]");
    await as(C, `select public.qb_discard_attempt('${sidA}')`);
    const rev = (await as(C, "select public.st_start_revision('incorrect', 10) as id"))[0]!.id as string;
    const rg = (await as(C, `select public.qb_get_attempt('${rev}') as a`))[0]!.a;
    check("revision set contains exactly the incorrectly answered question, with no key exposed", rg.items.length === 1 && rg.items[0].question_id === s0.items[0].question_id && !/correct_option_id|explanations|rationale/.test(JSON.stringify(rg)));
    check("another learner has an empty schedule, overview and history", (await as(B, "select * from public.learner_review_schedule")).length === 0
      && (await as(B, "select public.st_overview() as o"))[0]!.o.due === 0 && (await as(B, "select public.st_history(10) as h"))[0]!.h.length === 0);
    check("history shows the caller's revealed answers only", (await as(C, "select public.st_history(10) as h"))[0]!.h.length === 2);
    check("learner cannot write the schedule", await fails(C, "update public.learner_review_schedule set box = 5", /permission denied/));
    check("anon cannot call study functions", await fails(null, "select public.st_overview()", /permission denied/));
    check("unknown revision kind is rejected", await fails(C, "select public.st_start_revision('all', 5)", /invalid revision kind/));

    // --- case-based learning (migration 0009) ---------------------------------------------------------------------------
    await sql(readFileSync("supabase/seed_case_fixtures.sql", "utf8"));
    const cases = loadCaseFixtures();
    const c1 = cases[0]!;
    check("3 synthetic cases loaded; no clinical case exists", Number((await sql("select count(*)::int n from public.case_items where kind='demo_synthetic' and status='published'"))[0]!.n) === 3
      && Number((await sql("select count(*)::int n from public.case_items where kind='clinical'"))[0]!.n) === 0);
    check("learner sees the 3 cases through cs_list", (await as(B, "select public.cs_list() as l"))[0]!.l.length === 3);
    for (const t of ["case_items", "case_steps", "case_step_options", "case_option_keys"]) check(`learner sees 0 rows in ${t}`, (await as(B, `select 1 from public.${t} limit 1`)).length === 0);
    check("learner cannot forge a case step", await fails(B, "insert into public.case_attempt_steps (attempt_id, position, user_id, option_id, points) select gen_random_uuid(), 1, auth.uid(), id, 2 from public.case_step_options limit 1", /permission denied/));
    const cd = (await sql(`insert into public.case_items (code, kind, status, origin, domain_id, title, vignette) values ('LIVE-CASE-DRAFT','clinical','draft','ai_generated','${dom}','{"en":"Live gate test"}','{"en":"Unpublished clinical-kind case for the live gate test."}') returning id`))[0]!.id as string;
    check("unpublished clinical case cannot be started or read", await fails(B, `select public.cs_start('${cd}')`, /case not found/) && (await as(B, `select id from public.case_items where id='${cd}'`)).length === 0);
    let cg = false;
    try { await sql(`update public.case_items set status='published', approved_at=now(), published_at=now() where id='${cd}'`); } catch (e) { cg = /named approver|independent clinical review|invalid case structure/.test((e as Error).message); }
    check("guard rejects publishing the clinical case", cg);
    await sql(`delete from public.case_items where id='${cd}'`);
    const att = (await as(B, `select public.cs_start('${c1.id}') as id`))[0]!.id as string;
    const g0 = (await as(B, `select public.cs_get('${att}') as a`))[0]!.a;
    check("in-progress case exposes no points, scope, feedback or later steps", !/points|scope|feedback|next_position/.test(JSON.stringify(g0)) && !JSON.stringify(g0).includes(c1.steps[1]!.info.en!));
    let v = (await as(B, `select public.cs_choose('${att}', 1, '${c1.steps[0]!.options.find((o) => o.points === 2)!.id}') as a`))[0]!.a;
    check("committed decision reveals feedback and follows the branch", v.trail.length === 1 && v.trail[0].points === 2 && v.current.position === 2);
    check("resume returns the same attempt", (await as(B, `select public.cs_start('${c1.id}') as id`))[0]!.id === att);
    check("another learner cannot read or play that attempt", await fails(A, `select public.cs_get('${att}')`, /attempt not found/) && await fails(A, `select public.cs_choose('${att}', 2, '${c1.steps[1]!.options[0]!.id}')`, /attempt not found/));
    v = (await as(B, `select public.cs_choose('${att}', 2, '${c1.steps[1]!.options.find((o) => o.points === 2)!.id}') as a`))[0]!.a;
    v = (await as(B, `select public.cs_choose('${att}', 4, '${c1.steps[3]!.options.find((o) => o.points === 2)!.id}') as a`))[0]!.a;
    check("the debrief (learning points, scope counts) arrives only with the completed summary", v.status === "completed" && Array.isArray(v.summary.debrief.learning_points.en) && Object.keys(v.summary.debrief.scope_counts).length > 0 && !JSON.stringify(g0).includes("learning_points"));
    check("an in-progress case exposes the current readings but no consequences", g0.current.observations.length === 3 && !JSON.stringify(g0).includes(c1.steps[0]!.options[0]!.consequence!.en!));
    check("best path scores 100% (6 of 6 points over 3 decisions)", v.status === "completed" && v.summary.points === 6 && v.summary.max_points === 6 && v.summary.score_tenths === 1000);
    check("a committed decision cannot be repeated", await fails(B, `select public.cs_choose('${att}', 4, '${c1.steps[3]!.options[0]!.id}')`, /no longer in progress/));
    check("anon cannot call case functions", await fails(null, "select public.cs_list()", /permission denied/));


    // --- skills library (migration 0012) ----------------------------------------------------------------------------------
    await sql(readFileSync("supabase/seed_skill_fixtures.sql", "utf8"));
    const sk = loadSkillFixtures();
    check("4 synthetic skills loaded; no clinical skill exists", Number((await sql("select count(*)::int n from public.skill_items where kind='demo_synthetic' and status='published'"))[0]!.n) === 4
      && Number((await sql("select count(*)::int n from public.skill_items where kind='clinical'"))[0]!.n) === 0);
    check("learner sees the 4 skills through sk_list", (await as(B, "select public.sk_list(null,null,false) as l"))[0]!.l.length === 4);
    check("search and category filters work", (await as(B, "select public.sk_list('scanner',null,false) as l"))[0]!.l.length === 1 && (await as(B, "select public.sk_list(null,'assessment',false) as l"))[0]!.l.length === 1);
    for (const t of ["skill_items", "skill_checklist_items", "skill_revisions"]) check(`learner sees 0 rows in ${t}`, (await as(B, `select 1 from public.${t} limit 1`)).length === 0);
    check("learner cannot write a session or an observed assessment", await fails(B, `insert into public.skill_sessions (user_id, skill_id, skill_version, mode) values (auth.uid(), '${sk[0]!.id}', 1, 'observed_assessment')`, /permission denied/));
    const skd = (await sql(`insert into public.skill_items (code, kind, status, origin, category, title, summary, objectives, evidence_status, license_status) values ('LIVE-SKILL-DRAFT','clinical','draft','ai_generated','assessment','{"en":"Live gate test"}','{"en":"Unpublished clinical-kind skill for the live gate test."}','{"en":["x"]}','partial','permission_required') returning id`))[0]!.id as string;
    check("unpublished clinical skill cannot be started, bookmarked or read", await fails(B, `select public.sk_start_session('${skd}')`, /skill not found/) && await fails(B, `select public.sk_get('LIVE-SKILL-DRAFT')`, /skill not found/) && (await as(B, `select id from public.skill_items where id='${skd}'`)).length === 0);
    let sg = false;
    try { await sql(`update public.skill_items set status='published', approved_at=now(), published_at=now() where id='${skd}'`); } catch (e) { sg = /named approver|independent clinical review|invalid skill structure/.test((e as Error).message); }
    check("guard rejects publishing the clinical skill", sg);
    await sql(`delete from public.skill_items where id='${skd}'`);
    const sid = (await as(B, `select public.sk_start_session('${sk[0]!.id}') as id`))[0]!.id as string;
    await as(B, `select public.sk_mark('${sid}','${sk[0]!.checklist[0]!.id}','done')`);
    const sdone = (await as(B, `select public.sk_complete_session('${sid}') as s`))[0]!.s;
    check("self-study completion records counts only, no verdict", sdone.summary.items_done === 1 && sdone.summary.items_total === 7 && !/passed|competent|certified/i.test(JSON.stringify(sdone)));
    check("another learner cannot read or alter that session", await fails(A, `select public.sk_get_session('${sid}')`, /session not found/) && await fails(A, `select public.sk_mark('${sid}','${sk[0]!.checklist[1]!.id}','done')`, /session not found/));
    check("anon cannot call skills functions", await fails(null, "select public.sk_list(null,null,false)", /permission denied/));

    // --- medication reference (migration 0013) ---------------------------------------------------------------------------
    await sql(readFileSync("supabase/seed_medication_fixtures.sql", "utf8"));
    const md = loadMedicationFixtures();
    check("4 synthetic medications loaded; no clinical medication exists", Number((await sql("select count(*)::int n from public.medication_items where kind='demo_synthetic' and status='published'"))[0]!.n) === 4
      && Number((await sql("select count(*)::int n from public.medication_items where kind='clinical'"))[0]!.n) === 0);
    check("learner sees the 4 medications through md_list; search and high-alert filter work", (await as(B, "select public.md_list(null,null,false,false) as l"))[0]!.l.length === 4
      && (await as(B, "select public.md_list('examplol',null,false,false) as l"))[0]!.l.length === 1 && (await as(B, "select public.md_list(null,null,false,true) as l"))[0]!.l.length === 3);
    for (const t of ["medication_items", "medication_monitoring_items", "medication_revisions"]) check(`learner sees 0 rows in ${t}`, (await as(B, `select 1 from public.${t} limit 1`)).length === 0);
    let dg = false;
    try { await sql(`insert into public.medication_items (code, kind, category, name, drug_class, summary) values ('LIVE-DOSE','clinical','anti-infectives','{"en":"Dose test"}','{"en":"Class"}','{"en":"Give 5 mg to the patient as ordered."}')`); } catch (e) { dg = /must not contain/.test((e as Error).message); }
    check("the no-dosing guard rejects a dose in a medication entry", dg);
    const mdd = (await sql(`insert into public.medication_items (code, kind, status, origin, category, name, drug_class, summary, evidence_status, license_status) values ('LIVE-MED-DRAFT','clinical','draft','ai_generated','anti-infectives','{"en":"Live gate test"}','{"en":"Class"}','{"en":"Unpublished clinical-kind entry for the live gate test."}','partial','permission_required') returning id`))[0]!.id as string;
    check("unpublished clinical medication cannot be bookmarked or read", await fails(B, `select public.md_set_bookmark('${mdd}', true)`, /medication not found/) && await fails(B, `select public.md_get('LIVE-MED-DRAFT')`, /medication not found/));
    let mg = false;
    try { await sql(`update public.medication_items set status='published', approved_at=now(), published_at=now() where id='${mdd}'`); } catch (e) { mg = /named approver|independent clinical review|invalid medication structure/.test((e as Error).message); }
    check("guard rejects publishing the clinical medication", mg);
    await sql(`delete from public.medication_items where id='${mdd}'`);
    await as(B, `select public.md_set_bookmark('${md[0]!.id}', true)`);
    check("bookmarks are per learner", (await as(B, "select public.md_list(null,null,true,false) as l"))[0]!.l.length === 1 && (await as(A, "select public.md_list(null,null,true,false) as l"))[0]!.l.length === 0);
    check("anon cannot call medication functions", await fails(null, "select public.md_list(null,null,false,false)", /permission denied/));

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
