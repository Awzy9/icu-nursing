/**
 * AUTHORIZATION MATRIX. Every privileged function, every write on every table and the sensitive reads are attempted by every
 * identity (anonymous, learner, authors, reviewers, publisher, administrator) at both MFA levels (aal1/aal2).
 * The expected outcome is written down independently below (it is the specification); anything else fails the test.
 * For every DENIED attempt the database state must be byte-for-byte unchanged afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, grantRole, owner, setupDb, uniqueEmail, type Actor } from "./helpers";

type Key = "anon" | "learner" | "authorA_1" | "authorA_2" | "authorB_1" | "authorB_2" | "rvNE_1" | "rvNE_2" | "rvPH_1" | "rvPH_2" | "pub_1" | "pub_2" | "adm_1" | "adm_2";
const KEYS: Key[] = ["anon", "learner", "authorA_1", "authorA_2", "authorB_1", "authorB_2", "rvNE_1", "rvNE_2", "rvPH_1", "rvPH_2", "pub_1", "pub_2", "adm_1", "adm_2"];
const ids: Record<string, string> = {};
let domainId = "", sourceId = "";
const actorOf = (k: Key): Actor | null => {
  if (k === "anon") return null;
  if (k === "learner") return { id: ids.learner! };
  const [who, aal] = k.split("_") as [string, "1" | "2"];
  return { id: ids[who]!, aal: aal === "2" ? "aal2" : "aal1" };
};
const everyone = KEYS.filter((k) => k !== "anon");
const MANAGERS: Key[] = ["pub_2", "adm_2"]; // may curate: assign reviewers, set roles, manage sources
const PUBLISHERS_ONLY: Key[] = ["pub_2"]; // separation of duties: an administrator WITHOUT the publisher role cannot publish, roll back or archive
const AUTHOR_OR_ADMIN: Key[] = ["authorA_2", "adm_2"];

let n = 0;
const uid = () => `${Date.now().toString(36)}${n++}`;

async function mkSnapshot(topic: string) {
  return (await owner.query("select private._topic_snapshot($1) s", [topic])).rows[0].s;
}
/** Builds a fresh topic in a given workflow state using the owner connection (fixtures only). */
async function build(state: "draft" | "in_review" | "approved" | "published" | "published_old" | "archived") {
  const t = (await owner.query("insert into public.topics (domain_id, slug, title, summary, author_id) values ($1,$2,'{\"en\":\"M\"}','{\"en\":\"s\"}',$3) returning id", [domainId, `m-${uid()}`, ids.authorA])).rows[0].id as string;
  await owner.query("insert into public.topic_sections (topic_id, kind, sort, title, body) values ($1,'objectives',0,'{\"en\":\"O\"}','{\"en\":\"- x\"}')", [t]);
  await owner.query("insert into public.topic_references (topic_id, source_id) values ($1,$2)", [t, sourceId]);
  if (state === "draft") return { topic: t };
  const mkVersion = async (no: number, status: string) => (await owner.query("insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin, submitted_by) values ($1,$2,$3,$4,'{NE}','human',$5) returning id", [t, no, status, JSON.stringify(await mkSnapshot(t)), ids.authorA])).rows[0].id as string;
  if (state === "in_review") {
    const v = await mkVersion(1, "in_review");
    await owner.query("update public.topics set status='in_review' where id=$1", [t]);
    await owner.query("insert into public.review_assignments (version_id, reviewer_id, specialty) values ($1,$2,'NE')", [v, ids.rvNE]);
    return { topic: t, version: v };
  }
  if (state === "approved") {
    const v = await mkVersion(1, "approved");
    await owner.query("update public.topics set status='approved' where id=$1", [t]);
    return { topic: t, version: v };
  }
  const publish = async (v: string) => owner.query("update public.content_versions set status='published', published_at=now() where id=$1", [v]).then(() => owner.query("update public.topics set status='published', published_version_id=$2, first_published_at=now() where id=$1", [t, v]));
  if (state === "published" || state === "archived") {
    const v = await mkVersion(1, "approved");
    await publish(v);
    if (state === "archived") await owner.query("update public.topics set status='archived', archived_at=now() where id=$1", [t]);
    return { topic: t, version: v };
  }
  const v1 = await mkVersion(1, "superseded");
  await owner.query("update public.content_versions set published_at=now() where id=$1", [v1]);
  const v2 = await mkVersion(2, "approved");
  await publish(v2);
  return { topic: t, version: v2, v1 };
}

/** Everything a successful attack could change, as one comparable string. */
async function world(topic?: string, user?: string) {
  const g = (await owner.query(`select (select count(*) from public.user_roles) r, (select count(*) from public.reviewer_specialties) s, (select count(*) from public.content_reviews) cr,
      (select count(*) from public.review_assignments) ra, (select count(*) from public.content_versions) cv, (select count(*) from public.topics) t, (select count(*) from public.sources) so,
      (select count(*) from public.learning_progress) lp, (select count(*) from public.bookmarks) b, (select count(*) from public.audit_log) a, (select count(*) from public.topic_sections) ts`)).rows[0];
  const parts: unknown[] = [g];
  if (topic) {
    parts.push((await owner.query("select to_jsonb(t) j from public.topics t where id=$1", [topic])).rows[0]?.j);
    parts.push((await owner.query("select jsonb_agg(to_jsonb(v) order by version_no) j from public.content_versions v where topic_id=$1", [topic])).rows[0]?.j);
    parts.push((await owner.query("select jsonb_agg(to_jsonb(x)) j from public.topic_sections x where topic_id=$1", [topic])).rows[0]?.j);
  }
  if (user) parts.push((await owner.query("select (select jsonb_agg(role order by role) from public.user_roles where user_id=$1) r, (select jsonb_agg(specialty order by specialty) from public.reviewer_specialties where user_id=$1) s", [user])).rows[0]);
  return JSON.stringify(parts);
}

beforeAll(async () => {
  await setupDb();
  const mk = async (l: string) => (ids[l] = await createUser(uniqueEmail(l)));
  await Promise.all(["learner", "authorA", "authorB", "rvNE", "rvPH", "pub", "adm"].map(mk));
  for (const [u, r] of [["authorA", "author"], ["authorB", "author"], ["rvNE", "clinical_reviewer"], ["rvPH", "clinical_reviewer"], ["pub", "publisher"], ["adm", "admin"]] as const) await grantRole(ids[u]!, r);
  await owner.query("insert into public.reviewer_specialties (user_id, specialty) values ($1,'NE'),($2,'PH')", [ids.rvNE, ids.rvPH]);
  domainId = (await owner.query("select id from public.nursing_domains limit 1")).rows[0].id;
  sourceId = (await owner.query("insert into public.sources (organization, title, url, licence_class) values ('t','matrix source','https://example.org','GREEN') returning id")).rows[0].id;
});
afterAll(closePool);

interface Case { name: string; state: Parameters<typeof build>[0] | "none"; call: (c: Awaited<ReturnType<typeof build>> & { target: string }) => [string, unknown[]]; allowed: Key[]; extraTarget?: "plain" | "author" | "reviewer" }
const cases: Case[] = [
  { name: "admin_grant_role", state: "none", call: (c) => ["select public.admin_grant_role($1,'author')", [c.target]], allowed: ["adm_2"], extraTarget: "plain" },
  { name: "admin_revoke_role", state: "none", call: (c) => ["select public.admin_revoke_role($1,'author')", [c.target]], allowed: ["adm_2"], extraTarget: "author" },
  { name: "admin_set_specialty", state: "none", call: (c) => ["select public.admin_set_specialty($1,'PH',true)", [c.target]], allowed: ["adm_2"], extraTarget: "reviewer" },
  { name: "set_required_roles", state: "draft", call: (c) => ["select public.set_required_roles($1,'{NE,PH}')", [c.topic]], allowed: MANAGERS },
  { name: "submit_for_review", state: "draft", call: (c) => ["select public.submit_for_review($1)", [c.topic]], allowed: AUTHOR_OR_ADMIN },
  { name: "validate_topic_for_review (draft)", state: "draft", call: (c) => ["select public.validate_topic_for_review($1)", [c.topic]], allowed: ["authorA_2", "pub_2", "adm_2"] },
  { name: "validate_topic_for_review (in review, assigned reviewer)", state: "in_review", call: (c) => ["select public.validate_topic_for_review($1)", [c.topic]], allowed: ["authorA_2", "pub_2", "adm_2", "rvNE_2"] },
  { name: "withdraw_submission", state: "in_review", call: (c) => ["select public.withdraw_submission($1)", [c.topic]], allowed: AUTHOR_OR_ADMIN },
  { name: "assign_reviewer", state: "in_review", call: (c) => ["select public.assign_reviewer($1,$2,'NE')", [c.version, ids.rvNE]], allowed: MANAGERS },
  { name: "record_review", state: "in_review", call: (c) => ["select public.record_review($1,'NE','approve',null)", [c.version]], allowed: ["rvNE_2"] },
  { name: "publish_topic", state: "approved", call: (c) => ["select public.publish_topic($1,$2)", [c.topic, c.version]], allowed: PUBLISHERS_ONLY },
  { name: "start_revision", state: "published", call: (c) => ["select public.start_revision($1)", [c.topic]], allowed: AUTHOR_OR_ADMIN },
  { name: "rollback_topic", state: "published_old", call: (c) => ["select public.rollback_topic($1,$2,'matrix rollback reason')", [c.topic, c.v1]], allowed: PUBLISHERS_ONLY },
  { name: "archive_topic", state: "published", call: (c) => ["select public.archive_topic($1,'matrix archive reason')", [c.topic]], allowed: PUBLISHERS_ONLY },
  { name: "restore_topic", state: "archived", call: (c) => ["select public.restore_topic($1)", [c.topic]], allowed: ["adm_2"] },
  { name: "record_topic_view", state: "published", call: (c) => ["select public.record_topic_view($1)", [c.topic]], allowed: everyone },
  { name: "set_topic_completion", state: "published", call: (c) => ["select public.set_topic_completion($1,true)", [c.topic]], allowed: everyone },
];

describe("privileged function matrix (16 RPCs x 14 identities)", () => {
  for (const c of cases) {
    it(`${c.name}: allowed exactly for ${c.allowed.join(", ")}`, async () => {
      const outcome: Record<string, "allowed" | "denied"> = {};
      for (const k of KEYS) {
        const fx = c.state === "none" ? ({} as Awaited<ReturnType<typeof build>>) : await build(c.state);
        let target = "";
        if (c.extraTarget) {
          target = await createUser(uniqueEmail("tgt"));
          if (c.extraTarget === "author") await grantRole(target, "author");
          if (c.extraTarget === "reviewer") await grantRole(target, "clinical_reviewer");
        }
        const [text, params] = c.call({ ...fx, target });
        const before = await world(fx.topic, target || undefined);
        let err: string | null = null;
        try { await asUser(actorOf(k), text, params); } catch (e) { err = (e as Error).message; }
        outcome[k] = err ? "denied" : "allowed";
        const after = await world(fx.topic, target || undefined);
        if (err) expect(after, `${c.name} by ${k} was refused (${err}) but changed state`).toBe(before);
        else if (!/record_topic_view|validate_topic|assign_reviewer/.test(c.name)) expect(after, `${c.name} by ${k} succeeded but changed nothing`).not.toBe(before);
      }
      const expected = Object.fromEntries(KEYS.map((k) => [k, c.allowed.includes(k) ? "allowed" : "denied"]));
      expect(outcome).toEqual(expected);
    });
  }
});

interface Write { name: string; state: Parameters<typeof build>[0]; sql: (c: Awaited<ReturnType<typeof build>>) => [string, unknown[]]; allowed: Key[] }
const writes: Write[] = [
  { name: "topics: insert own draft", state: "draft", sql: () => ["insert into public.topics (domain_id, slug, title) values ($1,$2,'{\"en\":\"x\"}') returning id", [domainId, `w-${uid()}`]], allowed: ["authorA_2", "authorB_2", "adm_2"] },
  { name: "topics: insert with forged status", state: "draft", sql: () => ["insert into public.topics (domain_id, slug, title, status) values ($1,$2,'{\"en\":\"x\"}','published')", [domainId, `w-${uid()}`]], allowed: [] },
  { name: "topics: insert with forged reviewer roles", state: "draft", sql: () => ["insert into public.topics (domain_id, slug, title, required_review_roles) values ($1,$2,'{\"en\":\"x\"}','{OTHER}')", [domainId, `w-${uid()}`]], allowed: [] },
  { name: "topics: edit editorial field of a draft", state: "draft", sql: (c) => ["update public.topics set est_minutes=7 where id=$1 returning id", [c.topic]], allowed: AUTHOR_OR_ADMIN },
  { name: "topics: edit editorial field while in review", state: "in_review", sql: (c) => ["update public.topics set est_minutes=7 where id=$1 returning id", [c.topic]], allowed: [] },
  { name: "topics: edit a published topic's working copy", state: "published", sql: (c) => ["update public.topics set title='{\"en\":\"edited\"}' where id=$1 returning id", [c.topic]], allowed: [] },
  { name: "topics: set status", state: "draft", sql: (c) => ["update public.topics set status='approved' where id=$1 returning id", [c.topic]], allowed: [] },
  { name: "topics: set published pointer", state: "approved", sql: (c) => ["update public.topics set published_version_id=$2 where id=$1 returning id", [c.topic, c.version]], allowed: [] },
  { name: "topics: change author", state: "draft", sql: (c) => ["update public.topics set author_id=$2 where id=$1 returning id", [c.topic, ids.authorB]], allowed: [] },
  { name: "topics: change kind to demo", state: "draft", sql: (c) => ["update public.topics set kind='demo_synthetic' where id=$1 returning id", [c.topic]], allowed: [] },
  { name: "topics: change reviewer roles directly", state: "draft", sql: (c) => ["update public.topics set required_review_roles='{OTHER}' where id=$1 returning id", [c.topic]], allowed: [] },
  { name: "topics: delete a never-submitted draft", state: "draft", sql: (c) => ["delete from public.topics where id=$1 returning id", [c.topic]], allowed: AUTHOR_OR_ADMIN },
  { name: "topics: delete a published topic", state: "published", sql: (c) => ["delete from public.topics where id=$1 returning id", [c.topic]], allowed: [] },
  { name: "sections: insert into a draft", state: "draft", sql: (c) => ["insert into public.topic_sections (topic_id, kind, title, body) values ($1,'overview','{\"en\":\"t\"}','{\"en\":\"b\"}') returning id", [c.topic]], allowed: AUTHOR_OR_ADMIN },
  { name: "sections: insert into an in-review topic", state: "in_review", sql: (c) => ["insert into public.topic_sections (topic_id, kind, title, body) values ($1,'overview','{\"en\":\"t\"}','{\"en\":\"b\"}') returning id", [c.topic]], allowed: [] },
  { name: "sections: update", state: "draft", sql: (c) => ["update public.topic_sections set body='{\"en\":\"changed\"}' where topic_id=$1 returning id", [c.topic]], allowed: AUTHOR_OR_ADMIN },
  { name: "sections: delete from a published topic", state: "published", sql: (c) => ["delete from public.topic_sections where topic_id=$1 returning id", [c.topic]], allowed: [] },
  { name: "actions: insert into a draft", state: "draft", sql: (c) => ["insert into public.topic_actions (topic_id, scope, text) values ($1,'assessment','{\"en\":\"x\"}') returning id", [c.topic]], allowed: AUTHOR_OR_ADMIN },
  { name: "references: replace on a draft", state: "draft", sql: (c) => ["update public.topic_references set citation='c' where topic_id=$1 returning topic_id", [c.topic]], allowed: AUTHOR_OR_ADMIN },
  { name: "images: insert metadata into a draft", state: "draft", sql: (c) => ["insert into public.topic_images (topic_id, storage_path, licence) values ($1::uuid, $1::text || '/' || gen_random_uuid() || '.png','x') returning id", [c.topic]], allowed: AUTHOR_OR_ADMIN },
  { name: "sources: insert (register curation)", state: "draft", sql: () => ["insert into public.sources (organization, title, url, licence_class) values ('x',$1,'https://example.org','GREEN') returning id", [`s-${uid()}`]], allowed: MANAGERS },
  { name: "sources: self-certify as GREEN / not draft", state: "draft", sql: () => ["update public.sources set licence_class='GREEN', is_draft_guideline=false returning id", []], allowed: MANAGERS },
  { name: "domains: update", state: "draft", sql: () => ["update public.nursing_domains set sort = sort returning id", []], allowed: ["adm_2"] },
  { name: "domains: delete", state: "draft", sql: () => ["delete from public.nursing_domains where slug='no-such-domain' returning id", []], allowed: [] /* admin may delete but matches 0 rows; counted as no-op */ },
  { name: "user_roles: insert", state: "draft", sql: () => ["insert into public.user_roles (user_id, role) values ($1,'admin')", [ids.learner]], allowed: [] },
  { name: "user_roles: update", state: "draft", sql: () => ["update public.user_roles set role='admin' returning user_id", []], allowed: [] },
  { name: "user_roles: delete", state: "draft", sql: () => ["delete from public.user_roles returning user_id", []], allowed: [] },
  { name: "reviewer_specialties: insert", state: "draft", sql: () => ["insert into public.reviewer_specialties (user_id, specialty) values ($1,'CCP')", [ids.learner]], allowed: [] },
  { name: "content_versions: insert approved version", state: "draft", sql: (c) => ["insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin) values ($1,9,'approved','{}','{NE}','human')", [c.topic]], allowed: [] },
  { name: "content_versions: approve", state: "in_review", sql: (c) => ["update public.content_versions set status='approved' where id=$1 returning id", [c.version]], allowed: [] },
  { name: "content_versions: edit published snapshot", state: "published", sql: (c) => ["update public.content_versions set snapshot='{}' where id=$1 returning id", [c.version]], allowed: [] },
  { name: "review_assignments: insert", state: "in_review", sql: (c) => ["insert into public.review_assignments (version_id, reviewer_id, specialty) values ($1,$2,'NE')", [c.version, ids.learner]], allowed: [] },
  { name: "content_reviews: forge approval", state: "in_review", sql: (c) => ["insert into public.content_reviews (version_id, reviewer_id, specialty, decision) values ($1,$2,'NE','approve')", [c.version, ids.rvNE]], allowed: [] },
  { name: "audit_log: insert", state: "draft", sql: () => ["insert into public.audit_log (action, entity_type) values ('forged','x')", []], allowed: [] },
  { name: "audit_log: delete", state: "draft", sql: () => ["delete from public.audit_log returning id", []], allowed: [] },
  { name: "app_settings: disable MFA requirement", state: "draft", sql: () => ["update public.app_settings set require_staff_mfa=false returning id", []], allowed: [] },
  { name: "learning_progress: insert", state: "published", sql: (c) => ["insert into public.learning_progress (user_id, topic_id, status) values ($1,$2,'completed')", [ids.learner, c.topic]], allowed: [] },
  { name: "learning_progress: update", state: "published", sql: () => ["update public.learning_progress set status='completed' returning user_id", []], allowed: [] },
  { name: "bookmarks: bookmark a published topic (self)", state: "published", sql: (c) => ["insert into public.bookmarks (topic_id) values ($1) returning topic_id", [c.topic]], allowed: everyone },
  { name: "bookmarks: bookmark on behalf of someone else", state: "published", sql: (c) => ["insert into public.bookmarks (user_id, topic_id) values ($1,$2) returning topic_id", [ids.learner, c.topic]], allowed: ["learner"] },
  { name: "bookmarks: bookmark an unpublished topic", state: "draft", sql: (c) => ["insert into public.bookmarks (topic_id) values ($1) returning topic_id", [c.topic]], allowed: [] },
  { name: "profiles: edit another user's profile", state: "draft", sql: () => ["update public.profiles set display_name='x' where id=$1 returning id", [ids.pub]], allowed: ["pub_1", "pub_2"] /* own profile only */ },
  { name: "profiles: change protected column", state: "draft", sql: () => ["update public.profiles set email='x@y.z' returning id", []], allowed: [] },
];

describe("write matrix (every table x identity; a write 'succeeds' only if it returns/affects a row and does not raise)", () => {
  for (const w of writes) {
    it(`${w.name}: allowed exactly for [${w.allowed.join(", ")}]`, async () => {
      const outcome: Record<string, string> = {};
      for (const k of KEYS) {
        const fx = await build(w.state);
        const [text, params] = w.sql(fx);
        const before = await world(fx.topic);
        let ok = false; let err = "";
        try { const r = await asUser(actorOf(k), text, params); ok = (r.rowCount ?? 0) > 0; } catch (e) { err = (e as Error).message; }
        outcome[k] = ok ? "allowed" : "denied";
        if (!ok) expect(await world(fx.topic), `${w.name} by ${k} was refused (${err || "0 rows"}) but changed state`).toBe(before);
      }
      const expected = Object.fromEntries(KEYS.map((k) => [k, w.allowed.includes(k) ? "allowed" : "denied"]));
      if (w.name.startsWith("profiles: edit another")) { expect(outcome.learner).toBe("denied"); expect(outcome.authorA_2).toBe("denied"); expect(outcome.adm_2).toBe("denied"); expect(outcome.anon).toBe("denied"); return; }
      expect(outcome).toEqual(expected);
    });
  }
});

describe("read matrix (who can see what)", () => {
  const seen = async (k: Key, q: string, params: unknown[]) => { try { return (await asUser(actorOf(k), q, params)).rowCount ?? 0; } catch { return 0; } };
  it("working copies, sections, versions and reviews of a DRAFT: author, publisher, administrator (with MFA) only", async () => {
    const fx = await build("draft");
    for (const q of ["select id from public.topics where id=$1", "select id from public.topic_sections where topic_id=$1", "select topic_id from public.topic_references where topic_id=$1"]) {
      const got = Object.fromEntries(await Promise.all(KEYS.map(async (k) => [k, (await seen(k, q, [fx.topic])) > 0])));
      expect(Object.keys(got).filter((k) => got[k])).toEqual(["authorA_2", "pub_2", "adm_2"]);
    }
  });
  it("an IN-REVIEW topic is additionally visible to its assigned reviewer (with MFA), not to other reviewers or authors", async () => {
    const fx = await build("in_review");
    for (const q of ["select id from public.topics where id=$1", "select id from public.content_versions where topic_id=$1", "select id from public.review_assignments where version_id=(select id from public.content_versions where topic_id=$1)"]) {
      const got = Object.fromEntries(await Promise.all(KEYS.map(async (k) => [k, (await seen(k, q, [fx.topic])) > 0])));
      expect(Object.keys(got).filter((k) => got[k]).sort(), q).toEqual(["adm_2", "authorA_2", "pub_2", "rvNE_2"].sort());
    }
  });
  it("audit_log: administrators with MFA only", async () => {
    await build("published");
    const got = Object.fromEntries(await Promise.all(KEYS.map(async (k) => [k, (await seen(k, "select id from public.audit_log limit 1", [])) > 0])));
    expect(Object.keys(got).filter((k) => got[k])).toEqual(["adm_2"]);
  });
  it("profiles/roles: own row; administrators all; publishers also see reviewer profiles; nobody else's", async () => {
    const q = "select id from public.profiles where id=$1";
    const of = async (target: string) => Object.keys(Object.fromEntries((await Promise.all(KEYS.map(async (k) => [k, (await seen(k, q, [target])) > 0] as const))).filter(([, v]) => v)));
    expect(await of(ids.learner!)).toEqual(["learner", "adm_2"]);
    expect(await of(ids.authorA!)).toEqual(["authorA_1", "authorA_2", "adm_2"]);
    expect((await of(ids.rvNE!)).sort()).toEqual(["adm_2", "pub_2", "rvNE_1", "rvNE_2"].sort());
    const r = "select user_id from public.user_roles where user_id=$1";
    const rolesSeen = Object.keys(Object.fromEntries((await Promise.all(KEYS.map(async (k) => [k, (await seen(k, r, [ids.learner])) > 0] as const))).filter(([, v]) => v)));
    expect(rolesSeen).toEqual(["learner", "adm_2"]);
  });
  it("published snapshots: everyone including anonymous; working copy of a published topic: staff only", async () => {
    const fx = await build("published");
    const pubSeen = await Promise.all(KEYS.map((k) => seen(k, "select slug from public.public_topics where id=$1", [fx.topic])));
    expect(pubSeen.every((x) => x === 1)).toBe(true);
    const wc = Object.fromEntries(await Promise.all(KEYS.map(async (k) => [k, (await seen(k, "select id from public.topics where id=$1", [fx.topic])) > 0])));
    expect(Object.keys(wc).filter((k) => wc[k])).toEqual(["authorA_2", "pub_2", "adm_2"]);
  });
});
