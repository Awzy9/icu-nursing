import { beforeEach,describe,expect,it,vi } from "vitest";
const f=vi.hoisted(()=>({getUser:vi.fn(),rpc:vi.fn(),entry:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:{getUser:f.getUser},rpc:f.rpc})}));
vi.mock("@/lib/working",()=>({workingEditionEnabled:()=>true,workingEntry:f.entry}));
import { saveLearningAnswer } from "@/app/[locale]/learning/actions";
beforeEach(()=>{f.getUser.mockReset().mockResolvedValue({data:{user:{id:"user-a"}},error:null});f.rpc.mockReset().mockResolvedValue({error:null});f.entry.mockReset().mockReturnValue({key:"QB-EXAMPLE",questions:[{id:"QB-EXAMPLE-1",answer:2}]});});
describe("account quiz actions",()=>{
 it("calculates correctness from authored content, never a client claim",async()=>{
  expect(await saveLearningAnswer({id:"QB-EXAMPLE-1",moduleKey:"QB-EXAMPLE",choice:0,correct:true,at:Date.now()})).toEqual({ok:true});
  expect(f.rpc).toHaveBeenCalledWith("working_record_attempt",expect.objectContaining({p_choice:0,p_correct:false}));
 });
 it("refuses unauthenticated saves",async()=>{f.getUser.mockResolvedValue({data:{user:null},error:null});expect((await saveLearningAnswer({id:"QB-EXAMPLE-1",moduleKey:"QB-EXAMPLE",choice:2,at:Date.now()})).ok).toBe(false);expect(f.rpc).not.toHaveBeenCalled();});
 it("rejects unknown questions and invalid choices",async()=>{expect((await saveLearningAnswer({id:"UNKNOWN",moduleKey:"QB-EXAMPLE",choice:1,at:Date.now()})).ok).toBe(false);expect((await saveLearningAnswer({id:"QB-EXAMPLE-1",moduleKey:"QB-EXAMPLE",choice:9,at:Date.now()})).ok).toBe(false);expect(f.rpc).not.toHaveBeenCalled();});
});
