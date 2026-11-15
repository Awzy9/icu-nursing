/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally; shapes are validated by the app's zod schemas */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, owner, setupDb, uniqueEmail } from "./helpers";
import { caseSeedSql } from "../../src/lib/cases/fixtures";
import { caseAttemptSchema } from "../../src/lib/cases/types";
import { scenarioToCase } from "../unit/support/scenario-to-case";
import { SYNTHETIC_SCENARIO, SYNTHETIC_SOURCES } from "../unit/support/synthetic-scenario";

// The synthetic NONCLINICAL scenario draft, converted by the test-only converter, is loaded through the real SQL case engine (kind demo_synthetic).
const c = scenarioToCase(SYNTHETIC_SCENARIO, SYNTHETIC_SOURCES, "SYN-CASE-901");
let alice: string, bob: string;
const rpc = async (who: string | null, text: string, params: unknown[] = []) => (await asUser(who ? { id: who } : null, text, params)).rows[0] as Record<string, any>;
const start = async (u: string) => (await rpc(u, "select public.cs_start($1) as id", [c.id])).id as string;
const get = async (u: string, id: string) => (await rpc(u, "select public.cs_get($1) as a", [id])).a as any;
const choose = async (u: string, id: string, pos: number, opt: string) => (await rpc(u, "select public.cs_choose($1,$2,$3) as a", [id, pos, opt])).a as any;
const pick = (pos: number, points: number) => c.steps[pos - 1]!.options.find((o) => o.points === points)!;

beforeAll(async () => {
  await setupDb();
  alice = await createUser(uniqueEmail("alice"));
  bob = await createUser(uniqueEmail("bob"));
  await owner.query(caseSeedSql([c])); // publishing runs the database's structure checks on the converted graph
});
afterAll(closePool);

describe("converted scenario draft in the SQL case engine", () => {
  it("is gated: invisible while fixtures are off, visible in development", async () => {
    await expect(start(alice)).rejects.toThrow(/case not found/);
    await owner.query("update public.app_settings set environment='development', question_fixtures_visible=true");
    expect(((await rpc(alice, "select public.cs_list() as l")).l as any[]).some((x) => x.code === "SYN-CASE-901")).toBe(true);
  });
  it("branches, changes observations, hides keys, reveals consequences, and scores the best route 100%", async () => {
    const id = await start(alice);
    const open = await get(alice, id);
    expect(() => caseAttemptSchema.parse(open)).not.toThrow();
    expect(JSON.stringify(open.current)).not.toMatch(/points|scope|feedback|consequence/);
    expect(open.current.observations.find((o: any) => o.key === "queue").value).toBe(12);
    const a = await choose(alice, id, 1, pick(1, 2).id);
    expect(a.current_position).toBe(2);
    expect(a.current.observations.find((o: any) => o.key === "queue").value).toBe(15);
    expect(a.trail[0].options.find((o: any) => o.points === 2).consequence.en).toBe("You see a jam at gate two.");
    expect(a.summary).toBeNull();
    await choose(alice, id, 2, pick(2, 2).id);
    const done = await choose(alice, id, 4, pick(4, 2).id);
    expect(done.status).toBe("completed");
    expect(done.summary.score_tenths).toBe(1000);
    expect(done.summary.debrief.learning_points.en).toEqual(SYNTHETIC_SCENARIO.debrief!.learning_points);
    expect(() => caseAttemptSchema.parse(done)).not.toThrow();
  });
  it("takes the other branch and resumes the same attempt", async () => {
    const id = await start(alice);
    await choose(alice, id, 1, pick(1, 0).id);
    expect((await get(alice, id)).current_position).toBe(3);
    expect(await start(alice)).toBe(id);
  });
  it("refuses another user's attempt", async () => {
    const id = await start(alice);
    await expect(get(bob, id)).rejects.toThrow(/attempt not found/);
    await expect(choose(bob, id, 1, pick(1, 2).id)).rejects.toThrow(/attempt not found/);
    expect((await asUser({ id: bob }, "select * from public.case_attempts where id=$1", [id])).rows).toEqual([]);
  });
});
