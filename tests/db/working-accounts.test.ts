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
 it("owns completion status and cascades deletion",async()=>{
  const u=await createUser(uniqueEmail("working-delete"));
  await asUser({id:u},"insert into public.working_lessons(user_id,module_key,completed) values($1,'SK-01',true)",[u]);
  expect((await asUser({id:a},"select * from public.working_lessons")).rows).toHaveLength(0);
  await owner.query("delete from auth.users where id=$1",[u]);
  expect((await owner.query("select * from public.working_lessons where user_id=$1",[u])).rows).toHaveLength(0);
 });
});
