/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally; shapes are validated by the app's zod schemas */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, owner, setupDb, uniqueEmail } from "./helpers";
import { loadMedicationFixtures, medicationSeedSql } from "../../src/lib/medications/fixtures";
import { medicationDetailSchema, medicationListSchema, medicationProgressSchema } from "../../src/lib/medications/types";

const meds = loadMedicationFixtures();
const m1 = meds[0]!;
let alice: string, bob: string;
const rpc = async (who: string | null, text: string, params: unknown[] = []) => (await asUser(who ? { id: who } : null, text, params)).rows[0] as Record<string, any>;
const list = async (u: string, q: string | null = null, c: string | null = null, b = false, h = false) => (await rpc(u, "select public.md_list($1,$2,$3,$4) as l", [q, c, b, h])).l as any[];

beforeAll(async () => {
  await setupDb();
  alice = await createUser(uniqueEmail("alice"));
  bob = await createUser(uniqueEmail("bob"));
  await owner.query(medicationSeedSql());
});
afterAll(closePool);

describe("content gate", () => {
  it("shows nothing while fixtures are off or on a non-development database", async () => {
    expect(await list(alice)).toEqual([]);
    await owner.query("update public.app_settings set environment='development', question_fixtures_visible=true");
    expect(await list(alice)).toHaveLength(4);
    await owner.query("alter table public.app_settings drop constraint app_settings_fixtures_dev_only");
    await owner.query("update public.app_settings set environment='production'");
    expect(await list(alice)).toEqual([]);
    await expect(rpc(alice, "select public.md_get($1)", [m1.code])).rejects.toThrow(/medication not found/);
    await owner.query("update public.app_settings set environment='development'");
    await owner.query("alter table public.app_settings add constraint app_settings_fixtures_dev_only check (not question_fixtures_visible or environment = 'development')");
  });
  it("outputs parse with the application's schemas", async () => {
    const l = await list(alice);
    const d = (await rpc(alice, "select public.md_get($1) as d", [m1.code])).d;
    const p = (await rpc(alice, "select public.md_progress() as p")).p;
    expect(() => medicationListSchema.parse(l)).not.toThrow();
    expect(() => medicationDetailSchema.parse(d)).not.toThrow();
    expect(() => medicationProgressSchema.parse(p)).not.toThrow();
    expect(p).toMatchObject({ available: 4, high_alert: 3 });
  });
  it("keeps every non-published or unreviewed clinical medication invisible in list, search, detail and bookmarks", async () => {
    const ids: string[] = [];
    for (const st of ["draft", "in_review", "approved"]) {
      ids.push((await owner.query(
        `insert into public.medication_items (code, kind, status, category, name, drug_class, summary, evidence_status, license_status)
         values ($1,'clinical',$2,'vasoactives-inotropes','{"en":"Secret-term drug"}','{"en":"Class"}','{"en":"A clinical draft that must stay hidden."}','partial','permission_required') returning id`,
        [`CLIN-${st}-${Math.random().toString(36).slice(2, 6)}`, st])).rows[0].id);
    }
    expect(await list(alice, "secret-term")).toEqual([]);
    expect(await list(alice, null, "vasoactives-inotropes")).toHaveLength(1);
    for (const id of ids) await expect(rpc(alice, "select public.md_set_bookmark($1,true)", [id])).rejects.toThrow(/medication not found/);
  });
  it("never publishes a clinical medication without every safeguard", async () => {
    const mk = async (kind: string, note: string | null) => (await owner.query(
      `insert into public.medication_items (code, kind, status, origin, category, name, drug_class, summary, source_note)
       values ($1,$2,'draft','ai_generated','anti-infectives','{"en":"Gate test"}','{"en":"Class"}','{"en":"A gate-test summary long enough."}',$3) returning id`,
      [`GATE-${Math.random().toString(36).slice(2, 7)}`, kind, note])).rows[0].id as string;
    const publish = (id: string, extra = "") => owner.query(`update public.medication_items set status='published', approved_at=now(), published_at=now() ${extra} where id=$1`, [id]);
    const clin = await mk("clinical", null);
    await expect(publish(clin)).rejects.toThrow(/named approver/);
    const unlabelled = await mk("demo_synthetic", "real source");
    await expect(publish(unlabelled)).rejects.toThrow(/SYNTHETIC FIXTURE/);
    const empty = await mk("demo_synthetic", "SYNTHETIC FIXTURE gate test");
    await expect(publish(empty)).rejects.toThrow(/at least three monitoring/);
    const rev = await createUser(uniqueEmail("rev"));
    await owner.query("insert into public.user_roles (user_id, role) values ($1,'clinical_reviewer')", [rev]);
    const base = `, approved_by='${rev}', reviewed_by='${rev}', reviewed_at=now()`;
    await expect(publish(clin, `, approved_by='${rev}'`)).rejects.toThrow(/independent clinical review/);
    await expect(publish(clin, base)).rejects.toThrow(/fully supported evidence/);
    await owner.query("update public.medication_items set evidence_status='supported', license_status='permission_required' where id=$1", [clin]);
    await expect(publish(clin, base)).rejects.toThrow(/cleared or original licensing/);
    await owner.query(`update public.medication_items set license_status='cleared', evidence_date=current_date, "references"='[{"title":"x"}]' where id=$1`, [clin]);
    await expect(publish(clin, base)).rejects.toThrow(/regulator label source/);
    // the pharmacist columns exist but are neither required nor consulted
    await owner.query("update public.medication_items set label_source='FDA', label_version='v', label_date=current_date, jurisdiction_note='{\"en\":\"US label only\"}' where id=$1", [clin]);
    await expect(publish(clin, base)).rejects.toThrow(/invalid medication structure/); // structure, not pharmacist
    for (const v of [clin, unlabelled, empty]) expect((await owner.query("select private.medication_is_visible($1) v", [v])).rows[0].v).toBe(false);
    expect((await owner.query("select count(*)::int n from public.medication_items where pharmacist_reviewed_by is not null")).rows[0].n).toBe(0);
  });
  it("freezes published medications", async () => {
    await expect(owner.query("update public.medication_monitoring_items set critical = false where id=$1", [m1.monitoring[0]!.id])).rejects.toThrow(/immutable/);
    await expect(owner.query("update public.medication_items set name='{\"en\":\"Renamed\"}' where id=$1", [m1.id])).rejects.toThrow(/immutable/);
    await expect(owner.query("update public.medication_items set label_date=current_date where id=$1", [m1.id])).rejects.toThrow(/immutable/);
  });
});

describe("the no-dosing guard", () => {
  const ins = (name: string, summary: string, sections = "{}") => owner.query(
    `insert into public.medication_items (code, kind, category, name, drug_class, summary, sections) values ($1,'clinical','anti-infectives',$2::jsonb,'{"en":"Class"}',$3::jsonb,$4::jsonb)`,
    [`DOSE-${Math.random().toString(36).slice(2, 8)}`, JSON.stringify({ en: name }), JSON.stringify({ en: summary }), sections]);
  it.each([
    ["a numeric dose", "Give 5 mg to the patient as ordered."],
    ["a rate expression", "Run at 2 mcg/kg/min as ordered."],
    ["a concentration", "Supplied as a 4 mg/mL vial for the ward."],
    ["a percentage strength", "A 0.9 % solution is used for the line."],
    ["titration wording", "Titrate to the target response as ordered."],
    ["compatibility wording", "Compatible with the saline in the y-site."],
    ["preparation wording", "Dilute before use as the pharmacy directs."],
  ])("rejects %s in a summary", async (_n, text) => { await expect(ins("Guard test", `A summary that is long enough. ${text}`)).rejects.toThrow(/must not contain/); });
  it("rejects dosing inside a section and inside a monitoring item", async () => {
    await expect(ins("Guard test", "A summary that is long enough.", JSON.stringify({ monitoring: { en: ["Check 10 mmol of the agent"] } }))).rejects.toThrow(/must not contain/);
    await expect(owner.query(`insert into public.medication_monitoring_items (medication_id, position, kind, text) values ($1, 30, 'observe', '{"en":"Check the 5 units given"}')`, [m1.id])).rejects.toThrow(/immutable|must not contain/);
  });
  it("accepts ordinary nursing wording", async () => {
    await expect(ins("Plain wording test", "A summary that is long enough with ordinary nursing wording about monitoring and escalation.")).resolves.toBeDefined();
  });
});

describe("search, filters and bookmarks", () => {
  it("searches name, class and summary; filters by category and high-alert; escapes wildcards; bounds the query", async () => {
    expect((await list(alice, "examplol")).map((x) => x.code)).toEqual([m1.code]);
    expect((await list(alice, "calming")).map((x) => x.code)).toEqual(["SYN-MED-002"]);
    expect((await list(alice, null, "anti-infectives")).map((x) => x.code)).toEqual(["SYN-MED-003"]);
    expect((await list(alice, null, null, false, true)).map((x) => x.code).sort()).toEqual(["SYN-MED-001", "SYN-MED-002", "SYN-MED-004"]);
    expect(await list(alice, "%")).toEqual([]);
    await expect(list(alice, "x".repeat(81))).rejects.toThrow(/too long/);
    await expect(list(alice, null, "nope")).rejects.toThrow(/unknown category/);
  });
  it("bookmarks are per learner", async () => {
    await rpc(alice, "select public.md_set_bookmark($1,true)", [m1.id]);
    expect((await list(alice, null, null, true)).map((x) => x.code)).toEqual([m1.code]);
    expect(await list(bob, null, null, true)).toEqual([]);
    await rpc(alice, "select public.md_set_bookmark($1,false)", [m1.id]);
    expect(await list(alice, null, null, true)).toEqual([]);
  });
});

describe("closed tables", () => {
  it("learners and anonymous users cannot read or write any medication table or call functions anonymously", async () => {
    const cols: Record<string, string> = { medication_items: "id = id", medication_monitoring_items: "id = id", medication_revisions: "id = id", medication_bookmarks: "created_at = created_at" };
    for (const [t, set] of Object.entries(cols)) {
      await expectDenied(asUser({ id: alice }, `insert into public.${t} default values`));
      await expectDenied(asUser({ id: alice }, `update public.${t} set ${set}`));
      await expectDenied(asUser({ id: alice }, `delete from public.${t}`));
      await expectDenied(asUser(null, `select * from public.${t}`));
    }
    for (const t of ["medication_items", "medication_monitoring_items", "medication_revisions"]) expect((await asUser({ id: alice }, `select * from public.${t}`)).rows).toEqual([]);
    await expectDenied(asUser(null, "select public.md_list(null,null,false,false)"));
    await expect(rpc(alice, "select public.md_get($1)", ["NOPE-CODE"])).rejects.toThrow(/medication not found/);
  });
});
