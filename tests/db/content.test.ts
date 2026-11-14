import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, setupDb, createUser, expectDenied, grantRole, owner, uniqueEmail } from "./helpers";

let learnerA: string, learnerB: string, authorA: string, authorB: string, admin: string, reviewer: string;
let domainId: string, pubTopic: string, draftTopic: string, archivedTopic: string, authorDraft: string;

async function mkTopic(slug: string, status: string, author: string | null, published: boolean, title = slug) {
  const t = await owner.query(
    "insert into public.topics (domain_id, slug, kind, status, title, author_id) values ($1,$2,'clinical',$3,$4,$5) returning id",
    [domainId, slug, status, JSON.stringify({ en: title }), author],
  );
  const id = t.rows[0].id as string;
  if (published) {
    const snap = { title: { en: `${title} (published)` }, level: "beginner", est_minutes: 10, sections: [], actions: [], references: [], images: [] };
    const v = await owner.query(
      "insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin, published_at) values ($1,1,'published',$2,'{NE}','human',now()) returning id",
      [id, JSON.stringify(snap)],
    );
    await owner.query("update public.topics set published_version_id=$1 where id=$2", [v.rows[0].id, id]);
  }
  return id;
}

beforeAll(async () => {
  await setupDb();
  const mk = (p: string) => createUser(uniqueEmail(p));
  learnerA = await mk("la");
  learnerB = await mk("lb");
  authorA = await mk("aa");
  authorB = await mk("ab");
  admin = await mk("ad");
  reviewer = await mk("rv");
  await grantRole(authorA, "author");
  await grantRole(authorB, "author");
  await grantRole(admin, "admin");
  await grantRole(reviewer, "clinical_reviewer");
  domainId = (await owner.query("select id from public.nursing_domains where slug='respiratory-airway'")).rows[0].id;
  pubTopic = await mkTopic("published-one", "published", authorA, true);
  draftTopic = await mkTopic("draft-one", "draft", authorA, false);
  archivedTopic = await mkTopic("archived-one", "archived", authorA, true);
  await owner.query("update public.topics set archived_at = now() where id=$1", [archivedTopic]);
  authorDraft = draftTopic;
});
afterAll(closePool);

describe("reference data", () => {
  it("contains the ten curriculum domains with English titles", async () => {
    const r = await owner.query("select count(*)::int n, bool_and(title ? 'en') ok from public.nursing_domains");
    expect(r.rows[0]).toEqual({ n: 10, ok: true });
  });
});

describe("public read surface", () => {
  it("lets anonymous visitors read published snapshots only", async () => {
    const r = await asUser(null, "select slug from public.public_topics order by slug");
    expect(r.rows.map((x) => x.slug)).toEqual(["published-one"]);
  });
  it("exposes domains with published-topic counts", async () => {
    const r = await asUser(null, "select slug, topic_count from public.public_domains where slug = 'respiratory-airway'");
    expect(r.rows[0].topic_count).toBe(1);
  });
  it("denies direct access to working copies and workflow tables", async () => {
    for (const t of ["topics", "topic_sections", "topic_actions", "topic_references", "topic_images", "content_versions", "review_assignments", "content_reviews", "sources", "bookmarks", "learning_progress"]) {
      await expectDenied(asUser(null, `select * from public.${t}`));
    }
  });
  it("keeps showing the published snapshot while the working copy is edited", async () => {
    await owner.query("update public.topics set title = $1 where id = $2", [JSON.stringify({ en: "UNREVIEWED EDIT" }), pubTopic]);
    const r = await asUser(null, "select snapshot->'title'->>'en' as t from public.public_topics where slug='published-one'");
    expect(r.rows[0].t).toBe("published-one (published)");
  });
  it("hides archived topics", async () => {
    expect((await asUser(null, "select 1 from public.public_topics where slug='archived-one'")).rowCount).toBe(0);
  });
});

describe("authoring permissions", () => {
  const insert = "insert into public.topics (domain_id, slug, title) values ($1, $2, '{\"en\":\"T\"}') returning id, author_id, status, kind";
  it("blocks learners from creating topics", async () => {
    await expectDenied(asUser({ id: learnerA }, insert, [domainId, "learner-topic"]));
  });
  it("blocks authors who have not completed MFA", async () => {
    await expectDenied(asUser({ id: authorA, aal: "aal1" }, insert, [domainId, "no-mfa-topic"]));
  });
  it("lets an MFA-verified author create a draft owned by themselves", async () => {
    const r = await asUser({ id: authorA, aal: "aal2" }, insert, [domainId, "author-topic"]);
    expect(r.rows[0]).toMatchObject({ author_id: authorA, status: "draft", kind: "clinical" });
  });
  it("cannot forge workflow columns, authorship or demo kind", async () => {
    const A = { id: authorA, aal: "aal2" as const };
    await expectDenied(asUser(A, "update public.topics set status='published' where id=$1", [draftTopic]));
    await expectDenied(asUser(A, "update public.topics set published_version_id = gen_random_uuid() where id=$1", [draftTopic]));
    await expectDenied(asUser(A, "update public.topics set kind='demo_synthetic' where id=$1", [draftTopic]));
    await expectDenied(asUser(A, "update public.topics set author_id=$2 where id=$1", [draftTopic, authorB]));
    await expectDenied(asUser(A, "insert into public.topics (domain_id, slug, title, status) values ($1,'x1','{\"en\":\"x\"}','published')", [domainId]));
    await expectDenied(asUser(A, "insert into public.topics (domain_id, slug, title, author_id) values ($1,'x2','{\"en\":\"x\"}',$2)", [domainId, authorB]));
  });
  it("lets authors edit their own draft but not others' topics", async () => {
    await asUser({ id: authorA, aal: "aal2" }, "update public.topics set est_minutes = 20 where id=$1", [draftTopic]);
    const stolen = await asUser({ id: authorB, aal: "aal2" }, "update public.topics set est_minutes = 99 where id=$1 returning id", [draftTopic]);
    expect(stolen.rowCount).toBe(0);
    expect((await asUser({ id: authorB, aal: "aal2" }, "select id from public.topics where id=$1", [draftTopic])).rowCount).toBe(0);
  });
  it("does not allow editing a published topic's working copy directly", async () => {
    const r = await asUser({ id: authorA, aal: "aal2" }, "update public.topics set est_minutes = 5 where id=$1 returning id", [pubTopic]);
    expect(r.rowCount).toBe(0);
  });
  it("hides drafts from learners and unassigned reviewers; shows them to administrators", async () => {
    expect((await asUser({ id: learnerA }, "select id from public.topics")).rowCount).toBe(0);
    expect((await asUser({ id: reviewer, aal: "aal2" }, "select id from public.topics where id=$1", [draftTopic])).rowCount).toBe(0);
    expect((await asUser({ id: admin, aal: "aal2" }, "select id from public.topics where id=$1", [draftTopic])).rowCount).toBe(1);
  });
  it("applies the same rules to sections and sources", async () => {
    const A = { id: authorA, aal: "aal2" as const };
    await asUser(A, "insert into public.topic_sections (topic_id, kind, title, body) values ($1,'overview','{\"en\":\"O\"}','{\"en\":\"b\"}')", [authorDraft]);
    await expectDenied(asUser({ id: authorB, aal: "aal2" }, "insert into public.topic_sections (topic_id, kind, title, body) values ($1,'overview','{\"en\":\"O\"}','{\"en\":\"b\"}')", [authorDraft]));
    expect((await asUser({ id: learnerA }, "select 1 from public.topic_sections").catch(() => ({ rowCount: 0 }))).rowCount).toBe(0);
  });
  it("restricts source management to staff", async () => {
    await expectDenied(asUser({ id: learnerA }, "insert into public.sources (organization, title) values ('x','y')"));
    await asUser({ id: authorA, aal: "aal2" }, "insert into public.sources (organization, title, url) values ('WHO','Patient safety','https://who.int/x')");
    await expect(asUser({ id: authorA, aal: "aal2" }, "insert into public.sources (organization, title, url) values ('x','y','http://insecure')")).rejects.toThrow(/check/i);
  });
  it("restricts domain changes to administrators", async () => {
    expect((await asUser({ id: authorA, aal: "aal2" }, "update public.nursing_domains set sort = 99 returning id")).rowCount).toBe(0);
    await asUser({ id: admin, aal: "aal2" }, "update public.nursing_domains set sort = sort where slug = 'renal-metabolic'");
  });
  it("lets authors delete only never-submitted drafts", async () => {
    const A = { id: authorA, aal: "aal2" as const };
    const mk = await asUser(A, "insert into public.topics (domain_id, slug, title) values ($1,'to-delete','{\"en\":\"d\"}') returning id", [domainId]);
    expect((await asUser(A, "delete from public.topics where id=$1 returning id", [mk.rows[0].id])).rowCount).toBe(1);
    expect((await asUser(A, "delete from public.topics where id=$1 returning id", [pubTopic])).rowCount).toBe(0);
  });
  it("audits content changes with the acting user", async () => {
    const r = await owner.query("select count(*)::int n from public.audit_log where entity_type='topics' and actor=$1", [authorA]);
    expect(r.rows[0].n).toBeGreaterThan(0);
  });
});

describe("bookmarks", () => {
  it("lets a learner bookmark published topics only", async () => {
    await asUser({ id: learnerA }, "insert into public.bookmarks (topic_id) values ($1)", [pubTopic]);
    await expectDenied(asUser({ id: learnerA }, "insert into public.bookmarks (topic_id) values ($1)", [draftTopic]));
    await expectDenied(asUser({ id: learnerA }, "insert into public.bookmarks (topic_id) values ($1)", [archivedTopic]));
  });
  it("isolates bookmarks between users", async () => {
    expect((await asUser({ id: learnerB }, "select * from public.bookmarks")).rowCount).toBe(0);
    await expectDenied(asUser({ id: learnerB }, "insert into public.bookmarks (user_id, topic_id) values ($1,$2)", [learnerA, pubTopic]));
    expect((await asUser({ id: learnerB }, "delete from public.bookmarks where user_id=$1 returning 1", [learnerA])).rowCount).toBe(0);
    expect((await asUser({ id: learnerA }, "select * from public.bookmarks")).rowCount).toBe(1);
  });
  it("persists and removes bookmarks for the owner", async () => {
    expect((await asUser({ id: learnerA }, "delete from public.bookmarks where topic_id=$1 returning 1", [pubTopic])).rowCount).toBe(1);
    expect((await asUser({ id: learnerA }, "select * from public.bookmarks")).rowCount).toBe(0);
  });
  it("rejects anonymous bookmarking", async () => {
    await expectDenied(asUser(null, "insert into public.bookmarks (topic_id) values ($1)", [pubTopic]));
  });
});

describe("learning progress", () => {
  it("records views, counting repeats", async () => {
    await asUser({ id: learnerA }, "select public.record_topic_view($1)", [pubTopic]);
    await asUser({ id: learnerA }, "select public.record_topic_view($1)", [pubTopic]);
    const r = await asUser({ id: learnerA }, "select status, view_count from public.learning_progress where topic_id=$1", [pubTopic]);
    expect(r.rows[0]).toEqual({ status: "in_progress", view_count: 2 });
  });
  it("completes and un-completes, remembering the version completed", async () => {
    await asUser({ id: learnerA }, "select public.set_topic_completion($1, true)", [pubTopic]);
    const done = (await asUser({ id: learnerA }, "select status, completed_version_id from public.learning_progress where topic_id=$1", [pubTopic])).rows[0];
    expect(done.status).toBe("completed");
    expect(done.completed_version_id).not.toBeNull();
    await asUser({ id: learnerA }, "select public.set_topic_completion($1, false)", [pubTopic]);
    const undone = (await asUser({ id: learnerA }, "select status, completed_version_id from public.learning_progress where topic_id=$1", [pubTopic])).rows[0];
    expect(undone).toEqual({ status: "in_progress", completed_version_id: null });
  });
  it("cannot be written directly or for unpublished topics", async () => {
    await expectDenied(asUser({ id: learnerA }, "insert into public.learning_progress (user_id, topic_id, status) values ($1,$2,'completed')", [learnerA, pubTopic]));
    await expectDenied(asUser({ id: learnerA }, "update public.learning_progress set status='completed' where user_id=$1", [learnerA]));
    await expect(asUser({ id: learnerA }, "select public.record_topic_view($1)", [draftTopic])).rejects.toThrow(/not published/);
    await expect(asUser({ id: learnerA }, "select public.set_topic_completion($1, true)", [archivedTopic])).rejects.toThrow(/not published/);
  });
  it("is private to each user and unavailable to anonymous visitors", async () => {
    expect((await asUser({ id: learnerB }, "select * from public.learning_progress")).rowCount).toBe(0);
    await asUser({ id: learnerB }, "select public.record_topic_view($1)", [pubTopic]);
    expect((await asUser({ id: learnerA }, "select user_id from public.learning_progress")).rows.every((r) => r.user_id === learnerA)).toBe(true);
    await expectDenied(asUser(null, "select public.record_topic_view($1)", [pubTopic]));
  });
});

describe("development seed", () => {
  it("applies cleanly and produces ten synthetic demo topics that are publicly visible", async () => {
    await owner.query(readFileSync(path.resolve(__dirname, "../../supabase/seed.sql"), "utf8"));
    const r = await asUser(null, "select kind, count(*)::int n from public.public_topics where slug like 'demo-%' group by kind");
    expect(r.rows).toEqual([{ kind: "demo_synthetic", n: 10 }]);
    const renal = await asUser(null, "select snapshot->'references' as refs from public.public_topics where slug='demo-renal-metabolic'");
    expect(JSON.stringify(renal.rows[0].refs)).toContain('"is_draft_guideline":true');
  });
});
