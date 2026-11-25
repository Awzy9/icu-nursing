import { afterAll,beforeAll,describe,expect,it } from "vitest";
import { asUser,closePool,createUser,expectDenied,owner,setupDb,uniqueEmail } from "./helpers";
let a="",b="";
beforeAll(async()=>{await setupDb();a=await createUser(uniqueEmail("working-a"));b=await createUser(uniqueEmail("working-b"));});
afterAll(closePool);
describe("working learning ownership",()=>{
 it("rejects anonymous access and cross-account writes",async()=>{
  await expectDenied(asUser(null,"select * from public.working_attempts"));
  await expectDenied(asUser({id:a},"insert into public.working_bookmarks(user_id,module_key) values($1,'SK-01')",[b]));
  await asUser({id:a},"insert into public.working_bookmarks(user_id,module_key) values($1,'SK-01')",[a]);
  expect((await asUser({id:b},"select * from public.working_bookmarks")).rows).toHaveLength(0);
  expect((await asUser({id:b},"delete from public.working_bookmarks where user_id=$1 returning *",[a])).rows).toHaveLength(0);
  await expectDenied(asUser({id:a},"update public.working_bookmarks set user_id=$1",[b]));
 });
 it("keeps the latest answer when an old retry arrives",async()=>{
  await asUser({id:a},"select public.working_record_attempt('QB-D06-T01-1','QB-D06-T01',0::smallint,false,now()-interval '2 hours')");
  await asUser({id:a},"select public.working_record_attempt('QB-D06-T01-1','QB-D06-T01',3::smallint,true,now()-interval '1 hour')");
  await asUser({id:a},"select public.working_record_attempt('QB-D06-T01-1','QB-D06-T01',0::smallint,false,now()-interval '2 hours')");
  const rows=(await asUser({id:a},"select * from public.working_attempts")).rows;
  expect(rows).toHaveLength(1);expect(rows[0].correct).toBe(true);expect(rows[0].choice).toBe(3);expect(rows[0].box).toBe(2);
  expect((await asUser({id:b},"select * from public.working_attempts")).rows).toHaveLength(0);
 });
 it("moves a question up the Leitner schedule on a correct answer and back to box 1 on a mistake",async()=>{
  const u=await createUser(uniqueEmail("working-box"));
  const box=async()=>(await asUser({id:u},"select box from public.working_attempts where question_id='QB-D01-T03-1'")).rows[0]?.box;
  await asUser({id:u},"select public.working_record_attempt('QB-D01-T03-1','QB-D01-T03',1::smallint,true,now())");
  expect(await box()).toBe(2);
  await asUser({id:u},"select public.working_record_attempt('QB-D01-T03-1','QB-D01-T03',2::smallint,true,now()+interval '1 second')");
  expect(await box()).toBe(3);
  await asUser({id:u},"select public.working_record_attempt('QB-D01-T03-1','QB-D01-T03',0::smallint,false,now()+interval '2 seconds')");
  expect(await box()).toBe(1);
 });
 it("does not advance a revision box on equal-timestamp retries, including concurrent submissions",async()=>{
  const u=await createUser(uniqueEmail("working-replay"));
  const eventAt="2026-01-01T00:00:00.000Z";
  const write=(choice:number,correct:boolean,at:string)=>asUser({id:u},"select public.working_record_attempt('QB-D01-T03-1','QB-D01-T03',$1::smallint,$2,$3::timestamptz)",[choice,correct,at]);
  await Promise.all([write(1,true,eventAt),write(1,true,eventAt)]);
  const read=async()=>(await asUser({id:u},"select box,choice,correct from public.working_attempts where question_id='QB-D01-T03-1'")).rows[0];
  expect(await read()).toEqual({box:2,choice:1,correct:true});
  await write(0,false,eventAt);
  expect(await read()).toEqual({box:2,choice:1,correct:true});
  await write(2,true,"2026-01-01T00:00:01.000Z");
  expect(await read()).toEqual({box:3,choice:2,correct:true});
 });
 it("keeps the first accepted session at equal timestamps and accepts a newer save",async()=>{
  const u=await createUser(uniqueEmail("working-session-replay"));
  const at="2026-01-01T00:00:00.000Z";
  await asUser({id:u},"select public.working_save_session_v2('SC-01','scenario','sc2-test',2,2,false,$1::timestamptz,'[{\"position\":1,\"choice\":0}]'::jsonb)",[at]);
  await asUser({id:u},"select public.working_save_session('SC-01','scenario','legacy',1,0,false,$1::timestamptz)",[at]);
  const read=async()=>(await asUser({id:u},"select version,position,score,finished,decisions from public.working_sessions where module_key='SC-01'")).rows[0];
  expect(await read()).toEqual({version:"sc2-test",position:2,score:2,finished:false,decisions:[{position:1,choice:0}]});
  await asUser({id:u},"select public.working_save_session('SC-01','scenario','legacy',3,4,true,$1::timestamptz)",["2026-01-01T00:00:01.000Z"]);
  expect(await read()).toEqual({version:"legacy",position:3,score:4,finished:true,decisions:null});
 });
 it("owns completion status and cascades deletion",async()=>{
  const u=await createUser(uniqueEmail("working-delete"));
  await asUser({id:u},"insert into public.working_lessons(user_id,module_key,completed) values($1,'SK-01',true)",[u]);
  expect((await asUser({id:a},"select * from public.working_lessons")).rows).toHaveLength(0);
  await owner.query("delete from auth.users where id=$1",[u]);
  expect((await owner.query("select * from public.working_lessons where user_id=$1",[u])).rows).toHaveLength(0);
 });
 it("saves a resumable session, rejects cross-account access, keeps the newer save, and cascades on account deletion",async()=>{
  const u=await createUser(uniqueEmail("working-session"));
  await expectDenied(asUser(null,"select * from public.working_sessions"));
  await asUser({id:u},"select public.working_save_session('QB-D06-T01','quiz','v1',2,1,false,now()-interval '2 hours')");
  expect((await asUser({id:b},"select * from public.working_sessions where user_id=$1",[u])).rows).toHaveLength(0);
  let row=(await asUser({id:u},"select * from public.working_sessions")).rows[0];
  expect(row).toMatchObject({position:2,score:1,finished:false,version:"v1"});
  await asUser({id:u},"select public.working_save_session('QB-D06-T01','quiz','v1',5,3,false,now()-interval '1 hour')");
  await asUser({id:u},"select public.working_save_session('QB-D06-T01','quiz','v1',2,1,false,now()-interval '2 hours')"); // stale retry, must not win
  row=(await asUser({id:u},"select * from public.working_sessions")).rows[0];
  expect(row).toMatchObject({position:5,score:3});
  await owner.query("delete from auth.users where id=$1",[u]);
  expect((await owner.query("select * from public.working_sessions where user_id=$1",[u])).rows).toHaveLength(0);
 });
 it("lets a learner discard their own session but not another's",async()=>{
  await asUser({id:a},"select public.working_save_session('QB-D06-T01','quiz','v1',1,0,false,now())");
  expect((await asUser({id:b},"delete from public.working_sessions where user_id=$1 returning *",[a])).rows).toHaveLength(0);
  await asUser({id:a},"delete from public.working_sessions where module_key='QB-D06-T01'");
  const rows=(await asUser({id:a},"select * from public.working_sessions")).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({finished:true,version:"dismissed-v1",position:0,score:0,decisions:null});
  await asUser({id:a},"select public.working_save_session('QB-D06-T01','quiz','stale',2,1,false,now()-interval '1 hour')");
  expect((await asUser({id:a},"select * from public.working_sessions")).rows[0]).toMatchObject({finished:true,version:"dismissed-v1"});
  await asUser({id:a},"select public.working_save_session('QB-D06-T01','quiz','new',1,0,false,now()+interval '1 second')");
  expect((await asUser({id:a},"select * from public.working_sessions")).rows[0]).toMatchObject({finished:false,version:"new"});
 });
});
