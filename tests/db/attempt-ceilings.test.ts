/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, owner, setupDb, uniqueEmail } from "./helpers";
import { caseSeedSql, loadCaseFixtures } from "../../src/lib/cases/fixtures";
import { fixtureSeedSql } from "../../src/lib/question-bank/fixtures";

const cases = loadCaseFixtures();
const rpc = async (u: string, text: string, params: unknown[] = []) => (await asUser({ id: u }, text, params)).rows[0] as Record<string, any>;

beforeAll(async () => {
  await setupDb();
  await owner.query(fixtureSeedSql({ makeVisible: false }));
  await owner.query(caseSeedSql());
  await owner.query("update public.app_settings set environment='development', question_fixtures_visible=true");
});
afterAll(closePool);

describe("hourly attempt ceilings (security review: unbounded attempt growth)", () => {
  it("caps question-bank attempts at 100 per rolling hour per learner and lifts after the window", async () => {
    const u = await createUser(uniqueEmail("flood"));
    const other = await createUser(uniqueEmail("calm"));
    for (let i = 0; i < 100; i++) {
      await owner.query("insert into public.quiz_attempts (user_id, mode, seed, question_count, status, completed_at) values ($1,'practice','abcdefgh',1,'completed', now())", [u]);
    }
    await expect(rpc(u, "select public.qb_start_attempt('practice', 3, null, null)")).rejects.toThrow(/too many attempts started in the last hour/);
    await expect(rpc(u, "select public.st_start_revision('due', 3)")).rejects.toThrow(/too many attempts|no questions are available/);
    expect((await rpc(other, "select public.qb_start_attempt('practice', 3, null, null) as id")).id).toBeTruthy(); // another learner is unaffected
    await owner.query("update public.quiz_attempts set started_at = now() - interval '2 hours' where user_id = $1", [u]);
    expect((await rpc(u, "select public.qb_start_attempt('practice', 3, null, null) as id")).id).toBeTruthy();
  });

  it("caps case starts at 60 per rolling hour per learner", async () => {
    const u = await createUser(uniqueEmail("caseflood"));
    for (let i = 0; i < 60; i++) {
      await owner.query("insert into public.case_attempts (user_id, case_id, case_version, seed, status) values ($1,$2,1,'abcdefgh','abandoned')", [u, cases[0]!.id]);
    }
    await expect(rpc(u, "select public.cs_start($1)", [cases[1]!.id])).rejects.toThrow(/too many cases started in the last hour/);
    await owner.query("update public.case_attempts set started_at = now() - interval '2 hours' where user_id = $1", [u]);
    expect((await rpc(u, "select public.cs_start($1) as id", [cases[1]!.id])).id).toBeTruthy();
  });
});
