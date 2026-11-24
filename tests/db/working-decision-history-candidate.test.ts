import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, owner, setupDb, uniqueEmail } from "./helpers";

// Exercise the exact review candidate in a disposable database cloned from the
// migrated test template. It is NOT applied to the shared template or hosted DB.
let a = "", b = "";
const candidate = resolve(process.cwd(), "docs/sql/working_session_decision_history_candidate.sql");
const history = [{ position: 1, choice: 0 }, { position: 2, choice: 1 }];
const write = (id: string, module: string, decisions: unknown, age = "1 hour", kind = "scenario") =>
  asUser({ id }, "select public.working_save_session_v2($1,$2,'sc2-test',3,2,false,now()-$3::interval,$4::jsonb)", [module, kind, age, JSON.stringify(decisions)]);
const read = async (id: string, module: string) =>
  (await asUser({ id }, "select position,score,finished,decisions from public.working_sessions where module_key=$1", [module])).rows[0];

beforeAll(async () => {
  await setupDb();
  await owner.query(readFileSync(candidate, "utf8"));
  a = await createUser(uniqueEmail("history-a"));
  b = await createUser(uniqueEmail("history-b"));
});
afterAll(closePool);

describe("Candidate account scenario decision history (isolated database)", () => {
  it("round-trips decisions with the cumulative score and position", async () => {
    await write(a, "SC-01", history);
    expect(await read(a, "SC-01")).toEqual({ position: 3, score: 2, finished: false, decisions: history });
  });
  it("denies anonymous RPC calls and cross-account reads and writes", async () => {
    await write(a, "SC-02", history);
    await expectDenied(asUser(null, "select public.working_save_session_v2('SC-02','scenario','sc2-test',3,2,false,now(),'[]'::jsonb)"));
    expect(await read(b, "SC-02")).toBeUndefined();
    expect((await asUser({id:b}, "update public.working_sessions set decisions='[]'::jsonb where user_id=$1 returning *", [a])).rows).toHaveLength(0);
    await expectDenied(asUser({id:b}, "insert into public.working_sessions(user_id,module_key,kind,version,position,score,decisions) values($1,'SC-20','scenario','sc2-test',2,0,'[]'::jsonb)", [a]));
    expect((await read(a, "SC-02")).decisions).toEqual(history);
  });
  it("keeps newer history, even if an older legacy or v2 write arrives", async () => {
    await write(a, "SC-03", history);
    await write(a, "SC-03", [{position:1,choice:2}], "2 hours");
    await asUser({id:a}, "select public.working_save_session('SC-03','scenario','legacy',2,0,false,now()-interval '3 hours')");
    expect(await read(a, "SC-03")).toEqual({position:3,score:2,finished:false,decisions:history});
  });
  it("clears uncertain history when a newer legacy save wins", async () => {
    await write(a, "SC-04", history, "2 hours");
    await asUser({id:a}, "select public.working_save_session('SC-04','scenario','legacy',2,0,false,now()-interval '1 hour')");
    expect(await read(a, "SC-04")).toEqual({position:2,score:0,finished:false,decisions:null});
    await write(a, "SC-04", [], "30 minutes");
    expect((await read(a, "SC-04")).decisions).toEqual([]);
  });
  it("rejects malformed histories and histories on quiz sessions without changing the valid row", async () => {
    await write(a, "SC-05", history, "2 hours");
    for (const invalid of [null, {}, [{position:1,choice:4}], [{position:1,choice:0.5}], [{position:"1",choice:0}], [{position:0,choice:0}], [{position:2,choice:1},{position:1,choice:0}], [{position:1,choice:0},{position:1,choice:1}], [{position:1,choice:0,extra:true}], Array.from({length:101},(_,i)=>({position:i+1,choice:0}))]) {
      await expect(write(a,"SC-05",invalid)).rejects.toThrow(/check constraint|violates/i);
    }
    await expect(write(a,"SC-05",history,"1 hour","quiz")).rejects.toThrow(/check constraint|violates/i);
    expect((await read(a, "SC-05")).decisions).toEqual(history);
  });
  it("cascades decision history when an account is deleted", async () => {
    const u = await createUser(uniqueEmail("history-delete"));
    await write(u,"SC-06",history);
    await owner.query("delete from auth.users where id=$1",[u]);
    expect((await owner.query("select decisions from public.working_sessions where user_id=$1",[u])).rows).toHaveLength(0);
  });
});
