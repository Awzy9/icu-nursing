import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, grantRole, setupDb, uniqueEmail } from "./helpers";
import { caseSeedSql } from "../../src/lib/cases/fixtures";
import { owner } from "./helpers";

// The /admin/content page reads these columns as the signed-in staff member. They must work for staff and expose nothing to a learner.
const QUERIES = ["select status from public.topics", "select status, kind from public.question_items", "select status, kind from public.case_items", "select status, kind from public.skill_items", "select status, kind from public.medication_items", "select id, licence_class, last_checked, is_draft_guideline, url from public.sources"];
let staff: string, learner: string;
beforeAll(async () => {
  await setupDb();
  staff = await createUser(uniqueEmail("staff")); await grantRole(staff, "author");
  learner = await createUser(uniqueEmail("learner"));
  await owner.query(caseSeedSql());
});
afterAll(closePool);

describe("content overview queries", () => {
  it("run for staff", async () => { for (const q of QUERIES) await expect(asUser({ id: staff }, q), q).resolves.toBeDefined(); });
  it("return no content rows to a learner and expose no clinical draft anywhere in the database", async () => {
    for (const q of QUERIES.slice(0, 5)) expect((await asUser({ id: learner }, q)).rows, q).toEqual([]);
    for (const t of ["topics", "question_items", "case_items", "skill_items", "medication_items"]) {
      const clinical = (await owner.query(`select count(*)::int n from public.${t} where ${t === "topics" ? "false" : "kind = 'clinical'"}`)).rows[0].n;
      expect(clinical, t).toBe(0);
    }
  });
});
