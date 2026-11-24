import { describe, expect, it } from "vitest";
import { scenarioSafetyRules, scenarioSafetyCategory } from "@icu/schemas/scenario-safety";
import { scenarioDebrief } from "@icu/schemas/scenario-debrief";
import case1 from "../../content/drafts/scenarios/SC-01-septic-shock.json";
import case2 from "../../content/drafts/scenarios/SC-02-cardiogenic-shock.json";
import case3 from "../../content/drafts/scenarios/SC-03-acute-respiratory-deterioration.json";
import case4 from "../../content/drafts/scenarios/SC-04-ventilator-alarm.json";
import case5 from "../../content/drafts/scenarios/SC-05-sudden-oxygen-desaturation.json";
import case6 from "../../content/drafts/scenarios/SC-06-accidental-extubation.json";
import case7 from "../../content/drafts/scenarios/SC-07-raised-intracranial-pressure.json";
import glucose from "../../content/drafts/scenarios/SC-10-hypoglycemia.json";
import arrest from "../../content/drafts/scenarios/SC-13-cardiac-arrest.json";
import transfusion from "../../content/drafts/scenarios/SC-14-transfusion-reaction.json";
import anaphylaxis from "../../content/drafts/scenarios/SC-19-anaphylaxis.json";

describe("Pilot safety-review rubric",()=>{
 it("every explicit rule matches one zero-point option in the canonical draft",()=>{
  const cases={"SC-01":case1,"SC-02":case2,"SC-03":case3,"SC-04":case4,"SC-05":case5,"SC-06":case6,"SC-07":case7,"SC-10":glucose,"SC-13":arrest,"SC-14":transfusion,"SC-19":anaphylaxis};
  expect(scenarioSafetyRules).toHaveLength(36);
  for(const rule of scenarioSafetyRules){
   const step=cases[rule.caseKey].steps.find(s=>s.position===rule.position)!;
   const matches=step.options.filter(o=>o.text===rule.text);
   expect(matches,rule.text).toHaveLength(1);
   expect(matches[0]!.points).toBe(0);
   expect(scenarioSafetyCategory(rule.caseKey,rule.position,matches[0])).toBe(rule.category);
  }
 });
 it("does not generalize to changed content, different cases or ordinary low scores",()=>{
  const rule=scenarioSafetyRules[0]!;
  expect(scenarioSafetyCategory(rule.caseKey,rule.position,{text:rule.text,points:2})).toBeUndefined();
  expect(scenarioSafetyCategory(rule.caseKey,rule.position,{text:rule.text+" revised",points:0})).toBeUndefined();
  expect(scenarioSafetyCategory("SC-01",rule.position,{text:rule.text,points:0})).toBeUndefined();
 });
 it("prioritizes an explicitly flagged choice without changing numerical learning points",()=>{
  const s={setting:"Fictional",objectives:[],takeaways:[],steps:[1,2,3].map(position=>({position,info:"Stage",prompt:"Choose",options:[{text:"Preferred",points:2,next:position===3?null:position+1,feedback:"Guidance"},{text:position===2?scenarioSafetyRules[1]!.text:"Ordinary incorrect choice",points:0,next:position===3?null:position+1,feedback:"Review"}]}))};
  const summary=scenarioDebrief(s,[{position:1,choice:1},{position:2,choice:1},{position:3,choice:0}],"SC-10");
  expect(summary.safetyReviewCount).toBe(1);
  expect(summary.priorities.map(e=>e.position)).toEqual([2,1]);
  expect(summary.observedPoints).toBe(2);
  expect(summary.observedMaximum).toBe(6);
 });
});
