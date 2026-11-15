/* eslint-disable @typescript-eslint/no-explicit-any -- JSON payloads from PostgREST/RPC are asserted structurally */
/**
 * ISOLATED STACK ONLY (LIVE_TARGET=isolated): real Auth flows through email (Mailpit), session persistence, and the exact
 * HTTP transport the app uses (supabase-js -> PostgREST) for the question bank, study and case functions, including raw PostgREST
 * requests that try to read answer keys, write tables or open another learner's attempt. Skipped on the hosted dev project.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ISOLATED } from "../../scripts/live/target";
import { PASSWORD, PROJECT_URL, cleanup, emailFor, mailLink, makeUser, newClient, signIn, sql } from "./helpers";
import { loadFixtures } from "../../src/lib/question-bank/fixtures";
import { loadCaseFixtures } from "../../src/lib/cases/fixtures";
import { loadSkillFixtures } from "../../src/lib/skills/fixtures";
import { loadMedicationFixtures } from "../../src/lib/medications/fixtures";

const ANON = process.env.LIVE_ANON_KEY ?? "";
const fx = loadFixtures();
const cases = loadCaseFixtures();
const skills = loadSkillFixtures();
const medications = loadMedicationFixtures();
const ids: string[] = [];

const rest = (path: string, token?: string, init: RequestInit = {}) =>
  fetch(`${PROJECT_URL}/rest/v1${path}`, { ...init, headers: { apikey: ANON, Authorization: `Bearer ${token ?? ANON}`, "Content-Type": "application/json", ...(init.headers as Record<string, string>) } });
const tokenOf = async (c: Awaited<ReturnType<typeof signIn>>) => (await c.auth.getSession()).data.session!.access_token;

const follow = (u: string) => fetch(u, { redirect: "manual" });

describe.skipIf(!ISOLATED)("isolated stack: auth flows, sessions and the supabase-js / PostgREST transport", () => {
  let a: { email: string; id: string }, b: { email: string; id: string };

  beforeAll(async () => {
    await sql(readFileSync("supabase/seed_question_fixtures.sql", "utf8"));
    await sql(readFileSync("supabase/seed_case_fixtures.sql", "utf8"));
    await sql(readFileSync("supabase/seed_skill_fixtures.sql", "utf8"));
    await sql(readFileSync("supabase/seed_medication_fixtures.sql", "utf8"));
    await sql("update public.app_settings set environment='development', question_fixtures_visible=true");
    a = await makeUser("iso-a", "Isolated A");
    b = await makeUser("iso-b", "Isolated B");
    ids.push(a.id, b.id);
  });
  afterAll(async () => { await cleanup(ids); });

  it("sign-up requires email confirmation: unconfirmed sign-in is refused until the emailed link is followed", async () => {
    const email = emailFor("signup");
    const c = newClient();
    const up = await c.auth.signUp({ email, password: PASSWORD });
    expect(up.error).toBeNull();
    expect(up.data.session).toBeNull();
    if (up.data.user) ids.push(up.data.user.id);
    expect((await newClient().auth.signInWithPassword({ email, password: PASSWORD })).error?.code).toBe("email_not_confirmed");
    const link = await mailLink(email, "verify");
    const r = await follow(link);
    expect([302, 303]).toContain(r.status);
    const ok = await newClient().auth.signInWithPassword({ email, password: PASSWORD });
    expect(ok.error).toBeNull();
    const roles = await sql<{ role: string }>(`select role from public.user_roles where user_id='${up.data.user!.id}'`);
    expect(roles.map((x) => x.role)).toEqual(["learner"]);
  });

  it("password reset by email: the recovery link signs in, sets a new password, and the old one stops working", async () => {
    const c = newClient();
    expect((await c.auth.resetPasswordForEmail(a.email)).error).toBeNull();
    const link = await mailLink(a.email, "verify");
    const r = await follow(link);
    const loc = r.headers.get("location") ?? "";
    expect([302, 303]).toContain(r.status);
    const frag = new URLSearchParams(loc.split("#")[1] ?? "");
    expect(frag.get("access_token")).toBeTruthy();
    const c2 = newClient();
    expect((await c2.auth.setSession({ access_token: frag.get("access_token")!, refresh_token: frag.get("refresh_token")! })).error).toBeNull();
    const next = "A-brand-new-strong-password-9";
    expect((await c2.auth.updateUser({ password: next })).error).toBeNull();
    expect((await newClient().auth.signInWithPassword({ email: a.email, password: PASSWORD })).error?.code).toBe("invalid_credentials");
    expect((await newClient().auth.signInWithPassword({ email: a.email, password: next })).error).toBeNull();
    await sql(`update auth.users set encrypted_password = (select encrypted_password from auth.users where id='${b.id}') where id='${a.id}'`); // restore a known password for later tests
  });

  it("sessions persist in storage across client instances, refresh, and end on sign-out", async () => {
    const storage: Record<string, string> = {};
    const c1 = newClient(storage);
    expect((await c1.auth.signInWithPassword({ email: b.email, password: PASSWORD })).error).toBeNull();
    const c2 = newClient(storage); // a "new page load" sharing the same storage
    const s = (await c2.auth.getSession()).data.session;
    expect(s?.user.id).toBe(b.id);
    const refreshed = await c2.auth.refreshSession();
    expect(refreshed.error).toBeNull();
    expect(refreshed.data.session?.access_token).not.toBe(s?.access_token);
    expect((await c2.auth.getUser()).data.user?.id).toBe(b.id);
    await c2.auth.signOut();
    expect((await newClient(storage).auth.getSession()).data.session).toBeNull();
  });

  it("supabase-js RPC transport: question bank, study and cases work end to end for a signed-in learner", async () => {
    const c = await signIn(b.email);
    const prog = await c.rpc("qb_progress");
    expect(prog.error).toBeNull();
    expect((prog.data as any).synthetic_fixtures).toBe(true);
    const start = await c.rpc("qb_start_attempt", { p_mode: "practice", p_count: 4 });
    expect(start.error).toBeNull();
    const attempt = (await c.rpc("qb_get_attempt", { p_attempt: start.data })).data as any;
    expect(attempt.items).toHaveLength(4);
    const q = fx.find((f) => f.id === attempt.items[0].question_id)!;
    const wrong = q.options.find((o) => o.id !== q.correctOptionId)!.id;
    const ans = await c.rpc("qb_submit_answer", { p_attempt: start.data, p_position: 1, p_option: wrong });
    expect(ans.error).toBeNull();
    expect((ans.data as any).feedback).toMatchObject({ is_correct: false, correct_option_id: q.correctOptionId });
    const study = (await c.rpc("st_overview")).data as any;
    expect(study).toMatchObject({ due: 1, incorrect: 1 });
    const rev = await c.rpc("st_start_revision", { p_kind: "incorrect", p_count: 5 });
    expect(rev.error).toBeNull();
    const list = (await c.rpc("cs_list")).data as any[];
    expect(list).toHaveLength(3);
    const att = (await c.rpc("cs_start", { p_case: cases[0]!.id })).data as string;
    const step = cases[0]!.steps[0]!;
    const done = await c.rpc("cs_choose", { p_attempt: att, p_position: 1, p_option: step.options.find((o) => o.points === 2)!.id });
    expect(done.error).toBeNull();
    expect((done.data as any).trail[0].points).toBe(2);
  });

  it("skills library over supabase-js and raw PostgREST: self-study ticks persist, tables are closed, nothing is verdict-like", async () => {
    const c = await signIn(a.email);
    const tok = await tokenOf(c);
    expect(((await c.rpc("sk_list")).data as any[]).map((x) => x.code).sort()).toEqual(skills.map((x) => x.code).sort());
    const s = skills[0]!;
    const sid = (await c.rpc("sk_start_session", { p_skill: s.id })).data as string;
    expect((await c.rpc("sk_mark", { p_session: sid, p_item: s.checklist[0]!.id, p_result: "done" })).error).toBeNull();
    const fin = await c.rpc("sk_complete_session", { p_session: sid });
    expect(fin.error).toBeNull();
    expect((fin.data as any).summary).toMatchObject({ items_total: 7, items_done: 1 });
    expect(JSON.stringify(fin.data)).not.toMatch(/passed|competent|certified/i);
    // another learner cannot see or alter it
    const other = await signIn(b.email);
    expect((await other.rpc("sk_get_session", { p_session: sid })).error?.message).toMatch(/session not found/);
    // tables are closed to learners; no writes
    for (const t of ["skill_items", "skill_checklist_items", "skill_revisions"]) {
      const r = await rest(`/${t}?select=*`, tok);
      expect(r.status === 200 ? await r.json() : []).toEqual([]);
    }
    const w = await rest("/skill_sessions", tok, { method: "POST", body: JSON.stringify({ skill_id: s.id, skill_version: 1, user_id: a.id, mode: "observed_assessment" }) });
    expect(w.status).toBeGreaterThanOrEqual(400);
    expect((await rest("/rpc/sk_list", undefined, { method: "POST", body: "{}" })).status).toBeGreaterThanOrEqual(400); // anonymous
  });

  it("medication reference over supabase-js and raw PostgREST: search and bookmarks work, tables are closed, no dosing content is stored", async () => {
    const c = await signIn(a.email);
    const tok = await tokenOf(c);
    expect(((await c.rpc("md_list")).data as any[]).map((x) => x.code).sort()).toEqual(medications.map((x) => x.code).sort());
    expect(((await c.rpc("md_list", { p_query: "examplol" })).data as any[]).length).toBe(1);
    expect((await c.rpc("md_set_bookmark", { p_med: medications[0]!.id, p_on: true })).error).toBeNull();
    expect(((await c.rpc("md_list", { p_bookmarked: true })).data as any[]).length).toBe(1);
    const other = await signIn(b.email);
    expect(((await other.rpc("md_list", { p_bookmarked: true })).data as any[]).length).toBe(0);
    for (const t of ["medication_items", "medication_monitoring_items", "medication_revisions", "medication_bookmarks"]) {
      const r = await rest(`/${t}?select=*`, tok);
      expect(r.status === 200 ? (await r.json()).length : 0).toBe(t === "medication_bookmarks" ? 1 : 0);
    }
    expect((await rest("/medication_items", tok, { method: "POST", body: JSON.stringify({ code: "HACK-001", kind: "clinical" }) })).status).toBeGreaterThanOrEqual(400);
    expect((await rest("/rpc/md_list", undefined, { method: "POST", body: "{}" })).status).toBeGreaterThanOrEqual(400);
    await expect(sql(`insert into public.medication_items (code, kind, category, name, drug_class, summary) values ('DOSE-LIVE','clinical','anti-infectives','{"en":"Dose test"}','{"en":"Class"}','{"en":"Give 5 mg to the patient as ordered."}')`)).rejects.toThrow(/must not contain/);
  });

  it("answer-key and scoring secrecy over real PostgREST requests", async () => {
    const c = await signIn(b.email);
    const tok = await tokenOf(c);
    const att = (await c.rpc("qb_start_attempt", { p_mode: "exam", p_count: 5 })).data as string;
    const res = await rest("/rpc/qb_get_attempt", tok, { method: "POST", body: JSON.stringify({ p_attempt: att }) });
    const raw = await res.text();
    expect(res.status).toBe(200);
    expect(raw).not.toMatch(/correct_option_id|rationale|explanations/);
    for (const f of fx) { expect(raw).not.toContain(f.rationale.en!); for (const o of f.options) expect(raw).not.toContain(o.explanation.en!); }
    for (const t of ["question_answer_keys", "question_explanations", "question_options", "question_items", "question_stats", "case_option_keys", "case_step_options", "case_steps", "case_items"]) {
      const r = await rest(`/${t}?select=*`, tok);
      expect(r.status, t).toBe(200);
      expect(await r.json(), t).toEqual([]);
    }
    const first = ((await c.rpc("qb_get_attempt", { p_attempt: att })).data as any).items[0];
    await c.rpc("qb_submit_answer", { p_attempt: att, p_position: 1, p_option: first.options[0].id });
    const mine = await (await rest(`/quiz_answers?attempt_id=eq.${att}&select=is_correct,revealed_at`, tok)).json();
    expect(mine).toEqual([{ is_correct: null, revealed_at: null }]); // exam correctness is hidden even in the learner's own rows
    const inProgress = (await rest("/rpc/cs_get", tok, { method: "POST", body: JSON.stringify({ p_attempt: (await c.rpc("cs_start", { p_case: cases[1]!.id })).data }) }));
    expect(await inProgress.text()).not.toMatch(/points|scope|feedback|next_position/);
  });

  it("write attempts over PostgREST are refused, and another learner's attempt is invisible and untouchable", async () => {
    const ca = await signIn(a.email, "A-brand-new-strong-password-9").catch(() => signIn(a.email));
    const cb = await signIn(b.email);
    const [ta, tb] = [await tokenOf(ca), await tokenOf(cb)];
    const att = (await cb.rpc("qb_start_attempt", { p_mode: "practice", p_count: 2 })).data as string;
    for (const [m, p, body] of [["POST", "/quiz_attempts", { user_id: a.id, mode: "exam", seed: "abcdefgh", question_count: 1 }], ["PATCH", `/quiz_attempts?id=eq.${att}`, { score_tenths: 1000 }],
      ["DELETE", `/quiz_attempts?id=eq.${att}`, null], ["POST", "/question_items", { code: "HACK-1", kind: "clinical", domain_id: "00000000-0000-4000-8000-000000000001", stem: { en: "A forged stem that is long enough." } }],
      ["PATCH", "/question_answer_keys?question_id=eq.00000000-0000-4000-8000-000000000001", { rationale: { en: "x" } }], ["POST", "/learner_review_schedule", { question_id: fx[0]!.id }], ["POST", "/case_attempt_steps", { points: 2 }]] as const) {
      const r = await rest(p, tb, { method: m, body: body ? JSON.stringify(body) : undefined, headers: { Prefer: "return=representation" } });
      expect([401, 403, 404], `${m} ${p}`).toContain(r.status);
      expect(r.status === 404 || /42501|permission denied|row-level security/i.test(await r.text()), `${m} ${p}`).toBe(true);
    }
    expect(await (await rest(`/quiz_attempts?id=eq.${att}`, ta)).json()).toEqual([]);
    const probe = await rest("/rpc/qb_get_attempt", ta, { method: "POST", body: JSON.stringify({ p_attempt: att }) });
    expect(probe.status).toBeGreaterThanOrEqual(400);
    expect(await probe.text()).toMatch(/attempt not found/);
    expect((await rest("/rpc/qb_submit_answer", ta, { method: "POST", body: JSON.stringify({ p_attempt: att, p_position: 1, p_option: null }) })).status).toBeGreaterThanOrEqual(400);
    expect(await (await rest(`/quiz_attempts?id=eq.${att}&select=user_id`, tb)).json()).toEqual([{ user_id: b.id }]);
  });

  it("anonymous requests reach nothing: no tables, no functions, and the public schema document lists none of them", async () => {
    for (const p of ["/question_items", "/question_answer_keys", "/quiz_attempts", "/case_items", "/learner_review_schedule"]) expect([401, 403], p).toContain((await rest(p)).status);
    for (const fn of ["qb_progress", "st_overview", "cs_list", "qb_start_attempt"]) {
      const r = await rest(`/rpc/${fn}`, undefined, { method: "POST", body: "{}" });
      expect([401, 403, 404], fn).toContain(r.status);
    }
    const doc = await (await rest("/", undefined, { headers: { Accept: "application/openapi+json" } })).text();
    expect(doc).not.toMatch(/question_answer_keys|case_option_keys|quiz_answers|qb_start_attempt/);
  });

  it("the GraphQL endpoint (a second API surface the app does not use) is closed to learners and anonymous callers", async () => {
    const c = await signIn(b.email);
    const tok = await tokenOf(c);
    const gql = async (query: string, token?: string) => {
      const r = await fetch(`${PROJECT_URL}/graphql/v1`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${token ?? ANON}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
      return { status: r.status, text: await r.text() };
    };
    for (const token of [tok, undefined]) {
      for (const q of ["{ __schema { types { name } } }", "{ question_answer_keysCollection { edges { node { rationale } } } }", "{ quiz_attemptsCollection { edges { node { id } } } }"]) {
        const r = await gql(q, token);
        expect(r.text, q).not.toMatch(/rationale|question_answer_keys|"edges":\s*\[\s*\{/);
        expect(r.status >= 400 || /"errors"/.test(r.text), `${q} should be refused`).toBe(true);
      }
    }
  });

  it("fixtures disappear at runtime when the database is not a development database (production guard over the real API)", async () => {
    const c = await signIn(b.email);
    try {
      await sql("alter table public.app_settings drop constraint app_settings_fixtures_dev_only");
      await sql("update public.app_settings set environment='production'"); // even with the visibility flag still true
      expect(((await c.rpc("qb_progress")).data as any).synthetic_fixtures).toBe(false);
      expect(((await c.rpc("cs_list")).data as any[])).toEqual([]);
      expect(((await c.rpc("sk_list")).data as any[])).toEqual([]);
      expect(((await c.rpc("md_list")).data as any[])).toEqual([]);
      expect((await c.rpc("qb_start_attempt", { p_mode: "practice", p_count: 3 })).error?.message).toMatch(/no questions are available/);
    } finally {
      await sql("update public.app_settings set environment='development'");
      await sql("alter table public.app_settings add constraint app_settings_fixtures_dev_only check (not question_fixtures_visible or environment = 'development')");
    }
    expect(((await c.rpc("qb_progress")).data as any).synthetic_fixtures).toBe(true);
  });

  it("account deletion over real Auth and PostgREST: needs the right email, erases the learner, revokes every session, spares others", async () => {
    const doomed = await makeUser("iso-del", "Isolated Deletion"); ids.push(doomed.id);
    const other = await makeUser("iso-del-other", "Isolated Keeper"); ids.push(other.id);
    const c = await signIn(doomed.email), c2 = await signIn(doomed.email); // two sessions (two devices)
    const keeper = await signIn(other.email);
    const token = await tokenOf(c);
    expect(((await sql(`select count(*)::int n from public.profiles where id='${doomed.id}'`))[0] as any).n).toBe(1);
    // refused: someone else's email, and anonymous callers
    expect((await c.rpc("delete_my_account", { p_email: other.email })).error?.message).toMatch(/confirmation does not match/);
    expect((await newClient().rpc("delete_my_account", { p_email: doomed.email })).error).toBeTruthy();
    expect(((await sql(`select count(*)::int n from auth.users where id='${doomed.id}'`))[0] as any).n).toBe(1);
    // allowed: the signed-in person, fresh sign-in, own email (case-insensitive)
    const { data, error } = await c.rpc("delete_my_account", { p_email: doomed.email.toUpperCase() });
    expect(error).toBeNull(); expect(data).toEqual({ deleted: true });
    // erased
    for (const [t, col] of [["auth.users", "id"], ["public.profiles", "id"], ["public.user_roles", "user_id"]] as const)
      expect(((await sql(`select count(*)::int n from ${t} where ${col}='${doomed.id}'`))[0] as any).n, t).toBe(0);
    expect(((await sql(`select count(*)::int n from auth.sessions where user_id='${doomed.id}'`))[0] as any).n).toBe(0);
    // every session is revoked: refresh tokens fail, signing in fails, the old access token cannot act
    expect((await c.auth.refreshSession()).error).toBeTruthy();
    expect((await c2.auth.refreshSession()).error).toBeTruthy();
    expect((await newClient().auth.signInWithPassword({ email: doomed.email, password: PASSWORD })).error).toBeTruthy();
    expect((await rest("/rpc/qb_start_attempt", token, { method: "POST", body: JSON.stringify({ p_mode: "practice", p_count: 3 }) })).ok).toBe(false);
    expect((await c.rpc("delete_my_account", { p_email: doomed.email })).error).toBeTruthy(); // a second call cannot repeat
    // others untouched; the audit entry names nobody
    expect((await keeper.rpc("qb_progress")).error).toBeNull();
    expect(((await sql(`select count(*)::int n from auth.users where id='${other.id}'`))[0] as any).n).toBe(1);
    const a = (await sql("select actor, details::text d, entity_id from public.audit_log where action='account_deleted' order by id desc limit 1"))[0] as any;
    expect(a.actor).toBeNull(); expect(a.d).not.toContain(doomed.email); expect(a.entity_id).toMatch(/^[0-9a-f]{16}$/);
  });
});
