import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
describe("Resuscitation, transfusion, CRRT and hypotension simulation checkpoints", () => {
 const drafts=loadScenarioDrafts();
 const known=loadScenarioKnownSources();
 const get=(key:string)=>drafts.find(d=>d.scenario_id===key)!;
 for(const key of ["SC-13","SC-14","SC-15","SC-16"]) it(key+" retains shared checkpoints and conditional consequences",()=>{
  const d=get(key);
  expect(validateScenarioDraft(d,known)).toEqual([]);
  expect(d.clinically_reviewed).toBe(false);
  expect(d.steps).toHaveLength(key==="SC-14"?2:3);
  for(const step of d.steps!){
   expect(step.options).toHaveLength(3);
   expect(step.options.filter(o=>o.points===2)).toHaveLength(1);
   expect(new Set(step.options.map(o=>o.next))).toEqual(new Set([step.position===d.steps!.length?null:step.position+1]));
   for(const o of step.options) expect(o.consequence).toMatch(/may|could|might/);
  }
 });
 it("retains urgent action and uncertainty at key checkpoints",()=>{
  expect(get("SC-13").steps![2]!.observations.some(o=>o.key==="circulation"&&o.value==="Not established")).toBe(true);
  expect(get("SC-14").steps![1]!.observations.some(o=>o.key==="component"&&String(o.value).includes("do not restart"))).toBe(true);
  expect(get("SC-15").steps![1]!.options[0]!.consequence).toContain("determines whether blood return is safe");
  expect(get("SC-15").steps![2]!.observations.some(o=>o.key==="balance")).toBe(true);
  expect(get("SC-16").steps![2]!.observations.some(o=>o.key==="response"&&String(o.value).includes("Re-escalate"))).toBe(true);
 });
});
