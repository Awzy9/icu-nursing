import { render,screen,fireEvent,waitFor,cleanup } from "@testing-library/react";
import { afterEach,beforeEach,expect,it,vi } from "vitest";
const actions=vi.hoisted(()=>({answer:vi.fn()}));
vi.mock("@/app/[locale]/learning/actions",()=>({saveLearningAnswer:actions.answer,setLearningBookmark:vi.fn(),setLearningComplete:vi.fn(),refreshLearning:async()=>({ok:true,state:{attempts:[],bookmarks:[],lessons:[]}})}));
import { LearningProvider,useLearning } from "@/components/working/progress";
const attempt={id:"QB-EXAMPLE-1",title:"Example",href:"/working/QB-EXAMPLE",choice:1,correct:false,at:1000};
function TestControls(){const s=useLearning();return <><p>Count: {s.attempts.length}</p><p>Pending: {s.pending}</p>{s.error?<p role="alert">{s.error}</p>:null}<button onClick={()=>s.saveAnswer(attempt)}>Save</button><button onClick={s.retry}>Retry</button></>;}
beforeEach(()=>{localStorage.clear();actions.answer.mockReset();});
afterEach(cleanup);
it("does not copy guest practice into another person's account",()=>{
 localStorage.setItem("icu-nursing-learning-v1",JSON.stringify({[attempt.id]:attempt}));
 render(<LearningProvider accountId="account-a"><TestControls/></LearningProvider>);expect(screen.getByText("Count: 0")).toBeVisible();
});
it("retains failed saves in an account-scoped queue and retries visibly",async()=>{
 actions.answer.mockResolvedValueOnce({ok:false,error:"Offline"}).mockResolvedValueOnce({ok:true});
 render(<LearningProvider accountId="account-a"><TestControls/></LearningProvider>);
 fireEvent.click(screen.getByText("Save"));await waitFor(()=>expect(screen.getByText("Pending: 1")).toBeVisible());expect(screen.getByRole("alert")).toHaveTextContent("Offline");
 expect(localStorage.getItem("icu-learning-pending:account-a")).toContain("QB-EXAMPLE-1");expect(localStorage.getItem("icu-learning-pending:account-b")).toBeNull();
 fireEvent.click(screen.getByText("Retry"));await waitFor(()=>expect(screen.getByText("Pending: 0")).toBeVisible());
});
