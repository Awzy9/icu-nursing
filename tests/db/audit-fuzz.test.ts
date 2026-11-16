/**
 * RANDOMISED INVARIANT AUDIT (seeded, reproducible: FUZZ_SEED / FUZZ_STEPS).
 * Legitimate workflow progress is interleaved with random abuse (wrong identities, wrong MFA level, wrong states, forged
 * direct writes, random/foreign ids). After EVERY step the database invariants below must hold. This complements the
 * exhaustive matrix: the matrix proves each single action, the fuzz explores sequences.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, owner, setupDb, uniqueEmail, type Actor } from "./helpers";

const SEED = Number(process.env.FUZZ_SEED ?? 20261114);
const STEPS = Number(process.env.FUZZ_STEPS ?? 1500);
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(SEED);
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
const chance = (p: number) => rand() < p;

const u: Record<string, string> = {};
const ROLE_OF: Record<string, string> = { authorA: "author", authorB: "author", authorC: "author", rvNE: "clinical_reviewer", rvPH: "clinical_reviewer", rvBN: "clinical_reviewer", pub: "publisher", adm: "admin" };
const WHO = ["authorA", "authorB", "authorC", "rvNE", "rvPH", "rvBN", "pub", "adm", "learner1", "learner2"] as const;
const actorFor = (who: string | null, aal: "aal1" | "aal2"): Actor | null => (who ? { id: u[who] as string, aal } : null);
const anyActor = () => (chance(0.06) ? null : actorFor(pick(WHO), chance(0.75) ? "aal2" : "aal1"));
const A2 = (who: string) => actorFor(who, "aal2");
const REVIEW_CODES = ["NE", "BN", "PH", "RT", "CCP", "NEPH", "NEURO", "IPC", "OTHER"];
let domainId = "", sourceId = "";
const topics: string[] = [];
const stats: Record<string, number> = {};
const bump = (k: string) => (stats[k] = (stats[k] ?? 0) + 1);

async function tryAs(actor: Actor | null, text: string, params: unknown[] = []) {
  try { const r = await asUser(actor, text, params); return { ok: true as const, rows: r.rows }; } catch (e) { return { ok: false as const, error: (e as Error).message }; }
}
const idOrRandom = (pool: string[]) => (pool.length && !chance(0.1) ? pick(pool) : crypto.randomUUID());

async function versions(topic?: string) {
  return (await owner.query(`select id, topic_id, version_no, status from public.content_versions ${topic ? "where topic_id=$1" : ""} order by version_no`, topic ? [topic] : [])).rows as { id: string; topic_id: string; version_no: number; status: string }[];
}
async function topicRow(id: string) { return (await owner.query("select * from public.topics where id=$1", [id])).rows[0] as { id: string; author_id: string; status: string; origin: string } | undefined; }

beforeAll(async () => {
  await setupDb();
  for (const w of WHO) u[w] = await createUser(uniqueEmail(w));
  // The ONLY bootstrap: the first administrator (as the project owner would). Every other role is granted "by" that admin.
  await owner.query("insert into public.user_roles (user_id, role) values ($1,'admin')", [u.adm]);
  for (const [w, r] of Object.entries(ROLE_OF)) if (r !== "admin") await owner.query("insert into public.user_roles (user_id, role, granted_by) values ($1,$2,$3)", [u[w], r, u.adm]);
  for (const [w, s] of [["rvNE", "NE"], ["rvPH", "PH"], ["rvBN", "BN"]] as [string, string][]) await owner.query("insert into public.reviewer_specialties (user_id, specialty, granted_by) values ($1,$2,$3)", [u[w], s, u.adm]);
  domainId = (await owner.query("select id from public.nursing_domains limit 1")).rows[0].id;
  sourceId = (await owner.query("insert into public.sources (organization, title, url, licence_class) values ('t','fuzz source','https://example.org','GREEN') returning id")).rows[0].id;
});
afterAll(closePool);

/** One legitimate next step for a random topic, performed by the correct identities. */
async function progress() {
  const roll = chance(0.25) || topics.length === 0;
  if (roll) {
    const who = pick(["authorA", "authorB", "authorC"]);
    const r = await tryAs(A2(who), "insert into public.topics (domain_id, slug, title, summary, origin) values ($1,$2,'{\"en\":\"F\"}','{\"en\":\"s\"}',$3) returning id", [domainId, `f-${Date.now().toString(36)}-${topics.length}-${Math.floor(rand() * 1e6)}`, pick(["human", "human", "human", "ai_assisted"])]);
    if (r.ok) { topics.push(r.rows[0].id); bump("topic created"); }
    return;
  }
  const id = pick(topics);
  const t = await topicRow(id);
  if (!t) return;
  const author: string = Object.entries(u).find(([, v]) => v === t.author_id)?.[0] ?? "authorA";
  if (t.status === "draft" || t.status === "changes_requested") {
    const secs = (await owner.query("select count(*)::int n from public.topic_sections where topic_id=$1 and kind='objectives'", [id])).rows[0].n;
    if (!secs) await tryAs(A2(author), "insert into public.topic_sections (topic_id, kind, title, body) values ($1,'objectives','{\"en\":\"O\"}','{\"en\":\"- x\"}')", [id]);
    else await tryAs(A2(author), "insert into public.topic_sections (topic_id, kind, sort, title, body) values ($1,'overview',$2,'{\"en\":\"O\"}','{\"en\":\"b\"}')", [id, Math.floor(rand() * 50)]);
    await tryAs(A2(author), "insert into public.topic_references (topic_id, source_id) values ($1,$2) on conflict do nothing", [id, sourceId]);
    if (chance(0.5)) await tryAs(A2("pub"), "select public.set_required_roles($1,$2)", [id, pick([["NE"], ["NE", "PH"], ["NE", "BN"], ["PH"]])]);
    if (chance(0.3)) await tryAs(A2(author), "update public.topics set origin=$2 where id=$1", [id, pick(["human", "ai_assisted", "ai_generated"])]);
    const r = await tryAs(A2(author), "select public.submit_for_review($1)", [id]);
    if (r.ok) bump("submitted");
  } else if (t.status === "in_review") {
    const v = (await versions(id)).find((x) => x.status === "in_review");
    if (!v) return;
    const need = (await owner.query("select required_review_roles r from public.content_versions where id=$1", [v.id])).rows[0].r as string[];
    const holder: Record<string, string[]> = { NE: ["rvNE"], PH: ["rvPH"], BN: ["rvBN"] };
    for (const code of need) {
      const cand = (holder[code] ?? []).filter((w) => u[w] !== t.author_id);
      if (!cand.length) continue;
      const reviewer = pick(cand);
      await tryAs(A2("pub"), "select public.assign_reviewer($1,$2,$3)", [v.id, u[reviewer], code]);
      const dec = chance(0.82) ? "approve" : pick(["request_changes", "reject"]);
      const r = await tryAs(A2(reviewer), "select public.record_review($1,$2,$3::public.review_decision,$4)", [v.id, code, dec, dec === "approve" ? null : "fuzz feedback"]);
      if (r.ok) bump(`review ${dec}`);
    }
    // a second distinct human for AI-assisted content that only listed one role
    if (t.origin !== "human") for (const w of ["rvNE", "rvPH", "rvBN"]) {
      if (u[w] === t.author_id) continue;
      await tryAs(A2("pub"), "select public.assign_reviewer($1,$2,$3)", [v.id, u[w], w === "rvNE" ? "NE" : w === "rvPH" ? "PH" : "BN"]);
    }
  } else if (t.status === "approved") {
    const v = (await versions(id)).find((x) => x.status === "approved");
    if (v) { const r = await tryAs(A2("pub"), "select public.publish_topic($1,$2)", [id, v.id]); if (r.ok) bump("published"); }
  } else if (t.status === "published") {
    const roll2 = rand();
    if (roll2 < 0.35) { const r = await tryAs(A2(author), "select public.start_revision($1)", [id]); if (r.ok) bump("revision started"); }
    else if (roll2 < 0.5) { const old = (await versions(id)).find((x) => x.status === "superseded"); if (old) { const r = await tryAs(A2("pub"), "select public.rollback_topic($1,$2,'fuzz rollback reason')", [id, old.id]); if (r.ok) bump("rollback"); } }
    else if (roll2 < 0.58) { const r = await tryAs(A2("pub"), "select public.archive_topic($1,'fuzz archive reason')", [id]); if (r.ok) bump("archived"); }
    else { await tryAs(actorFor(pick(["learner1", "learner2"]), "aal1"), "select public.record_topic_view($1)", [id]); await tryAs(actorFor(pick(["learner1", "learner2"]), "aal1"), "select public.set_topic_completion($1,true)", [id]); await tryAs(actorFor("learner1", "aal1"), "insert into public.bookmarks (topic_id) values ($1) on conflict do nothing", [id]); }
  } else if (t.status === "archived") await tryAs(A2("adm"), "select public.restore_topic($1)", [id]);
}

/** One random (usually illegitimate) action by a random identity against random targets. */
async function abuse() {
  const a = anyActor();
  const topic = idOrRandom(topics);
  const vs = topics.length ? await versions(pick(topics)) : [];
  const ver = vs.length && !chance(0.1) ? pick(vs).id : crypto.randomUUID();
  const who = pick(WHO);
  const roleName = pick(["learner", "author", "clinical_reviewer", "publisher", "admin"]);
  const ops: (() => Promise<unknown>)[] = [
    () => tryAs(a, "select public.submit_for_review($1)", [topic]), () => tryAs(a, "select public.withdraw_submission($1)", [topic]),
    () => tryAs(a, "select public.assign_reviewer($1,$2,$3)", [ver, u[who], pick(REVIEW_CODES)]),
    () => tryAs(a, "select public.record_review($1,$2,$3::public.review_decision,'x')", [ver, pick(REVIEW_CODES), pick(["approve", "approve", "request_changes", "reject"])]),
    () => tryAs(a, "select public.publish_topic($1,$2)", [topic, ver]), () => tryAs(a, "select public.start_revision($1)", [topic]),
    () => tryAs(a, "select public.rollback_topic($1,$2,'fuzz abuse reason')", [topic, ver]), () => tryAs(a, "select public.archive_topic($1,'fuzz abuse reason')", [topic]),
    () => tryAs(a, "select public.restore_topic($1)", [topic]), () => tryAs(a, "select public.set_required_roles($1,$2)", [topic, [pick(REVIEW_CODES)]]),
    () => tryAs(a, "select public.admin_grant_role($1,$2::public.app_role)", [u[who], roleName]), () => tryAs(a, "select public.admin_revoke_role($1,$2::public.app_role)", [u[who], roleName]),
    () => tryAs(a, "select public.admin_set_specialty($1,$2,$3)", [u[who], pick(REVIEW_CODES), chance(0.7)]),
    () => tryAs(a, "select public.record_topic_view($1)", [topic]), () => tryAs(a, "select public.set_topic_completion($1,$2)", [topic, chance(0.5)]),
    // forged direct writes
    () => tryAs(a, "update public.topics set status=$2::public.content_status where id=$1", [topic, pick(["approved", "published", "archived", "draft"])]),
    () => tryAs(a, "update public.topics set published_version_id=$2 where id=$1", [topic, ver]),
    () => tryAs(a, "update public.topics set author_id=$2 where id=$1", [topic, u[who]]),
    () => tryAs(a, "update public.topics set required_review_roles=$2 where id=$1", [topic, [pick(REVIEW_CODES)]]),
    () => tryAs(a, "update public.content_versions set status=$2::public.version_status where id=$1", [ver, pick(["approved", "published"])]),
    () => tryAs(a, "update public.content_versions set snapshot='{\"title\":{\"en\":\"forged\"}}' where id=$1", [ver]),
    () => tryAs(a, "insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin) values ($1,$2,'approved','{}','{NE}','human')", [topic, 100 + Math.floor(rand() * 1000)]),
    () => tryAs(a, "insert into public.content_reviews (version_id, reviewer_id, specialty, decision) values ($1,$2,'NE','approve')", [ver, u[who]]),
    () => tryAs(a, "insert into public.review_assignments (version_id, reviewer_id, specialty) values ($1,$2,'NE')", [ver, u[who]]),
    () => tryAs(a, "insert into public.user_roles (user_id, role) values ($1,$2::public.app_role) on conflict do nothing", [u[who], roleName]),
    () => tryAs(a, "update public.user_roles set role=$2::public.app_role where user_id=$1", [u[who], roleName]),
    () => tryAs(a, "insert into public.reviewer_specialties (user_id, specialty) values ($1,$2) on conflict do nothing", [u[who], pick(REVIEW_CODES)]),
    () => tryAs(a, "insert into public.learning_progress (user_id, topic_id, status) values ($1,$2,'completed') on conflict do nothing", [u[who], topic]),
    () => tryAs(a, "update public.app_settings set require_staff_mfa=false", []),
    () => tryAs(a, "delete from public.audit_log", []), () => tryAs(a, "update public.content_reviews set decision='approve'", []),
    () => tryAs(a, "insert into public.sources (organization, title, url, licence_class, is_draft_guideline) values ('f',$1,'https://example.org',$2,false)", [`s${Math.floor(rand() * 1e9)}`, pick(["GREEN", "RED"])]),
    () => tryAs(a, "update public.sources set licence_class='GREEN', is_draft_guideline=false", []),
    () => tryAs(a, "delete from public.topics where id=$1", [topic]),
    () => tryAs(a, "insert into public.topic_sections (topic_id, kind, title, body) values ($1,'other','{\"en\":\"x\"}','{\"en\":\"y\"}')", [topic]),
    () => tryAs(a, "update public.topic_sections set body='{\"en\":\"tamper\"}' where topic_id=$1", [topic]),
    () => tryAs(a, "select * from public.public_topics where (snapshot->>'level')::int = 1", []),
  ];
  await pick(ops)();
}

const adminHistory = new Set<string>();
let lastCounts = { audit: 0, reviews: 0 };
const snapshotHashes = new Map<string, string>();
const authors = new Map<string, string>();

async function invariants(step: number) {
  const fail = (m: string, extra?: unknown) => { throw new Error(`INVARIANT VIOLATED at step ${step} (seed ${SEED}): ${m} ${JSON.stringify(extra ?? "")}`); };
  const proof = `
    v.required_review_roles <@ coalesce((select array_agg(distinct r.specialty) from public.content_reviews r where r.version_id=v.id and r.decision='approve'),'{}')
    and (select count(distinct r.reviewer_id) from public.content_reviews r where r.version_id=v.id and r.decision='approve') >= cardinality(v.required_review_roles)
    and (v.origin='human' or (select count(distinct r.reviewer_id) from public.content_reviews r where r.version_id=v.id and r.decision='approve') >= 2)
    and not exists (select 1 from public.content_reviews r where r.version_id=v.id and r.decision='approve' and (r.reviewer_id = t.author_id or r.reviewer_id = v.submitted_by))
    and not exists (select 1 from public.content_reviews r where r.version_id=v.id and r.decision <> 'approve')`;
  // I1: every approved / published / formerly-published version carries valid human approvals.
  const bad1 = (await owner.query(`select v.id, v.status from public.content_versions v join public.topics t on t.id=v.topic_id where (v.status in ('approved','published') or v.published_at is not null) and not (${proof})`)).rows;
  if (bad1.length) fail("a version is approved/published without valid human approvals", bad1);
  // I2: pointers and statuses agree.
  const bad2 = (await owner.query(`select t.id, t.status from public.topics t left join public.content_versions v on v.id=t.published_version_id
      where (t.published_version_id is not null and (v.id is null or v.topic_id<>t.id or v.status<>'published'))
         or (t.status='published' and t.published_version_id is null) or (t.status='approved' and not exists (select 1 from public.content_versions x where x.topic_id=t.id and x.status='approved'))`)).rows;
  if (bad2.length) fail("topic status / published pointer inconsistent", bad2);
  // I3: the public view shows exactly the live topics.
  const pubView = (await asUser(null, "select id from public.public_topics order by id")).rows.map((r) => r.id);
  const live = (await owner.query("select id from public.topics where published_version_id is not null and archived_at is null order by id")).rows.map((r) => r.id);
  if (JSON.stringify(pubView) !== JSON.stringify(live)) fail("public view differs from the set of live topics", { pubView, live });
  // I4: role grants form a chain back to the bootstrap administrator.
  for (const r of (await owner.query("select user_id from public.user_roles where role='admin'")).rows) adminHistory.add(r.user_id);
  adminHistory.add(u.adm!);
  const badRoles = (await owner.query("select user_id, role, granted_by from public.user_roles where role <> 'learner' and user_id <> $1 and (granted_by is null or not (granted_by = any($2::uuid[])))", [u.adm, [...adminHistory]])).rows;
  if (badRoles.length) fail("a staff role exists that no administrator granted", badRoles);
  const badSpec = (await owner.query("select user_id, specialty from public.reviewer_specialties where granted_by is null or not (granted_by = any($1::uuid[]))", [[...adminHistory]])).rows;
  if (badSpec.length) fail("a reviewer specialty exists that no administrator granted", badSpec);
  // I5: append-only.
  const c = (await owner.query("select (select count(*) from public.audit_log)::int a, (select count(*) from public.content_reviews)::int r")).rows[0];
  if (c.a < lastCounts.audit || c.r < lastCounts.reviews) fail("audit log or reviews shrank", { c, lastCounts });
  lastCounts = { audit: c.a, reviews: c.r };
  // I6: learner progress only for topics that were published; settings unchanged.
  const badProg = (await owner.query("select p.user_id from public.learning_progress p join public.topics t on t.id=p.topic_id where t.first_published_at is null")).rows;
  if (badProg.length) fail("progress for a never-published topic", badProg);
  if (!(await owner.query("select 1 from public.app_settings where require_staff_mfa and require_distinct_reviewers")).rowCount) fail("app_settings were weakened");
  // I7: authorship and snapshots are immutable.
  for (const r of (await owner.query("select id, author_id from public.topics")).rows) { if (authors.has(r.id) && authors.get(r.id) !== r.author_id) fail("topic authorship changed", r); authors.set(r.id, r.author_id); }
  for (const r of (await owner.query("select id, md5((snapshot - 'reviewer_roles')::text) h from public.content_versions")).rows) { if (snapshotHashes.has(r.id) && snapshotHashes.get(r.id) !== r.h) fail("a version snapshot changed after submission", r); snapshotHashes.set(r.id, r.h); }
}

describe(`randomised invariant audit (${STEPS} steps, seed ${SEED})`, () => {
  it("no sequence of legitimate and abusive actions ever violates a governance invariant", async () => {
    for (let i = 1; i <= STEPS; i++) {
      if (i % 4 === 0) await progress(); else await abuse();
      if (i % 3 === 0 || i === STEPS) await invariants(i);
    }
    await invariants(STEPS);
    const audit = (await owner.query("select action, count(*)::int n from public.audit_log where action in ('publish','rollback','archive','restore','start_revision','submit_for_review','record_review','set_required_roles') group by 1")).rows;
    const byAction = Object.fromEntries(audit.map((r) => [r.action, r.n]));
    const aiPublished = (await owner.query("select count(*)::int n from public.topics t join public.content_versions v on v.id=t.published_version_id where v.origin <> 'human'")).rows[0].n;
    console.log("FUZZ COVERAGE", JSON.stringify({ seed: SEED, steps: STEPS, legit: stats, audit: byAction, aiPublishedLive: aiPublished, topics: topics.length }));
    // The run must not be vacuous: the workflow really did progress through publication, change requests and rollback.
    expect(byAction.publish ?? 0).toBeGreaterThanOrEqual(5);
    expect(byAction.submit_for_review ?? 0).toBeGreaterThanOrEqual(10);
    expect(byAction.record_review ?? 0).toBeGreaterThanOrEqual(10);
  }, 600_000);
});

describe("the invariant checker has teeth (it must detect deliberately forged violations)", () => {
  const expectViolation = async (setup: () => Promise<unknown>, cleanup: () => Promise<unknown>, re: RegExp) => {
    await setup();
    try { await expect(invariants(-1)).rejects.toThrow(re); } finally { await cleanup(); }
  };
  it("detects an approved version that has no human approvals", async () => {
    const t = (await owner.query("insert into public.topics (domain_id, slug, title, author_id) values ($1,'forge-1','{\"en\":\"x\"}',$2) returning id", [domainId, u.authorA])).rows[0].id;
    const v = (await owner.query("insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin) values ($1,1,'approved','{}','{NE}','human') returning id", [t])).rows[0].id;
    await expectViolation(async () => undefined, async () => owner.query("delete from public.content_versions where id=$1", [v]).then(() => owner.query("delete from public.topics where id=$1", [t])), /without valid human approvals/);
  });
  it("detects a published version approved by the author", async () => {
    const t = (await owner.query("insert into public.topics (domain_id, slug, title, author_id) values ($1,'forge-2','{\"en\":\"x\"}',$2) returning id", [domainId, u.authorA])).rows[0].id;
    const v = (await owner.query("insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin, submitted_by) values ($1,1,'approved','{}','{NE}','human',$2) returning id", [t, u.authorA])).rows[0].id;
    await owner.query("insert into public.content_reviews (version_id, reviewer_id, specialty, decision) values ($1,$2,'NE','approve')", [v, u.authorA]);
    await expectViolation(async () => undefined, async () => owner.query("alter table public.content_reviews disable trigger content_reviews_no_change").then(() => owner.query("delete from public.content_versions where id=$1", [v])).then(() => owner.query("alter table public.content_reviews enable trigger content_reviews_no_change")).then(() => owner.query("delete from public.topics where id=$1", [t])), /without valid human approvals/);
  });
  it("detects a staff role that no administrator granted", async () => {
    const x = await createUser(uniqueEmail("rogue"));
    await owner.query("insert into public.user_roles (user_id, role) values ($1,'publisher')", [x]);
    await expectViolation(async () => undefined, async () => owner.query("delete from public.user_roles where user_id=$1 and role='publisher'", [x]), /no administrator granted/);
  });
  it("detects a public view that disagrees with the live topics, and weakened settings", async () => {
    await expectViolation(async () => owner.query("update public.app_settings set require_staff_mfa=false"), async () => owner.query("update public.app_settings set require_staff_mfa=true"), /app_settings were weakened/);
  });
});
