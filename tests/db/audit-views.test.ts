import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, grantRole, owner, setupDb, uniqueEmail } from "./helpers";

/**
 * Independent audit of the two definer-owned public views.
 * Threat: a view WITHOUT security_barrier lets the planner evaluate a caller-supplied predicate on base-table rows
 * BEFORE the view's own filter, so an error message (e.g. a failed cast) can disclose unpublished content.
 */
let topic: string, draftTitle: string;

beforeAll(async () => {
  await setupDb();
  const author = await createUser(uniqueEmail("a"));
  await grantRole(author, "author");
  const domain = (await owner.query("select id from public.nursing_domains limit 1")).rows[0].id;
  draftTitle = "SECRET-DRAFT-TITLE-" + Math.random().toString(36).slice(2);
  topic = (await owner.query("insert into public.topics (domain_id, slug, title, status, author_id) values ($1,'audit-draft',$2,'in_review',$3) returning id", [domain, JSON.stringify({ en: draftTitle }), author])).rows[0].id;
  // An UNPUBLISHED version (in review) whose snapshot holds the secret, plus one genuinely published topic.
  await owner.query("insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin) values ($1,1,'in_review',$2,'{NE}','human')", [topic, JSON.stringify({ title: { en: draftTitle }, level: "beginner", est_minutes: 5 })]);
  const t2 = (await owner.query("insert into public.topics (domain_id, slug, title, status) values ($1,'audit-pub','{\"en\":\"public\"}','published') returning id", [domain])).rows[0].id;
  const v2 = (await owner.query("insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin, published_at) values ($1,1,'published','{\"title\":{\"en\":\"public\"},\"level\":\"beginner\",\"est_minutes\":5}','{NE}','human',now()) returning id", [t2])).rows[0].id;
  await owner.query("update public.topics set published_version_id=$1 where id=$2", [v2, t2]);
});
afterAll(closePool);

describe("public views cannot be used as an oracle for unpublished content", () => {
  const leaky = [
    "select * from public.public_topics where (snapshot->'title'->>'en')::int = 1",
    "select * from public.public_topics where (snapshot->>'title')::int = 1",
    "select slug from public.public_topics where snapshot::text::int = 1",
    "select * from public.public_topics where 1/ (length(snapshot->'title'->>'en') - length(snapshot->'title'->>'en')) = 1",
  ];
  for (const q of leaky) {
    it(`does not disclose draft data through errors: ${q.slice(0, 70)}…`, async () => {
      let message = "";
      try { await asUser(null, q); } catch (e) { message = (e as Error).message; }
      expect(message).not.toContain(draftTitle);
    });
  }
  it("is marked as a security barrier", async () => {
    const r = await owner.query("select relname, reloptions from pg_class where relname in ('public_topics','public_domains') order by 1");
    for (const row of r.rows) expect(String(row.reloptions), row.relname).toContain("security_barrier=true");
  });
  it("still returns only published rows", async () => {
    const r = await asUser(null, "select slug from public.public_topics order by slug");
    expect(r.rows.map((x) => x.slug)).toEqual(["audit-pub"]);
  });
});
