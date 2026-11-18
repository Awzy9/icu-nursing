import { fireEvent, render, screen, cleanup, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LearningQuiz } from "@/components/working/quiz";
import { ScenarioPlayer } from "@/components/working/scenario";
import { WorkingStudy } from "@/components/working/study";
import { PracticePlayer } from "@/components/working/practice";
import { buildWorkingContent } from "../../scripts/build-working-content";
vi.mock("@/i18n/navigation",()=>({Link:({children,href,...props}:React.AnchorHTMLAttributes<HTMLAnchorElement>)=><a href={href} {...props}>{children}</a>}));
const question={id:"test-question",prompt:"Choose a response",options:["First","Second","Third","Fourth"],answer:1,explanation:"Because the second choice fits."};
const revisionQuestions=[{id:question.id,prompt:question.prompt,options:question.options,answer:question.answer,explanation:question.explanation,moduleKey:"EXAMPLE",moduleTitle:"Example lesson",moduleHref:"/working/EXAMPLE"}];
beforeEach(()=>localStorage.clear());
afterEach(()=>cleanup());
describe("interactive learning",()=>{
 it("parses all 306 authored questions without missing choices or keys",()=>{
   const entries=buildWorkingContent();
   const questions=entries.filter(e=>e.type==="questions").flatMap(e=>e.questions??[]);
   expect(questions).toHaveLength(306);
   expect(questions.every(q=>q.options.length===4&&q.answer>=0&&q.answer<4&&q.prompt.length>10&&q.explanation.length>10)).toBe(true);
   expect(entries.filter(e=>e.scenario)).toHaveLength(20);
   expect(entries.filter(e=>e.practice)).toHaveLength(12);
   for(const entry of entries.filter(e=>e.scenario))for(const step of entry.scenario!.steps)for(const option of step.options)expect(option.next==null||entry.scenario!.steps.some(s=>s.position===option.next)).toBe(true);
 });
 it("requires a choice, reveals feedback only after checking, and records mistakes for revision",()=>{
   render(<LearningQuiz questions={[question]} title="Example lesson" moduleKey="EXAMPLE" locale="en"/>);
   expect(screen.getByRole("button",{name:"Check answer"})).toBeDisabled();
   expect(screen.queryByText(question.explanation)).not.toBeInTheDocument();
   fireEvent.click(screen.getByRole("radio",{name:/First/}));
   expect(screen.queryByText(question.explanation)).not.toBeInTheDocument();
   fireEvent.click(screen.getByRole("button",{name:"Check answer"}));
   expect(screen.getByText(question.explanation)).toBeVisible();
   expect(screen.getByRole("radio",{name:/Second/})).toBeDisabled();
   fireEvent.click(screen.getByRole("button",{name:"View results"}));
   expect(screen.getByText("0 / 1")).toBeVisible();
   cleanup();render(<WorkingStudy locale="en" questions={revisionQuestions}/>);
   expect(screen.getByText("1 question due now across 1 topic")).toBeVisible();
   fireEvent.click(screen.getByRole("button",{name:"Start revision session"}));
   expect(screen.getByText(question.prompt)).toBeVisible();
   expect(screen.getByRole("link",{name:/Example lesson/})).toHaveAttribute("href","/working/EXAMPLE");
 });
 it("replaces a previous mistake when the answer is corrected",()=>{
   localStorage.setItem("icu-nursing-learning-v1",JSON.stringify({"test-question":{id:"test-question",correct:false,href:"/working/EXAMPLE",title:"Example lesson",at:1}}));
   render(<LearningQuiz questions={[question]} title="Example lesson" moduleKey="EXAMPLE" locale="en"/>);
   fireEvent.click(screen.getByRole("radio",{name:/Second/}));fireEvent.click(screen.getByRole("button",{name:"Check answer"}));
   cleanup();render(<WorkingStudy locale="en" questions={revisionQuestions}/>);
   expect(screen.getByText("You're up to date")).toBeVisible();
 });
 it("keeps scenario consequences hidden until a decision is confirmed",()=>{
   render(<ScenarioPlayer locale="en" moduleKey="SC-EXAMPLE" title="Example scenario" scenario={{setting:"A fictional setting",objectives:[],takeaways:["Reflect"],steps:[{position:1,info:"Situation",prompt:"What next?",options:[{text:"Call",points:2,next:null,feedback:"Escalate urgently",consequence:"Team arrives"}]}]}}/>);
   expect(screen.queryByText("Escalate urgently")).not.toBeInTheDocument();
   fireEvent.click(screen.getByRole("radio",{name:"Call"}));
   fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));
   expect(screen.getByText("Escalate urgently")).toBeVisible();
   fireEvent.click(screen.getByRole("button",{name:"Finish and reflect"}));expect(screen.getByText("Scenario complete")).toBeVisible();
 });
 it("shows the arrhythmia tracing before the decision and equipment images after feedback",()=>{
   const entries=buildWorkingContent();
   const rhythm=entries.find(entry=>entry.key==="SC-12")!;
   render(<ScenarioPlayer locale="en" moduleKey={rhythm.key} title={rhythm.title} scenario={rhythm.scenario!}/>);
   expect(screen.getByText("Illustrative wide-complex rhythm strip")).toBeVisible();
   cleanup();

   const ventilator=entries.find(entry=>entry.key==="SC-04")!;
   render(<ScenarioPlayer locale="en" moduleKey={ventilator.key} title={ventilator.title} scenario={ventilator.scenario!}/>);
   expect(screen.queryByRole("img")).not.toBeInTheDocument();
   fireEvent.click(screen.getAllByRole("radio")[0]!);
   fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));
   expect(screen.getByRole("img",{name:/Ventilator on a wheeled stand/i})).toBeVisible();
 });
 it("reveals respiratory readings only as the learner reaches each step",()=>{
   const respiratory=buildWorkingContent().find(entry=>entry.key==="SC-03")!;
   render(<ScenarioPlayer locale="en" moduleKey={respiratory.key} title={respiratory.title} scenario={respiratory.scenario!}/>);
   expect(screen.getByText("90%")).toBeVisible();
   expect(screen.queryByText("88%")).not.toBeInTheDocument();
   fireEvent.click(screen.getAllByRole("radio")[0]!);
   fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));
   expect(screen.queryByText("88%")).not.toBeInTheDocument();
   fireEvent.click(screen.getByRole("button",{name:"Continue"}));
   expect(screen.getByText("88%")).toBeVisible();
   expect(screen.getByText("90%")).toBeVisible();
 });
 it("keeps potassium and glucose histories separate even when their units are identical",()=>{
   const entry=buildWorkingContent().find(item=>item.key==="SC-11")!;
   render(<ScenarioPlayer locale="en" moduleKey={entry.key} title={entry.title} scenario={entry.scenario!}/>);
   expect(screen.queryByText("Scenario blood glucose")).not.toBeInTheDocument();
   for(let step=0;step<2;step++){
     fireEvent.click(screen.getAllByRole("radio")[0]!);
     fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));
     fireEvent.click(screen.getByRole("button",{name:"Continue"}));
   }
   const glucose=screen.getByText("Scenario blood glucose").closest("figure")!;
   const potassium=screen.getByText("Scenario serum potassium").closest("figure")!;
   expect(within(glucose).getByText("6.1 mmol/L")).toBeVisible();
   expect(within(glucose).queryByText(/Previous readings/)).not.toBeInTheDocument();
   expect(within(potassium).getAllByText("6.8 mmol/L")).toHaveLength(2);
 });
 it("shows authored neurological changes without revealing the next observations",()=>{
   const entry=buildWorkingContent().find(item=>item.key==="SC-20")!;
   render(<ScenarioPlayer locale="en" moduleKey={entry.key} title={entry.title} scenario={entry.scenario!}/>);
   const comparison=screen.getByText("Changes in neurological responses").closest("figure")!;
   expect(within(comparison).getByText("Motor response")).toBeVisible();
   expect(within(comparison).getByText("Lower than last check")).toBeVisible();
   expect(screen.queryByText("Still lower")).not.toBeInTheDocument();
 });
 it("does not disclose exercise feedback before checking",()=>{
   render(<PracticePlayer locale="en" exercise={{kind:"choice",setup:"Setting",options:[{id:"a",text:"Choice A",correct:true,feedback:"Authored feedback"}]}}/>);
   expect(screen.queryByText("Authored feedback")).not.toBeInTheDocument();
   fireEvent.click(screen.getByRole("radio",{name:"Choice A"}));fireEvent.click(screen.getByRole("button",{name:"Check my work"}));
   expect(screen.getByText(/Authored feedback/)).toBeVisible();
 });
});
