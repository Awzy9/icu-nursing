/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally; shapes are validated by the app's zod schemas */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, owner, setupDb, uniqueEmail } from "./helpers";
import { loadSkillFixtures, skillSeedSql } from "../../src/lib/skills/fixtures";
import { skillDetailSchema, skillListSchema, skillProgressSchema, skillSessionSchema } from "../../src/lib/skills/types";

const skills = loadSkillFixtures();
const s1 = skills[0]!, s2 = skills[1]!;
let alice: string, bob: string;
const rpc = async (who: string | null, text: string, params: unknown[] = []) => (await asUser(who ? { id: who } : null, text, params)).rows[0] as Record<string, any>;
const list = async (u: string, q: string | null = null, c: string | null = null, b = false) => (await rpc(u, "select public.sk_list($1,$2,$3) as l", [q, c, b])).l as any[];
const start = async (u: string, s = s1) => (await rpc(u, "select public.sk_start_session($1) as id", [s.id])).id as string;
const session = async (u: string, id: string) => (await rpc(u, "select public.sk_get_session($1) as s", [id])).s as any;
const mark = (u: string, id: string, item: string, r: string) => rpc(u, "select public.sk_mark($1,$2,$3)", [id, item, r]);

beforeAll(async () => {
  await setupDb();
  alice = await createUser(uniqueEmail("alice"));
  bob = await createUser(uniqueEmail("bob"));
  await owner.query(skillSeedSql());
});
afterAll(closePool);

describe("content gate", () => {
  it("shows nothing while fixtures are off, and nothing on a non-development database", async () => {
    expect(await list(alice)).toEqual([]);
    await expect(start(alice)).rejects.toThrow(/skill not found/);
    await owner.query("update public.app_settings set environment='development', question_fixtures_visible=true");
    expect(await list(alice)).toHaveLength(4);
    await owner.query("alter table public.app_settings drop constraint app_settings_fixtures_dev_only");
    await owner.query("update public.app_settings set environment='production'");
    expect(await list(alice)).toEqual([]);
    await expect(rpc(alice, "select public.sk_get($1)", [s1.code])).rejects.toThrow(/skill not found/);
    await owner.query("update public.app_settings set environment='development'");
    await owner.query("alter table public.app_settings add constraint app_settings_fixtures_dev_only check (not question_fixtures_visible or environment = 'development')");
  });

  it("outputs parse with the application's schemas", async () => {
    const l = await list(alice);
    const d = (await rpc(alice, "select public.sk_get($1) as d", [s1.code])).d;
    const p = (await rpc(alice, "select public.sk_progress() as p")).p;
    const id = await start(alice, s2);
    expect(() => skillListSchema.parse(l)).not.toThrow();
    expect(() => skillDetailSchema.parse(d)).not.toThrow();
    expect(() => skillProgressSchema.parse(p)).not.toThrow();
    const sv = await session(alice, id);
    expect(() => skillSessionSchema.parse(sv)).not.toThrow();
    await rpc(alice, "select public.sk_discard_session($1)", [id]);
  });

  it("never publishes a clinical skill without every safeguard, and rejects an invalid structure", async () => {
    const mk = async (kind: string, note: string | null, extra = "") => (await owner.query(
      `insert into public.skill_items (code, kind, status, origin, category, title, summary, objectives, source_note ${extra ? "," + extra.split("=")[0] : ""})
       values ($1,$2,'draft','ai_generated','assessment','{"en":"Gate test"}','{"en":"A gate-test summary long enough."}','{"en":["Objective"]}',$3 ${extra ? "," + extra.split("=")[1] : ""}) returning id`,
      [`GATE-${Math.random().toString(36).slice(2, 7)}`, kind, note])).rows[0].id as string;
    const publish = (id: string, extra = "") => owner.query(`update public.skill_items set status='published', approved_at=now(), published_at=now() ${extra} where id=$1`, [id]);
    const clin = await mk("clinical", null);
    await expect(publish(clin)).rejects.toThrow(/named approver/);
    const unlabelled = await mk("demo_synthetic", "real clinical source");
    await expect(publish(unlabelled)).rejects.toThrow(/SYNTHETIC FIXTURE/);
    const empty = await mk("demo_synthetic", "SYNTHETIC FIXTURE gate test");
    await expect(publish(empty)).rejects.toThrow(/invalid skill structure.*at least three checklist items/);
    // clinical: approver alone is not enough; reviewer, role, evidence and licence are each required
    const reviewer = await createUser(uniqueEmail("rev"));
    await owner.query("insert into public.user_roles (user_id, role) values ($1,'clinical_reviewer')", [reviewer]);
    await expect(publish(clin, `, approved_by='${reviewer}'`)).rejects.toThrow(/independent clinical review/);
    await expect(publish(clin, `, approved_by='${reviewer}', reviewed_by='${reviewer}', reviewed_at=now()`)).rejects.toThrow(/fully supported evidence/);
    await owner.query("update public.skill_items set evidence_status='supported' where id=$1", [clin]);
    await expect(publish(clin, `, approved_by='${reviewer}', reviewed_by='${reviewer}', reviewed_at=now()`)).rejects.toThrow(/cleared or original licensing/);
    await owner.query("update public.skill_items set license_status='permission_required' where id=$1", [clin]);
    await expect(publish(clin, `, approved_by='${reviewer}', reviewed_by='${reviewer}', reviewed_at=now()`)).rejects.toThrow(/cleared or original licensing/);
    for (const v of [clin, unlabelled, empty]) expect((await owner.query("select private.skill_is_visible($1) v", [v])).rows[0].v).toBe(false);
    expect((await asUser({ id: alice }, "select * from public.skill_items where id=$1", [clin])).rows).toEqual([]);
    await expect(rpc(alice, "select public.sk_start_session($1)", [clin])).rejects.toThrow(/skill not found/);
  });

  it("keeps draft, in-review, partially supported and permission-pending clinical skills invisible in list, search, get and bookmarks", async () => {
    const dom = ["draft", "in_review", "approved"];
    const ids: string[] = [];
    for (const st of dom) {
      ids.push((await owner.query(
        `insert into public.skill_items (code, kind, status, category, title, summary, objectives, evidence_status, license_status)
         values ($1,'clinical',$2,'vascular-access','{"en":"Clinical draft secret-term"}','{"en":"A clinical draft that must stay hidden."}','{"en":["x"]}','partial','permission_required') returning id`,
        [`CLIN-${st}-${Math.random().toString(36).slice(2, 6)}`, st])).rows[0].id);
    }
    expect(await list(alice, "secret-term")).toEqual([]);
    expect(await list(alice, null, "vascular-access")).toEqual([]);
    for (const id of ids) await expect(rpc(alice, "select public.sk_set_bookmark($1,true)", [id])).rejects.toThrow(/skill not found/);
    expect((await rpc(alice, "select public.sk_progress() as p")).p.available).toBe(4);
  });

  it("freezes published skills", async () => {
    await expect(owner.query("update public.skill_checklist_items set critical = false where id=$1", [s1.checklist[0]!.id])).rejects.toThrow(/immutable/);
    await expect(owner.query("delete from public.skill_checklist_items where id=$1", [s1.checklist[0]!.id])).rejects.toThrow(/immutable/);
    await expect(owner.query("update public.skill_items set title='{\"en\":\"Changed title\"}' where id=$1", [s1.id])).rejects.toThrow(/immutable/);
    await expect(owner.query("update public.skill_items set evidence_status='supported' where id=$1", [s1.id])).rejects.toThrow(/immutable/);
  });
});

describe("search, filters and bookmarks", () => {
  it("searches title and summary, filters by category, treats % and _ literally, and bounds the query", async () => {
    expect((await list(alice, "scanner")).map((x) => x.code)).toEqual([s1.code]);
    expect((await list(alice, "RADIO")).map((x) => x.code)).toEqual(["SYN-SKILL-004"]);
    expect((await list(alice, null, "assessment")).map((x) => x.code)).toEqual([s2.code]);
    expect(await list(alice, "%")).toEqual([]);
    expect(await list(alice, "_")).toEqual([]);
    await expect(list(alice, "x".repeat(81))).rejects.toThrow(/too long/);
    await expect(list(alice, null, "not-a-category")).rejects.toThrow(/unknown category/);
  });
  it("bookmarks are per learner", async () => {
    await rpc(alice, "select public.sk_set_bookmark($1,true)", [s1.id]);
    await rpc(alice, "select public.sk_set_bookmark($1,true)", [s1.id]);
    expect((await list(alice, null, null, true)).map((x) => x.code)).toEqual([s1.code]);
    expect(await list(bob, null, null, true)).toEqual([]);
    expect((await rpc(alice, "select public.sk_progress() as p")).p.bookmarked).toBe(1);
    await rpc(alice, "select public.sk_set_bookmark($1,false)", [s1.id]);
    expect(await list(alice, null, null, true)).toEqual([]);
  });
});

describe("self-study sessions", () => {
  it("starts, resumes, records self-reported ticks, completes with counts and no pass/fail verdict", async () => {
    const id = await start(alice);
    expect(await start(alice)).toBe(id);
    const v = await session(alice, id);
    expect(v.items).toHaveLength(s1.checklist.length);
    expect(v.items.every((i: any) => i.result === null)).toBe(true);
    await mark(alice, id, s1.checklist[0]!.id, "done");
    await mark(alice, id, s1.checklist[0]!.id, "unsure");
    await mark(alice, id, s1.checklist[1]!.id, "done");
    await mark(alice, id, s1.checklist[3]!.id, "done");
    const done = await rpc(alice, "select public.sk_complete_session($1) as s", [id]);
    const sum = done.s.summary;
    expect(sum).toEqual({ items_total: 7, items_done: 2, items_unsure: 1, critical_total: 3, critical_done: 1 });
    expect(JSON.stringify(done.s)).not.toMatch(/passed|competent|certified|approved/i);
    await expect(mark(alice, id, s1.checklist[2]!.id, "done")).rejects.toThrow(/no longer in progress/);
    await expect(rpc(alice, "select public.sk_complete_session($1)", [id])).rejects.toThrow(/no longer in progress/);
    const d = (await rpc(alice, "select public.sk_get($1) as d", [s1.code])).d;
    expect(d.sessions_completed).toBe(1);
    expect(d.my_sessions[0]).toMatchObject({ status: "completed", items_done: 2, items_total: 7 });
  });
  it("rejects invalid results and foreign items; discard works", async () => {
    const id = await start(alice, s2);
    await expect(mark(alice, id, s2.checklist[0]!.id, "passed")).rejects.toThrow(/invalid result/);
    await expect(mark(alice, id, s1.checklist[0]!.id, "done")).rejects.toThrow(/does not belong/);
    await rpc(alice, "select public.sk_discard_session($1)", [id]);
    await expect(mark(alice, id, s2.checklist[0]!.id, "done")).rejects.toThrow(/no longer in progress/);
  });
  it("isolates learners: B cannot read, mark, complete or discard A's session", async () => {
    const id = await start(alice, s2);
    await expect(session(bob, id)).rejects.toThrow(/session not found/);
    await expect(mark(bob, id, s2.checklist[0]!.id, "done")).rejects.toThrow(/session not found/);
    await expect(rpc(bob, "select public.sk_complete_session($1)", [id])).rejects.toThrow(/session not found/);
    await expect(rpc(bob, "select public.sk_discard_session($1)", [id])).rejects.toThrow(/session not found/);
    expect((await asUser({ id: bob }, "select * from public.skill_sessions")).rows).toEqual([]);
    expect((await asUser({ id: alice }, "select * from public.skill_sessions")).rows.length).toBeGreaterThan(0);
  });
  it("enforces the unfinished-session cap and the hourly ceiling", async () => {
    const carol = await createUser(uniqueEmail("carol"));
    for (const s of skills) await start(carol, s);
    const extra = (await owner.query(`insert into public.skill_items (code, kind, status, category, title, summary, objectives, source_note, sections)
      values ('SYN-SKILL-900','demo_synthetic','draft','assessment','{"en":"Cap test"}','{"en":"Cap test synthetic skill."}','{"en":["x"]}','SYNTHETIC FIXTURE cap',
      '{"indications":{"en":["a"]},"safety":{"en":["a"]},"escalation":{"en":["a"]},"documentation":{"en":["a"]}}') returning id`)).rows[0].id;
    for (let i = 1; i <= 3; i++) await owner.query("insert into public.skill_checklist_items (skill_id, position, phase, text) values ($1,$2,'procedure','{\"en\":\"Step\"}')", [extra, i]);
    await owner.query("insert into public.skill_revisions (skill_id, version, summary) values ($1,1,'{\"en\":\"First\"}')", [extra]);
    await owner.query("update public.skill_items set status='published', approved_at=now(), published_at=now() where id=$1", [extra]);
    const dave = await createUser(uniqueEmail("dave"));
    await owner.query(`insert into public.skill_sessions (user_id, skill_id, skill_version, status) select $1, $2, 1, 'in_progress' from generate_series(1,10)`, [dave, s1.id]);
    await expect(rpc(dave, "select public.sk_start_session($1)", [extra])).rejects.toThrow(/limit 10/);
    const erin = await createUser(uniqueEmail("erin"));
    await owner.query(`insert into public.skill_sessions (user_id, skill_id, skill_version, status, completed_at) select $1, $2, 1, 'completed', now() from generate_series(1,60)`, [erin, s1.id]);
    await expect(rpc(erin, "select public.sk_start_session($1)", [extra])).rejects.toThrow(/last hour/);
  });
});

describe("competency model boundaries", () => {
  it("only self-study sessions exist: observed assessment, assessor fields and verification are refused", async () => {
    const id = await start(alice, skills[2]!);
    await expect(owner.query("update public.skill_sessions set mode='observed_assessment' where id=$1", [id])).rejects.toThrow(/skill_sessions_self_study_only/);
    await expect(owner.query("update public.skill_sessions set verified_at=now() where id=$1", [id])).rejects.toThrow(/skill_sessions_check/);
    await expect(owner.query("update public.skill_sessions set assessor_name='Someone' where id=$1", [id])).rejects.toThrow(/skill_sessions_check/);
  });
  it("learners and anonymous users cannot write any skills table or call functions anonymously", async () => {
    const tables = ["skill_items", "skill_checklist_items", "skill_revisions", "skill_bookmarks", "skill_sessions", "skill_session_items"];
    for (const t of tables) {
      await expectDenied(asUser({ id: alice }, `insert into public.${t} default values`));
      await expectDenied(asUser({ id: alice }, `update public.${t} set ${t === "skill_bookmarks" ? "created_at = created_at" : t === "skill_session_items" ? "marked_at = marked_at" : "id = id"}`));
      await expectDenied(asUser({ id: alice }, `delete from public.${t}`));
      await expectDenied(asUser(null, `select * from public.${t}`));
    }
    for (const t of ["skill_items", "skill_checklist_items", "skill_revisions"]) expect((await asUser({ id: alice }, `select * from public.${t}`)).rows).toEqual([]);
    await expectDenied(asUser(null, "select public.sk_list(null,null,false)"));
    await expectDenied(asUser(null, "select public.sk_start_session($1)", [s1.id]));
    await expect(rpc(alice, "select public.sk_get($1)", ["NOPE-CODE"])).rejects.toThrow(/skill not found/);
  });
});
