import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, grantRole, owner, setupDb, uniqueEmail } from "./helpers";

const MFA = (id: string) => ({ id, aal: "aal2" as const });
let author: string, author2: string, rvNE: string, rvPH: string, rvBoth: string, publisher: string, admin: string, learner: string;
let domainId: string;
let n = 0;

async function addSource(opts: { draft?: boolean; licence?: string } = {}) {
  const r = await owner.query(
    "insert into public.sources (organization, title, url, is_draft_guideline, licence_class, version_label) values ('Org','Guideline','https://example.org/g',$1,$2,'v1') returning id",
    [opts.draft ?? false, opts.licence ?? "YELLOW"],
  );
  return r.rows[0].id as string;
}

/** Creates a complete, review-ready draft owned by `owner` through the API (as an MFA-verified author). */
async function readyTopic(opts: { roles?: string[]; origin?: string; by?: string; skipRef?: boolean } = {}) {
  const by = opts.by ?? author;
  const slug = `topic-${++n}`;
  const t = await asUser(MFA(by), "insert into public.topics (domain_id, slug, title, summary, required_review_roles, origin) values ($1,$2,$3,$4,$5,$6) returning id",
    [domainId, slug, JSON.stringify({ en: `Topic ${n}` }), JSON.stringify({ en: "Summary" }), opts.roles ?? ["NE"], opts.origin ?? "human"]);
  const id = t.rows[0].id as string;
  await asUser(MFA(by), "insert into public.topic_sections (topic_id, kind, sort, title, body) values ($1,'objectives',0,'{\"en\":\"Objectives\"}','{\"en\":\"- Learn\"}'), ($1,'overview',1,'{\"en\":\"Overview\"}','{\"en\":\"Text\"}')", [id]);
  if (!opts.skipRef) {
    const src = await addSource();
    await asUser(MFA(by), "insert into public.topic_references (topic_id, source_id, citation) values ($1,$2,'cite')", [id, src]);
  }
  return id;
}
const submit = (topic: string, by = author) => asUser(MFA(by), "select public.submit_for_review($1) as id", [topic]).then((r) => r.rows[0].id as string);
const status = async (topic: string) => (await owner.query("select status from public.topics where id=$1", [topic])).rows[0].status as string;
const vstatus = async (v: string) => (await owner.query("select status from public.content_versions where id=$1", [v])).rows[0].status as string;
const assign = (v: string, reviewer: string, spec: string) => asUser(MFA(publisher), "select public.assign_reviewer($1,$2,$3)", [v, reviewer, spec]);
const review = (v: string, reviewer: string, spec: string, decision: string, comments: string | null = null) =>
  asUser(MFA(reviewer), "select public.record_review($1,$2,$3::public.review_decision,$4)", [v, spec, decision, comments]);

/** Submits, assigns NE (and others) and approves everything so the version is publishable. */
async function approvedVersion(topic: string) {
  const v = await submit(topic);
  await assign(v, rvNE, "NE");
  await review(v, rvNE, "NE", "approve");
  return v;
}
const publish = (topic: string, v: string, by = publisher) => asUser(MFA(by), "select public.publish_topic($1,$2)", [topic, v]);
const publicTitle = async (slug: string) => (await asUser(null, "select snapshot->'title'->>'en' t, version_no from public.public_topics where slug=$1", [slug])).rows[0];

beforeAll(async () => {
  await setupDb();
  const mk = (p: string) => createUser(uniqueEmail(p));
  author = await mk("au"); author2 = await mk("au2"); rvNE = await mk("ne"); rvPH = await mk("ph"); rvBoth = await mk("both");
  publisher = await mk("pub"); admin = await mk("adm"); learner = await mk("lr");
  for (const [u, r] of [[author, "author"], [author2, "author"], [rvNE, "clinical_reviewer"], [rvPH, "clinical_reviewer"], [rvBoth, "clinical_reviewer"], [publisher, "publisher"], [admin, "admin"]] as const) await grantRole(u, r);
  for (const [u, s] of [[rvNE, "NE"], [rvPH, "PH"], [rvBoth, "NE"], [rvBoth, "PH"]] as const)
    await owner.query("insert into public.reviewer_specialties (user_id, specialty) values ($1,$2)", [u, s]);
  domainId = (await owner.query("select id from public.nursing_domains where slug='renal-metabolic'")).rows[0].id;
});
afterAll(closePool);

describe("submission validation", () => {
  it("lists every missing requirement and blocks submission", async () => {
    const t = (await asUser(MFA(author), "insert into public.topics (domain_id, slug, title) values ($1,'empty-topic','{\"en\":\"E\"}') returning id", [domainId])).rows[0].id;
    const p = (await asUser(MFA(author), "select public.validate_topic_for_review($1) as p", [t])).rows[0].p as string[];
    expect(p.join("|")).toMatch(/summary/);
    expect(p.join("|")).toMatch(/learning objectives/);
    expect(p.join("|")).toMatch(/reference/);
    await expect(submit(t)).rejects.toThrow(/not ready for review/);
    expect(await status(t)).toBe("draft");
  });
  it("refuses a cited draft guideline unless acknowledged, then labels it in the snapshot", async () => {
    const t = await readyTopic({ skipRef: true });
    const src = await addSource({ draft: true });
    await asUser(MFA(author), "insert into public.topic_references (topic_id, source_id) values ($1,$2)", [t, src]);
    await expect(submit(t)).rejects.toThrow(/not ready for review: .*draft guideline/);
    await asUser(MFA(author), "update public.topic_references set draft_acknowledged = true where topic_id=$1", [t]);
    const v = await submit(t);
    const snap = (await owner.query("select snapshot from public.content_versions where id=$1", [v])).rows[0].snapshot;
    expect(snap.references[0].is_draft_guideline).toBe(true);
  });
  it("requires an independence note for RED-licensed sources", async () => {
    const t = await readyTopic({ skipRef: true });
    const src = await addSource({ licence: "RED" });
    await asUser(MFA(author), "insert into public.topic_references (topic_id, source_id) values ($1,$2)", [t, src]);
    await expect(submit(t)).rejects.toThrow(/not ready for review: .*RED-licensed/);
    await asUser(MFA(author), "update public.topic_references set independently_written_note='own words' where topic_id=$1", [t]);
    await expect(submit(t)).resolves.toBeTruthy();
  });
  it("requires alt text and a verified licence for images", async () => {
    const t = await readyTopic();
    await asUser(MFA(author), "insert into public.topic_images (topic_id, storage_path, licence) values ($1::uuid, $1::text || '/' || gen_random_uuid() || '.png', 'unknown')", [t]);
    await expect(submit(t)).rejects.toThrow(/not ready for review: .*alt text/);
    await asUser(MFA(author), "update public.topic_images set alt_text='{\"en\":\"A diagram\"}' where topic_id=$1", [t]);
    await expect(submit(t)).rejects.toThrow(/not ready for review: .*reusable licence/);
    await asUser(MFA(author), "update public.topic_images set is_original = true where topic_id=$1", [t]);
    await expect(submit(t)).resolves.toBeTruthy();
  });
  it("requires two reviewer roles for AI-assisted content", async () => {
    const t = await readyTopic({ origin: "ai_assisted", roles: ["NE"] });
    await expect(submit(t)).rejects.toThrow(/not ready for review: .*AI-assisted content requires/);
  });
  it("only the author with MFA (or an admin) can submit", async () => {
    const t = await readyTopic();
    await expectDenied(asUser({ id: author, aal: "aal1" }, "select public.submit_for_review($1)", [t]));
    await expectDenied(asUser(MFA(author2), "select public.submit_for_review($1)", [t]));
    await expectDenied(asUser(MFA(learner), "select public.submit_for_review($1)", [t]));
    await expectDenied(asUser(null, "select public.submit_for_review($1)", [t]));
  });
  it("freezes the working copy while in review and snapshots the submitted content", async () => {
    const t = await readyTopic();
    const v = await submit(t);
    expect(await status(t)).toBe("in_review");
    expect((await asUser(MFA(author), "update public.topics set est_minutes=99 where id=$1 returning id", [t])).rowCount).toBe(0);
    await expectDenied(asUser(MFA(author), "insert into public.topic_sections (topic_id, kind, title, body) values ($1,'other','{\"en\":\"x\"}','{\"en\":\"y\"}')", [t]));
    await expect(submit(t)).rejects.toThrow(/in_review/);
    const snap = (await owner.query("select snapshot from public.content_versions where id=$1", [v])).rows[0].snapshot;
    expect(snap.sections).toHaveLength(2);
  });
  it("blocks demonstration content from clinical review", async () => {
    await owner.query(await import("node:fs").then((fs) => fs.readFileSync(new URL("../../supabase/seed.sql", import.meta.url), "utf8")));
    const id = (await owner.query("select id from public.topics where slug='demo-renal-metabolic'")).rows[0].id;
    await expect(asUser(MFA(admin), "select public.submit_for_review($1)", [id])).rejects.toThrow(/demonstration content/);
  });
});

describe("reviewer assignment", () => {
  it("is limited to publishers/admins with MFA and to eligible reviewers", async () => {
    const t = await readyTopic({ roles: ["NE", "PH"] });
    const v = await submit(t);
    await expectDenied(asUser(MFA(author), "select public.assign_reviewer($1,$2,'NE')", [v, rvNE]));
    await expectDenied(asUser({ id: publisher, aal: "aal1" }, "select public.assign_reviewer($1,$2,'NE')", [v, rvNE]));
    await expect(asUser(MFA(publisher), "select public.assign_reviewer($1,$2,'PH')", [v, rvNE])).rejects.toThrow(/specialty/);
    await expect(asUser(MFA(publisher), "select public.assign_reviewer($1,$2,'RT')", [v, rvNE])).rejects.toThrow(/not required/);
    await expect(asUser(MFA(publisher), "select public.assign_reviewer($1,$2,'NE')", [v, learner])).rejects.toThrow(/not a clinical reviewer/);
    await owner.query("insert into public.user_roles (user_id, role) values ($1,'clinical_reviewer') on conflict do nothing", [author]);
    await owner.query("insert into public.reviewer_specialties (user_id, specialty) values ($1,'NE') on conflict do nothing", [author]);
    await expect(asUser(MFA(publisher), "select public.assign_reviewer($1,$2,'NE')", [v, author])).rejects.toThrow(/own content/);
    await owner.query("delete from public.user_roles where user_id=$1 and role='clinical_reviewer'", [author]);
  });
});

describe("review decisions", () => {
  it("rejects reviews from unassigned users, authors and reviewers without MFA", async () => {
    const t = await readyTopic();
    const v = await submit(t);
    await assign(v, rvNE, "NE");
    await expectDenied(review(v, rvPH, "NE", "approve"));
    await expectDenied(asUser({ id: rvNE, aal: "aal1" }, "select public.record_review($1,'NE','approve',null)", [v]));
    await expectDenied(review(v, author, "NE", "approve"));
    await expectDenied(review(v, learner, "NE", "approve"));
    expect(await status(t)).toBe("in_review");
  });
  it("requires comments for change requests, returns the topic to the author, and allows resubmission as a new version", async () => {
    const t = await readyTopic();
    const v1 = await submit(t);
    await assign(v1, rvNE, "NE");
    await expect(review(v1, rvNE, "NE", "request_changes")).rejects.toThrow(/comments are required/);
    await review(v1, rvNE, "NE", "request_changes", "Please add escalation criteria");
    expect(await vstatus(v1)).toBe("changes_requested");
    expect(await status(t)).toBe("changes_requested");
    const seen = await asUser(MFA(author), "select comments from public.content_reviews where version_id=$1", [v1]);
    expect(seen.rows[0].comments).toMatch(/escalation/);
    await asUser(MFA(author), "update public.topics set est_minutes = 30 where id=$1", [t]);
    const v2 = await submit(t);
    expect((await owner.query("select version_no from public.content_versions where id=$1", [v2])).rows[0].version_no).toBe(2);
  });
  it("requires every required role, from distinct reviewers", async () => {
    const t = await readyTopic({ roles: ["NE", "PH"] });
    const v = await submit(t);
    await assign(v, rvBoth, "NE");
    await assign(v, rvBoth, "PH");
    await assign(v, rvPH, "PH");
    await review(v, rvBoth, "NE", "approve");
    expect(await vstatus(v)).toBe("in_review");
    await review(v, rvBoth, "PH", "approve");
    expect(await vstatus(v)).toBe("in_review"); // one person covering two roles is not enough
    await assign(v, rvPH, "PH");
    await review(v, rvPH, "PH", "approve");
    expect(await vstatus(v)).toBe("approved"); // a second, distinct reviewer completes the set
  });
  it("approves once distinct reviewers cover all roles", async () => {
    const t = await readyTopic({ roles: ["NE", "PH"] });
    const v = await submit(t);
    await assign(v, rvNE, "NE");
    await assign(v, rvPH, "PH");
    await review(v, rvNE, "NE", "approve");
    expect(await status(t)).toBe("in_review");
    await review(v, rvPH, "PH", "approve");
    expect(await vstatus(v)).toBe("approved");
    expect(await status(t)).toBe("approved");
  });
  it("a single rejection ends the version", async () => {
    const t = await readyTopic({ roles: ["NE", "PH"] });
    const v = await submit(t);
    await assign(v, rvNE, "NE");
    await assign(v, rvPH, "PH");
    await review(v, rvNE, "NE", "approve");
    await review(v, rvPH, "PH", "reject", "Unsafe medication statement");
    expect(await vstatus(v)).toBe("rejected");
    expect(await status(t)).toBe("changes_requested");
  });
  it("AI-assisted content can never be approved by one reviewer, even if distinctness is disabled", async () => {
    await owner.query("update public.app_settings set require_distinct_reviewers = false");
    try {
      const t = await readyTopic({ origin: "ai_generated", roles: ["NE", "PH"] });
      const v = await submit(t);
      await assign(v, rvBoth, "NE");
      await assign(v, rvBoth, "PH");
      await review(v, rvBoth, "NE", "approve");
      await review(v, rvBoth, "PH", "approve");
      expect(await vstatus(v)).toBe("in_review");
      expect(await status(t)).toBe("in_review");
      await assign(v, rvNE, "NE");
      await review(v, rvNE, "NE", "approve");
      expect(await vstatus(v)).toBe("approved"); // two distinct human reviewers satisfy the AI rule
    } finally {
      await owner.query("update public.app_settings set require_distinct_reviewers = true");
    }
  });
  it("reviews are immutable, even for the database owner", async () => {
    await expect(owner.query("update public.content_reviews set decision='approve'")).rejects.toThrow(/immutable/);
    await expect(owner.query("delete from public.content_reviews")).rejects.toThrow(/immutable/);
  });
});

describe("publication", () => {
  it("cannot publish an unapproved version or without the publisher role", async () => {
    const t = await readyTopic();
    const v = await submit(t);
    await expect(publish(t, v)).rejects.toThrow(/only an approved version/);
    await assign(v, rvNE, "NE");
    await review(v, rvNE, "NE", "approve");
    await expectDenied(publish(t, v, author));
    await expectDenied(publish(t, v, rvNE));
    await expectDenied(asUser({ id: publisher, aal: "aal1" }, "select public.publish_topic($1,$2)", [t, v]));
    await expectDenied(asUser(null, "select public.publish_topic($1,$2)", [t, v]));
    expect((await asUser(null, "select 1 from public.public_topics where id=$1", [t])).rowCount).toBe(0);
  });
  it("publishes an approved version: learners see the snapshot with reviewer roles and review dates", async () => {
    const t = await readyTopic();
    const v = await approvedVersion(t);
    await publish(t, v);
    const slug = (await owner.query("select slug from public.topics where id=$1", [t])).rows[0].slug;
    expect((await publicTitle(slug)).version_no).toBe(1);
    const r = (await asUser(null, "select snapshot->'reviewer_roles' as roles, last_reviewed_at, next_review_at from public.public_topics where slug=$1", [slug])).rows[0];
    expect(r.roles).toEqual(["NE"]);
    expect(r.last_reviewed_at).not.toBeNull();
    expect(new Date(r.next_review_at).getTime()).toBeGreaterThan(Date.now());
    expect(await status(t)).toBe("published");
  });
  it("cannot be forged through direct writes or internal functions", async () => {
    const t = await readyTopic();
    const v = await submit(t);
    const A = MFA(author);
    await expectDenied(asUser(A, "update public.content_versions set status='approved' where id=$1", [v]));
    await expectDenied(asUser(A, "insert into public.content_reviews (version_id, reviewer_id, specialty, decision) values ($1,$2,'NE','approve')", [v, author]));
    await expectDenied(asUser(MFA(admin), "insert into public.content_reviews (version_id, reviewer_id, specialty, decision) values ($1,$2,'NE','approve')", [v, admin]));
    await expectDenied(asUser(MFA(admin), "update public.topics set status='published' where id=$1", [t]));
    await expectDenied(asUser(MFA(admin), "update public.topics set published_version_id=$2 where id=$1", [t, v]));
    await expectDenied(asUser(MFA(admin), "select public._evaluate_version($1)", [v]));
    await expectDenied(asUser(MFA(admin), "select public._topic_snapshot($1)", [t]));
    await expectDenied(asUser(MFA(admin), "insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin) values ($1,99,'approved','{}','{NE}','human')", [t]));
    expect(await vstatus(v)).toBe("in_review");
  });
  it("revisions: live content is unchanged until the new version is approved and published; old versions can be restored", async () => {
    const t = await readyTopic();
    const v1 = await approvedVersion(t);
    await publish(t, v1);
    const slug = (await owner.query("select slug from public.topics where id=$1", [t])).rows[0].slug;
    const original = await publicTitle(slug);

    await expectDenied(asUser(MFA(author2), "select public.start_revision($1)", [t]));
    await asUser(MFA(author), "select public.start_revision($1)", [t]);
    await asUser(MFA(author), "update public.topics set title='{\"en\":\"Revised title\"}' where id=$1", [t]);
    expect((await publicTitle(slug)).t).toBe(original.t); // draft edit invisible to learners

    const v2 = await submit(t);
    await assign(v2, rvNE, "NE");
    await review(v2, rvNE, "NE", "approve");
    expect((await publicTitle(slug)).t).toBe(original.t); // approved but not yet published
    await publish(t, v2);
    expect((await publicTitle(slug)).t).toBe("Revised title");
    expect(await vstatus(v1)).toBe("superseded");

    await expect(asUser(MFA(publisher), "select public.rollback_topic($1,$2,'oops')", [t, v1])).rejects.toThrow(/reason/);
    await expectDenied(asUser(MFA(author), "select public.rollback_topic($1,$2,'a long enough reason')", [t, v1]));
    await asUser(MFA(publisher), "select public.rollback_topic($1,$2,'Error found in revised text')", [t, v1]);
    expect((await publicTitle(slug)).t).toBe(original.t);
    expect(await vstatus(v2)).toBe("superseded");
    await expect(asUser(MFA(publisher), "select public.rollback_topic($1,$2,'cannot restore a never-published draft')", [t, v1])).rejects.toThrow(/superseded/);
  });
  it("published snapshots are immutable when the working copy changes later", async () => {
    const t = await readyTopic();
    const v = await approvedVersion(t);
    await publish(t, v);
    const before = (await owner.query("select snapshot from public.content_versions where id=$1", [v])).rows[0].snapshot;
    await asUser(MFA(author), "select public.start_revision($1)", [t]);
    await asUser(MFA(author), "update public.topic_sections set body='{\"en\":\"CHANGED\"}' where topic_id=$1", [t]);
    const after = (await owner.query("select snapshot from public.content_versions where id=$1", [v])).rows[0].snapshot;
    expect(after).toEqual(before);
  });
  it("archives (hides) and restores topics with a recorded reason", async () => {
    const t = await readyTopic();
    const v = await approvedVersion(t);
    await publish(t, v);
    const slug = (await owner.query("select slug from public.topics where id=$1", [t])).rows[0].slug;
    await expect(asUser(MFA(publisher), "select public.archive_topic($1,'short')", [t])).rejects.toThrow(/reason/);
    await expectDenied(asUser(MFA(author), "select public.archive_topic($1,'outdated and withdrawn')", [t]));
    await asUser(MFA(publisher), "select public.archive_topic($1,'Guideline superseded by 2026 update')", [t]);
    expect(await publicTitle(slug)).toBeUndefined();
    await expectDenied(asUser(MFA(publisher), "select public.restore_topic($1)", [t]));
    await asUser(MFA(admin), "select public.restore_topic($1)", [t]);
    expect((await publicTitle(slug)).version_no).toBe(1);
  });
  it("withdraws a submission back to draft", async () => {
    const t = await readyTopic();
    const v = await submit(t);
    await expectDenied(asUser(MFA(author2), "select public.withdraw_submission($1)", [t]));
    await asUser(MFA(author), "select public.withdraw_submission($1)", [t]);
    expect(await status(t)).toBe("draft");
    expect(await vstatus(v)).toBe("withdrawn");
  });
});

describe("visibility and audit trail", () => {
  it("lets only assigned reviewers (and staff/author) read an in-review topic", async () => {
    const t = await readyTopic();
    const v = await submit(t);
    await assign(v, rvNE, "NE");
    expect((await asUser(MFA(rvNE), "select 1 from public.topics where id=$1", [t])).rowCount).toBe(1);
    expect((await asUser(MFA(rvNE), "select 1 from public.topic_sections where topic_id=$1", [t])).rowCount).toBeGreaterThan(0);
    expect((await asUser(MFA(rvPH), "select 1 from public.topics where id=$1", [t])).rowCount).toBe(0);
    expect((await asUser(MFA(author2), "select 1 from public.content_versions where id=$1", [v])).rowCount).toBe(0);
    expect((await asUser(MFA(learner), "select 1 from public.content_versions")).rowCount).toBe(0);
  });
  it("records every workflow transition with the acting user", async () => {
    const t = await readyTopic();
    const v = await approvedVersion(t);
    await publish(t, v);
    const r = await owner.query("select action, actor from public.audit_log where entity_type='topic' and entity_id=$1 and action in ('submit_for_review','assign_reviewer','record_review','publish') order by id", [t]);
    expect(r.rows.map((x) => x.action)).toEqual(["submit_for_review", "assign_reviewer", "record_review", "publish"]);
    expect(r.rows.map((x) => x.actor)).toEqual([author, publisher, rvNE, publisher]);
  });
});
