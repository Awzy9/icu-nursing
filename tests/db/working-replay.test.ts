import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, owner, setupDb, uniqueEmail } from "./helpers";
let a = "", b = "";
beforeAll(async () => { await setupDb(); a = await createUser(uniqueEmail("replay-a")); b = await createUser(uniqueEmail("replay-b")); });
afterAll(closePool);
const at = Date.parse("2026-01-01T00:00:00Z");
const answer = {kind:"answer",moduleKey:"QB-D01-T03",questionId:"QB-D01-T03-1",choice:1,correct:true,at};
const checkpoint = {kind:"checkpoint",moduleKey:"SC-01",sessionKind:"scenario",version:"sc2-test",position:2,score:2,finished:false,at,decisions:[{position:1,choice:0}]};
const replay = async (id:string, expected:string, event:unknown) => (await asUser({id},"select public.working_replay_event($1::uuid,$2::jsonb) as accepted",[expected,JSON.stringify(event)])).rows[0]?.accepted;
const session = async (id:string) => (await asUser({id},"select version,position,score,finished,decisions from public.working_sessions where module_key='SC-01'")).rows[0];

describe("account-bound learning replay", () => {
  it("rejects mismatched accounts and anonymous calls", async () => {
    await expectDenied(replay(b,a,answer));
    await expectDenied(asUser(null,"select public.working_replay_event($1::uuid,$2::jsonb)",[a,JSON.stringify(answer)]));
    expect((await asUser({id:b},"select * from public.working_attempts")).rows).toHaveLength(0);
  });
  it("defers future events without writing and preserves exact past timestamps", async () => {
    expect(await replay(a,a,{...answer,at:Date.now()+86400000})).toBe(false);
    expect((await asUser({id:a},"select * from public.working_attempts")).rows).toHaveLength(0);
    expect(await replay(a,a,answer)).toBe(true);
    expect(await replay(a,a,answer)).toBe(true);
    const row=(await asUser({id:a},"select box,answered_at from public.working_attempts")).rows[0];
    expect(row.box).toBe(2);
    expect(new Date(row.answered_at).getTime()).toBe(at);
  });
  it("preserves a dismissal against older checkpoints and accepts a subsequent restart", async () => {
    expect(await replay(a,a,checkpoint)).toBe(true);
    const dismissal={kind:"dismiss",moduleKey:"SC-01",at:at+1000};
    expect(await replay(a,a,dismissal)).toBe(true);
    expect(await replay(a,a,checkpoint)).toBe(true);
    expect(await replay(a,a,dismissal)).toBe(true);
    expect(await session(a)).toEqual({version:"dismissed-v1",position:0,score:0,finished:true,decisions:null});
    expect(await session(b)).toBeUndefined();
    expect(await replay(a,a,{...checkpoint,at:at+2000})).toBe(true);
    expect(await session(a)).toEqual({version:"sc2-test",position:2,score:2,finished:false,decisions:checkpoint.decisions});
  });
  it("rejects malformed events rather than acknowledging them", async () => {
    for (const event of [null,{...answer,choice:4},{...answer,at:-1},{...answer,correct:"true"},{...checkpoint,sessionKind:"quiz"},{...checkpoint,decisions:[{position:1,choice:4}]}]) {
      await expect(replay(a,a,event)).rejects.toThrow();
    }
  });
  it("cascades dismissal markers on account deletion", async () => {
    const u=await createUser(uniqueEmail("replay-delete"));
    expect(await replay(u,u,{kind:"dismiss",moduleKey:"SC-01",at})).toBe(true);
    await owner.query("delete from auth.users where id=$1",[u]);
    expect((await owner.query("select * from public.working_sessions where user_id=$1",[u])).rows).toHaveLength(0);
  });
});
