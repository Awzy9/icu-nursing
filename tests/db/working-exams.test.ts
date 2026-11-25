import { afterAll,beforeAll,describe,expect,it } from "vitest";
import { asUser,closePool,createUser,expectDenied,owner,setupDb,uniqueEmail } from "./helpers";
let a="",b="";
beforeAll(async()=>{await setupDb();a=await createUser(uniqueEmail("exam-a"));b=await createUser(uniqueEmail("exam-b"));});
afterAll(closePool);
describe("working exam ownership and timing",()=>{
 it("rejects anonymous access and crafting a started_at directly (only working_exam_start may set it)",async()=>{
  await expectDenied(asUser(null,"select * from public.working_exams"));
  await expectDenied(asUser({id:a},"insert into public.working_exams(user_id,question_ids,time_limit_seconds,started_at) values($1,array['Q1'],600,now()+interval '1 day')",[a]));
 });
 it("starts an exam for the caller only, with a server-set start time",async()=>{
  const r=await asUser({id:a},"select public.working_exam_start(array['Q1','Q2','Q3'],600) as id");
  const id=r.rows[0].id;
  expect(await asUser({id:b},"select * from public.working_exams where id=$1",[id])).toMatchObject({rows:[]});
  const row=(await asUser({id:a},"select * from public.working_exams where id=$1",[id])).rows[0];
  expect(row.question_ids).toEqual(["Q1","Q2","Q3"]);
  expect(row.answers).toEqual({});
  expect(row.submitted_at).toBeNull();
 });
 it("records an answer only for a question in the exam, and rejects once time has run out",async()=>{
  const r=await asUser({id:a},"select public.working_exam_start(array['Q1','Q2'],600) as id");
  const id=r.rows[0].id;
  await asUser({id:a},"select public.working_exam_answer($1,'Q1',2::smallint)",[id]);
  expect((await asUser({id:a},"select answers from public.working_exams where id=$1",[id])).rows[0].answers).toEqual({Q1:2});
  await expect(asUser({id:b},"select public.working_exam_answer($1,'Q2',1::smallint)",[id])).rejects.toThrow("exam not found");
  await expect(asUser({id:a},"select public.working_exam_answer($1,'NOT-IN-EXAM',1::smallint)",[id])).rejects.toThrow("question not in this exam");
  await owner.query("update public.working_exams set started_at=now()-interval '20 minutes' where id=$1",[id]);
  await expect(asUser({id:a},"select public.working_exam_answer($1,'Q2',1::smallint)",[id])).rejects.toThrow("time is up");
 });
 it("locks answers once submitted, and a second submit is a harmless no-op",async()=>{
  const r=await asUser({id:a},"select public.working_exam_start(array['Q1'],600) as id");
  const id=r.rows[0].id;
  await asUser({id:a},"select public.working_exam_submit($1)",[id]);
  const submittedAt=(await asUser({id:a},"select submitted_at from public.working_exams where id=$1",[id])).rows[0].submitted_at;
  expect(submittedAt).not.toBeNull();
  await expect(asUser({id:a},"select public.working_exam_answer($1,'Q1',0::smallint)",[id])).rejects.toThrow("exam already submitted");
  await asUser({id:a},"select public.working_exam_submit($1)",[id]);
  expect((await asUser({id:a},"select submitted_at from public.working_exams where id=$1",[id])).rows[0].submitted_at).toEqual(submittedAt);
 });
 it("cascades deletion with the account",async()=>{
  const u=await createUser(uniqueEmail("exam-delete"));
  const r=await asUser({id:u},"select public.working_exam_start(array['Q1'],600) as id");
  await owner.query("delete from auth.users where id=$1",[u]);
  expect((await owner.query("select * from public.working_exams where id=$1",[r.rows[0].id])).rows).toHaveLength(0);
 });
 it("rejects direct answer updates outside the exam or with an invalid choice",async()=>{
  const id=(await asUser({id:a},"select public.working_exam_start(array['Q1'],600) as id")).rows[0].id;
  for(const invalid of [{OTHER:1},{Q1:4},{Q1:"1"},[1]]){
   await expect(asUser({id:a},"update public.working_exams set answers=$2::jsonb where id=$1",[id,JSON.stringify(invalid)])).rejects.toThrow(/invalid exam answer/);
  }
  await asUser({id:a},"update public.working_exams set answers=$2::jsonb where id=$1",[id,JSON.stringify({Q1:2})]);
  expect((await asUser({id:a},"select answers from public.working_exams where id=$1",[id])).rows[0].answers).toEqual({Q1:2});
 });
 it("prevents direct writes after expiry and stamps submission using the server clock",async()=>{
  const id=(await asUser({id:a},"select public.working_exam_start(array['Q1'],60) as id")).rows[0].id;
  await owner.query("update public.working_exams set started_at=now()-interval '20 minutes' where id=$1",[id]);
  await expect(asUser({id:a},"update public.working_exams set answers=$2::jsonb where id=$1",[id,JSON.stringify({Q1:1})])).rejects.toThrow("time is up");
  await asUser({id:a},"update public.working_exams set submitted_at=now()+interval '1 day' where id=$1",[id]);
  const row=(await owner.query("select submitted_at, submitted_at <= clock_timestamp() as server_time from public.working_exams where id=$1",[id])).rows[0];
  expect(row.server_time).toBe(true);
  expect(row.submitted_at).not.toBeNull();
  await expect(asUser({id:a},"update public.working_exams set submitted_at=null where id=$1",[id])).rejects.toThrow("exam already submitted");
  await expect(asUser({id:a},"update public.working_exams set answers=$2::jsonb where id=$1",[id,JSON.stringify({Q1:1})])).rejects.toThrow("exam already submitted");
 });

});
