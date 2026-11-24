import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LearningQuiz } from "@/components/working/quiz";
import { ScenarioPlayer } from "@/components/working/scenario";
import { ContinueLearning } from "@/components/working/continue-learning";

vi.mock("@/i18n/navigation",()=>({Link:({children,href,...props}:React.AnchorHTMLAttributes<HTMLAnchorElement>)=><a href={href} {...props}>{children}</a>}));
vi.stubGlobal("confirm",()=>true);

const questions=[
 {id:"Q1",prompt:"Prompt one",options:["A","B","C","D"],answer:0,explanation:"Because A."},
 {id:"Q2",prompt:"Prompt two",options:["A","B","C","D"],answer:1,explanation:"Because B."},
 {id:"Q3",prompt:"Prompt three",options:["A","B","C","D"],answer:2,explanation:"Because C."},
];

beforeEach(()=>localStorage.clear());
afterEach(()=>cleanup());

describe("quiz save and resume (guest)",()=>{
 it("offers to resume at the next unanswered question after a simulated refresh, with the running score",()=>{
  render(<LearningQuiz questions={questions} title="Example module" moduleKey="EXAMPLE" locale="en"/>);
  fireEvent.click(screen.getByRole("radio",{name:/A/}));fireEvent.click(screen.getByRole("button",{name:"Check answer"}));
  fireEvent.click(screen.getByRole("button",{name:"Next question"}));
  cleanup();
  render(<LearningQuiz questions={questions} title="Example module" moduleKey="EXAMPLE" locale="en"/>);
  expect(screen.getByText("You have an unfinished session")).toBeVisible();
  expect(screen.getByText(/question 2 of 3, with a score of 1/i)).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Resume"}));
  expect(screen.getByText("Question 2 / 3")).toBeVisible();
  expect(screen.getByText("Prompt two")).toBeVisible();
 });
 it("lets a learner start over, discarding the saved session",()=>{
  render(<LearningQuiz questions={questions} title="Example module" moduleKey="EXAMPLE" locale="en"/>);
  fireEvent.click(screen.getByRole("radio",{name:/A/}));fireEvent.click(screen.getByRole("button",{name:"Check answer"}));
  fireEvent.click(screen.getByRole("button",{name:"Next question"}));
  cleanup();
  render(<LearningQuiz questions={questions} title="Example module" moduleKey="EXAMPLE" locale="en"/>);
  fireEvent.click(screen.getByRole("button",{name:"Start over"}));
  expect(screen.getByText("Question 1 / 3")).toBeVisible();
  cleanup();
  render(<LearningQuiz questions={questions} title="Example module" moduleKey="EXAMPLE" locale="en"/>);
  expect(screen.queryByText("You have an unfinished session")).not.toBeInTheDocument();
 });
 it("does not offer to resume once the quiz is finished",()=>{
  render(<LearningQuiz questions={[questions[0]!]} title="Example module" moduleKey="EXAMPLE" locale="en"/>);
  fireEvent.click(screen.getByRole("radio",{name:/A/}));fireEvent.click(screen.getByRole("button",{name:"Check answer"}));
  fireEvent.click(screen.getByRole("button",{name:"View results"}));
  cleanup();
  render(<LearningQuiz questions={[questions[0]!]} title="Example module" moduleKey="EXAMPLE" locale="en"/>);
  expect(screen.queryByText("You have an unfinished session")).not.toBeInTheDocument();
 });
 it("discards a stale session instead of resuming into content that no longer matches",()=>{
  localStorage.setItem("icu-nursing-sessions-v1",JSON.stringify({EXAMPLE:{key:"EXAMPLE",title:"Example module",href:"/working/EXAMPLE",type:"questions",kind:"quiz",version:"Q1,Q2",position:1,score:1,finished:false,at:Date.now()}}));
  render(<LearningQuiz questions={questions} title="Example module" moduleKey="EXAMPLE" locale="en"/>);
  expect(screen.queryByText("You have an unfinished session")).not.toBeInTheDocument();
  expect(screen.getByText("Question 1 / 3")).toBeVisible();
 });
});

describe("scenario save and resume (guest)",()=>{
 const scenario={setting:"A fictional setting",objectives:[],takeaways:["Reflect"],steps:[
  {position:1,info:"Situation one",prompt:"Decision one?",options:[{text:"Go to two",points:1,next:2,feedback:"Moving on",consequence:"Next step"}]},
  {position:2,info:"Situation two",prompt:"Decision two?",options:[{text:"Finish",points:2,next:null,feedback:"Done",consequence:"Scenario ends"}]},
 ]};
 it("resumes at the right step after a simulated refresh",()=>{
  render(<ScenarioPlayer scenario={scenario} locale="en" moduleKey="SC-EXAMPLE" title="Example scenario"/>);
  fireEvent.click(screen.getByRole("radio",{name:"Go to two"}));
  fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));
  fireEvent.click(screen.getByRole("button",{name:"Continue"}));
  cleanup();
  render(<ScenarioPlayer scenario={scenario} locale="en" moduleKey="SC-EXAMPLE" title="Example scenario"/>);
  expect(screen.getByText("You have an unfinished scenario")).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Resume"}));
  expect(screen.getByText("Situation two")).toBeVisible();
 });
 it("does not resume an old score after the options change but their count stays the same",()=>{
  render(<ScenarioPlayer scenario={scenario} locale="en" moduleKey="SC-EXAMPLE" title="Example scenario"/>);
  fireEvent.click(screen.getByRole("radio",{name:"Go to two"}));fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));fireEvent.click(screen.getByRole("button",{name:"Continue"}));
  cleanup();
  const updated={...scenario,steps:scenario.steps.map(s=>({...s,options:s.options.map(o=>({...o,feedback:"Revised guidance"}))}))};
  render(<ScenarioPlayer scenario={updated} locale="en" moduleKey="SC-EXAMPLE" title="Example scenario"/>);
  expect(screen.queryByText("You have an unfinished scenario")).not.toBeInTheDocument();
  expect(screen.getByText("Situation one")).toBeVisible();
 });
 it("has nothing to resume once the scenario finishes",()=>{
  render(<ScenarioPlayer scenario={scenario} locale="en" moduleKey="SC-EXAMPLE" title="Example scenario"/>);
  fireEvent.click(screen.getByRole("radio",{name:"Go to two"}));fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));fireEvent.click(screen.getByRole("button",{name:"Continue"}));
  fireEvent.click(screen.getByRole("radio",{name:"Finish"}));fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));fireEvent.click(screen.getByRole("button",{name:"Finish and reflect"}));
  expect(screen.getByText("Scenario complete")).toBeVisible();
  cleanup();
  render(<ScenarioPlayer scenario={scenario} locale="en" moduleKey="SC-EXAMPLE" title="Example scenario"/>);
  expect(screen.queryByText("You have an unfinished scenario")).not.toBeInTheDocument();
 });
});

describe("scenario personalized debrief",()=>{
 it("retains an incorrect earlier choice across a guest refresh",()=>{
  const scenario={setting:"Fictional",objectives:[],takeaways:["Reflect"],steps:[
   {position:1,info:"First stage",prompt:"First decision",options:[
    {text:"Preferred first action",points:2,next:2,feedback:"Preferred first guidance"},
    {text:"Incorrect first action",points:0,next:2,feedback:"Review first guidance"}
   ]},
   {position:2,info:"Second stage",prompt:"Second decision",options:[
    {text:"Finish action",points:2,next:null,feedback:"Finish guidance"}
   ]}
  ]};
  render(<ScenarioPlayer scenario={scenario} locale="en" moduleKey="SC-EXAMPLE" title="Example scenario"/>);
  fireEvent.click(screen.getByRole("radio",{name:"Incorrect first action"}));
  fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));
  fireEvent.click(screen.getByRole("button",{name:"Continue"}));
  cleanup();
  render(<ScenarioPlayer scenario={scenario} locale="en" moduleKey="SC-EXAMPLE" title="Example scenario"/>);
  fireEvent.click(screen.getByRole("button",{name:"Resume"}));
  fireEvent.click(screen.getByRole("radio",{name:"Finish action"}));
  fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));
  fireEvent.click(screen.getByRole("button",{name:"Finish and reflect"}));
  expect(screen.getByText("Incorrect first action",{exact:false})).toBeVisible();
  expect(screen.getByText("Review first guidance")).toBeVisible();
  expect(screen.queryByText(/Some earlier answer details are unavailable/)).not.toBeInTheDocument();
 });

 it("shows selected and preferred responses for missed decisions",()=>{
  const scenario={setting:"Fictional",objectives:[],takeaways:["Reflect"],steps:[
   {position:1,info:"First stage",prompt:"Choose a response",options:[
    {text:"Preferred action",points:2,next:null,feedback:"Preferred guidance"},
    {text:"Other action",points:0,next:null,feedback:"Review guidance"}
   ]}
  ]};
  render(<ScenarioPlayer scenario={scenario} locale="en" moduleKey="SC-EXAMPLE" title="Example scenario"/>);
  fireEvent.click(screen.getByRole("radio",{name:"Other action"}));
  fireEvent.click(screen.getByRole("button",{name:"Confirm decision"}));
  fireEvent.click(screen.getByRole("button",{name:"Finish and reflect"}));
  expect(screen.getByText("Review priorities")).toBeVisible();
  expect(screen.getByText("Other action",{exact:false})).toBeVisible();
  expect(screen.getByText("Preferred action",{exact:false})).toBeVisible();
  expect(screen.getByText("Educational feedback only; not a clinical competency assessment.")).toBeVisible();
 });
});
describe("ContinueLearning",()=>{
 it("lists an unfinished session with a resume link, and lets the learner discard it",()=>{
  localStorage.setItem("icu-nursing-sessions-v1",JSON.stringify({EXAMPLE:{key:"EXAMPLE",title:"Example module",href:"/working/EXAMPLE",type:"questions",kind:"quiz",version:"Q1,Q2,Q3",position:1,score:1,finished:false,at:Date.now()}}));
  render(<ContinueLearning locale="en"/>);
  expect(screen.getByRole("link",{name:/Resume/})).toHaveAttribute("href","/working/EXAMPLE");
  fireEvent.click(screen.getByRole("button",{name:"Discard"}));
  expect(screen.queryByText("Continue learning")).not.toBeInTheDocument();
 });
 it("renders nothing when there is no unfinished session",()=>{
  const {container}=render(<ContinueLearning locale="en"/>);
  expect(container).toBeEmptyDOMElement();
 });
});
