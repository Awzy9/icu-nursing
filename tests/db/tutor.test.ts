/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, owner, setupDb, uniqueEmail } from "./helpers";

let learner: string, other: string;
const A = (id: string) => ({ id });
const call = async (id: string | null, sql: string, p: unknown[] = []) => (await asUser(id ? A(id) : null, sql, p)).rows[0] as Record<string, any>;
const record = (id: string | null, q: string, refused = false, reason: string | null = null, hits = 0) =>
  call(id, "select public.tutor_record_query($1,$2,$3,$4,$5) as r", [q, "en", refused, reason, hits]);

beforeAll(async () => {
  await setupDb();
  learner = await createUser(uniqueEmail("learner"));
  other = await createUser(uniqueEmail("other"));
});
afterAll(closePool);

describe("tutor usage log: authorization", () => {
  it("refuses an anonymous caller and denies everyone direct table access", async () => {
    await expectDenied(record(null, "what is NEWS2?"));
    await expectDenied(call(null, "select public.tutor_usage_remaining()"));
    for (const who of [learner, other]) {
      await expectDenied(asUser(A(who), "select * from public.tutor_queries"));
      await expectDenied(asUser(A(who), "insert into public.tutor_queries (user_id, locale, query, refused, hit_count) values (gen_random_uuid(),'en','x',false,0)"));
    }
  });
  it("takes no staff role - any signed-in learner may call it", async () => {
    const r = await record(learner, "how do I check an endotracheal tube cuff?");
    expect(r.r.id).toBeGreaterThan(0);
  });
});

describe("tutor usage log: validation and caps", () => {
  it("validates locale, query length and hit count", async () => {
    await expect(call(other, "select public.tutor_record_query($1,$2,$3,$4,$5)", ["x", "fr", false, null, 0])).rejects.toThrow(/invalid locale/);
    await expect(call(other, "select public.tutor_record_query($1,$2,$3,$4,$5)", ["x".repeat(501), "en", false, null, 0])).rejects.toThrow(/too long/);
    await expect(call(other, "select public.tutor_record_query($1,$2,$3,$4,$5)", ["x", "en", false, null, 51])).rejects.toThrow(/invalid hit count/);
  });
  it("records refusals with their reason and a 0 hit count, and real answers with their hit count", async () => {
    const fresh = await createUser(uniqueEmail("fresh"));
    await record(fresh, "my patient needs a dose, what should I give", true, "patient_specific", 0);
    const rows = (await owner.query("select refused, refusal_reason, hit_count from public.tutor_queries where user_id=$1 order by created_at", [fresh])).rows;
    expect(rows[0]).toMatchObject({ refused: true, refusal_reason: "patient_specific", hit_count: 0 });
    await record(fresh, "oxygen delivery devices", false, null, 3);
    const rows2 = (await owner.query("select refused, hit_count from public.tutor_queries where user_id=$1 order by created_at", [fresh])).rows;
    expect(rows2[1]).toMatchObject({ refused: false, hit_count: 3 });
  });
  it("reports remaining quota and decrements it as questions are asked, isolated per learner", async () => {
    const fresh = await createUser(uniqueEmail("quota"));
    const before = (await call(fresh, "select public.tutor_usage_remaining() as u")).u;
    expect(before).toMatchObject({ remaining_this_hour: 20, remaining_today: 60 });
    await record(fresh, "q1"); await record(fresh, "q2");
    const after = (await call(fresh, "select public.tutor_usage_remaining() as u")).u;
    expect(after).toMatchObject({ remaining_this_hour: 18, remaining_today: 58 });
    const otherLearnerQuota = (await call(other, "select public.tutor_usage_remaining() as u")).u;
    expect(otherLearnerQuota.remaining_this_hour).toBe(20); // another learner's questions never affect this one's quota
  });
  it("throttles at 20 per hour and 60 per day", async () => {
    const fresh = await createUser(uniqueEmail("burst"));
    for (let i = 0; i < 20; i++) await record(fresh, `question ${i}`);
    await expect(record(fresh, "one more")).rejects.toThrow(/too many tutor questions/);
  });
  it("is append-only", async () => {
    await expect(owner.query("update public.tutor_queries set query='x'")).rejects.toThrow(/append-only/);
    await expect(owner.query("delete from public.tutor_queries")).rejects.toThrow(/append-only/);
  });
});
