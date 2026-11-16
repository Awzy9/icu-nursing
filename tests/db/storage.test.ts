import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, grantRole, owner, setupDb, uniqueEmail } from "./helpers";

const MFA = (id: string) => ({ id, aal: "aal2" as const });
let author: string, author2: string, learner: string, admin: string, domainId: string, topic: string, otherTopic: string;
const put = (actor: Parameters<typeof asUser>[0], path: string, bucket = "topic-images") =>
  asUser(actor, "insert into storage.objects (bucket_id, name) values ($1, $2) returning name", [bucket, path]);

beforeAll(async () => {
  await setupDb();
  const mk = (p: string) => createUser(uniqueEmail(p));
  author = await mk("a"); author2 = await mk("b"); learner = await mk("l"); admin = await mk("ad");
  await grantRole(author, "author"); await grantRole(author2, "author"); await grantRole(admin, "admin");
  domainId = (await owner.query("select id from public.nursing_domains limit 1")).rows[0].id;
  topic = (await asUser(MFA(author), "insert into public.topics (domain_id, slug, title) values ($1,'s1','{\"en\":\"T\"}') returning id", [domainId])).rows[0].id;
  otherTopic = (await asUser(MFA(author2), "insert into public.topics (domain_id, slug, title) values ($1,'s2','{\"en\":\"T\"}') returning id", [domainId])).rows[0].id;
});
afterAll(closePool);

describe("storage object policies", () => {
  beforeAll(async () => {
    // The migration skipped policy creation (no storage schema at migration time); install them now by re-running its DO block.
    const sql = (await import("node:fs")).readFileSync(new URL("../../supabase/migrations/0004_storage.sql", import.meta.url), "utf8");
    const doBlock = sql.slice(sql.indexOf("do $$"));
    await owner.query(doBlock);
  });

  it("lets an author upload into their own editable topic's folder", async () => {
    const r = await put(MFA(author), `${topic}/${crypto.randomUUID()}.png`);
    expect(r.rowCount).toBe(1);
  });
  it("blocks uploads into another author's topic folder, other buckets, or malformed folders", async () => {
    await expectDenied(put(MFA(author), `${otherTopic}/${crypto.randomUUID()}.png`));
    await expectDenied(put(MFA(author), `${topic}/x.png`, "other-bucket"));
    await expectDenied(put(MFA(author), `not-a-uuid/x.png`));
    await expectDenied(put(MFA(author), `x.png`));
  });
  it("requires MFA for authors and blocks learners and anonymous users", async () => {
    await expectDenied(put({ id: author, aal: "aal1" }, `${topic}/${crypto.randomUUID()}.png`));
    await expectDenied(put({ id: learner, aal: "aal2" }, `${topic}/${crypto.randomUUID()}.png`));
    await expectDenied(put(null, `${topic}/${crypto.randomUUID()}.png`));
  });
  it("lets administrators upload for any editable topic", async () => {
    expect((await put(MFA(admin), `${otherTopic}/${crypto.randomUUID()}.webp`)).rowCount).toBe(1);
  });
  it("freezes uploads while the topic is not editable", async () => {
    await owner.query("update public.topics set status='in_review' where id=$1", [topic]);
    await expectDenied(put(MFA(author), `${topic}/${crypto.randomUUID()}.png`));
    await owner.query("update public.topics set status='draft' where id=$1", [topic]);
  });
  it("hides draft images from other users' listings but shows them to the author", async () => {
    expect((await asUser(MFA(author2), "select name from storage.objects where name like $1", [`${topic}/%`])).rowCount).toBe(0);
    expect((await asUser(MFA(author), "select name from storage.objects where name like $1", [`${topic}/%`])).rowCount).toBeGreaterThan(0);
  });
  it("only the editor can delete objects", async () => {
    expect((await asUser(MFA(author2), "delete from storage.objects where name like $1 returning 1", [`${topic}/%`])).rowCount).toBe(0);
    expect((await asUser(MFA(author), "delete from storage.objects where name like $1 returning 1", [`${topic}/%`])).rowCount).toBeGreaterThan(0);
  });
});

describe("image metadata path rule", () => {
  const ins = (actor: Parameters<typeof asUser>[0], t: string, path: string) =>
    asUser(actor, "insert into public.topic_images (topic_id, storage_path, licence) values ($1,$2,'CC BY 4.0') returning id", [t, path]);
  it("accepts a path inside the topic's own folder", async () => {
    expect((await ins(MFA(author), topic, `${topic}/${crypto.randomUUID()}.png`)).rowCount).toBe(1);
  });
  it("rejects paths pointing at another topic, traversal, or disallowed extensions (e.g. svg)", async () => {
    await expect(ins(MFA(author), topic, `${otherTopic}/a.png`)).rejects.toThrow(/check/i);
    await expect(ins(MFA(author), topic, `${topic}/../${otherTopic}/a.png`)).rejects.toThrow(/check/i);
    await expect(ins(MFA(author), topic, `${topic}/a.svg`)).rejects.toThrow(/check/i);
    await expect(ins(MFA(author), topic, `${topic}/a.png/../../x.png`)).rejects.toThrow(/check/i);
  });
});
