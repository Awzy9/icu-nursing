import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ISOLATED, requireIsolated } from "../../scripts/live/target";
import { deleteTestUser, makeUser, rawClient, signIn } from "./helpers";
import { sessionRowSchema } from "@icu/schemas/working-progress";

const ids: string[] = [];
const decisions = [{position:1,choice:0},{position:2,choice:1}];
const args = (at: string) => ({
  p_module_key:"SC-10",p_kind:"scenario",p_version:"sc2-test",p_position:3,p_score:2,p_finished:false,p_updated_at:at,p_decisions:decisions,
});
describe.skipIf(!ISOLATED)("Decision history through authenticated PostgREST",()=>{
  let first: Awaited<ReturnType<typeof makeUser>>;
  let second: Awaited<ReturnType<typeof makeUser>>;
  beforeAll(async()=>{
    requireIsolated("test candidate account decision history");
    first=await makeUser("history-api-a","History API A");
    ids.push(first.id);
    second=await makeUser("history-api-b","History API B");
    ids.push(second.id);
  });
  afterAll(async()=>{for(const id of ids) await deleteTestUser(id);});
  it("reads the same scenario history from a separately authenticated client",async()=>{
    const device1=await signIn(first.email);
    const device2=await signIn(first.email);
    expect((await device1.rpc("working_save_session_v2",args(new Date(Date.now()-60000).toISOString()))).error).toBeNull();
    const result=await device2.from("working_sessions").select("module_key,kind,version,position,score,finished,updated_at,decisions").eq("module_key","SC-10").single();
    expect(result.error).toBeNull();
    expect(sessionRowSchema.parse(result.data)).toMatchObject({position:3,score:2,decisions});
  });
  it("rejects unauthorized RPCs and hides history from another account",async()=>{
    const other=await signIn(second.email);
    const denied=await rawClient().rpc("working_save_session_v2",args(new Date().toISOString()));
    expect(denied.error).not.toBeNull();
    const internal=await other.rpc("working_decision_history_valid",{history:[]});
    expect(internal.error).not.toBeNull();
    const hidden=await other.from("working_sessions").select("decisions").eq("user_id",first.id);
    expect(hidden.error).toBeNull();
    expect(hidden.data).toEqual([]);
    const update=await other.from("working_sessions").update({decisions:[]}).eq("user_id",first.id).select();
    expect(update.error).toBeNull();
    expect(update.data).toEqual([]);
  });
  it("rejects malformed decisions, preserves newer history and accepts legacy saves",async()=>{
    const c=await signIn(first.email);
    const now=Date.now();
    const newer=args(new Date(now-30000).toISOString());
    expect((await c.rpc("working_save_session_v2",newer)).error).toBeNull();
    const malformed=await c.rpc("working_save_session_v2",{...args(new Date(now-10000).toISOString()),p_decisions:[{position:1,choice:9}]});
    expect(malformed.error).not.toBeNull();
    const older={...args(new Date(now-60000).toISOString()),p_decisions:[]};
    expect((await c.rpc("working_save_session_v2",older)).error).toBeNull();
    const row=await c.from("working_sessions").select("decisions").eq("module_key","SC-10").single();
    expect(row.error).toBeNull();
    expect(row.data?.decisions).toEqual(decisions);
    expect((await c.rpc("working_save_session",{p_module_key:"SC-10",p_kind:"scenario",p_version:"legacy",p_position:2,p_score:0,p_finished:false,p_updated_at:new Date(now-5000).toISOString()})).error).toBeNull();
    const legacy=await c.from("working_sessions").select("version,decisions").eq("module_key","SC-10").single();
    expect(legacy.error).toBeNull();
    expect(legacy.data).toEqual({version:"legacy",decisions:null});
  });
});
