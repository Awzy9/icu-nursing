import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, owner, setupDb, uniqueEmail } from "./helpers";

beforeAll(setupDb);
afterAll(closePool);

/**
 * Security review (Phase 6): every public function the API exposes to signed-in users is SECURITY DEFINER. This suite enumerates
 * them from the catalogue (so a new function cannot be added without being exercised here) and proves, for each one:
 *   1. it pins search_path;
 *   2. it refuses a request whose JWT has no subject (an "authenticated" token that is not a user);
 *   3. a signed-in learner with no staff role cannot use any staff/admin function.
 */
interface Fn { proname: string; args: string; prosecdef: boolean; proconfig: string[] | null; types: string[] | null }
async function exposed(): Promise<Fn[]> {
  const r = await owner.query(`select p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef, p.proconfig,
      (select array_agg(format_type(t, null) order by ord) from unnest(p.proargtypes::oid[]) with ordinality as x(t, ord)) as types
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and has_function_privilege('authenticated', p.oid, 'execute') order by p.proname`);
  return r.rows as Fn[];
}
const SAMPLES: Record<string, unknown> = {
  uuid: "00000000-0000-4000-8000-000000000001", text: "x", integer: 1, boolean: true, "text[]": ["x"], jsonb: "{}",
  "public.app_role": "admin", app_role: "admin", "public.review_decision": "approve", review_decision: "approve",
};
const call = (f: Fn) => {
  const types = f.types ?? [];
  return { sql: `select public.${f.proname}(${types.map((t, i) => `$${i + 1}::${t}`).join(", ")})`, params: types.map((t) => SAMPLES[t] ?? null) };
};

describe("all functions exposed to signed-in users", () => {
  it("are all SECURITY DEFINER with a pinned search_path (48+ at the time of writing)", async () => {
    const fns = await exposed();
    expect(fns.length).toBeGreaterThanOrEqual(48);
    for (const f of fns) {
      expect(f.prosecdef, f.proname).toBe(true);
      expect((f.proconfig ?? []).some((c) => c.startsWith("search_path=")), `${f.proname} search_path`).toBe(true);
    }
  });

  it("refuse an authenticated token that carries no user (no 'sub' claim)", async () => {
    for (const f of await exposed()) {
      const { sql, params } = call(f);
      let succeeded = false;
      try {
        await owner.query("begin");
        await owner.query("set local role authenticated");
        await owner.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "authenticated" })]);
        await owner.query(sql, params);
        succeeded = true;
      } catch {
        /* expected: every function must raise */
      } finally {
        await owner.query("rollback");
      }
      expect(succeeded, `${f.proname}(${f.args}) succeeded without a user`).toBe(false);
    }
  });

  it("deny every staff/admin function to a signed-in learner with no roles", async () => {
    const learner = await createUser(uniqueEmail("plain"));
    const learnerFns = /^(qb_|st_|cs_|sk_|md_|eq_|record_topic_view|set_topic_completion)/;
    for (const f of (await exposed()).filter((x) => !learnerFns.test(x.proname))) {
      const { sql, params } = call(f);
      let succeeded = false;
      try { await asUser({ id: learner }, sql, params); succeeded = true; } catch { /* expected */ }
      expect(succeeded, `${f.proname} must refuse a role-less learner`).toBe(false);
    }
  });
});
