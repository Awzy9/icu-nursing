import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
describe("Shock and respiratory simulation checkpoints", () => {
 const drafts=loadScenarioDrafts();
 const known=loadScenarioKnownSources();
 for(const key of ["SC-01","SC-02","SC-03","SC-04"]) it(key+" retains shared checkpoints and conditional consequences",()=>{
  const d=drafts.find(d=>d.scenario_id===key)!;
  expect(validateScenarioDraft(d,known)).toEqual([]);
  expect(d.clinically_reviewed).toBe(false);
  expect(d.steps).toHaveLength(3);
  for(const step of d.steps!){
   expect(step.options).toHaveLength(3);
   expect(step.options.filter(o=>o.points===2)).toHaveLength(1);
   expect(new Set(step.options.map(o=>o.next))).toEqual(new Set([step.position===3?null:step.position+1]));
   for(const o of step.options) expect(o.consequence).toMatch(/may|could|might/);
  }
 });
 it("retains residual perfusion and ventilation concerns despite improved readings",()=>{
  const step=(key:string)=>drafts.find(d=>d.scenario_id===key)!.steps![2]!;
  expect(step("SC-02").observations.some(o=>o.key==="urine"&&o.value==="Still low")).toBe(true);
  expect(step("SC-03").observations.some(o=>o.key==="alertness"&&o.value==="Still drowsier than baseline")).toBe(true);
  expect(step("SC-04").observations.some(o=>o.key==="volumes"&&o.value==="Reassessment required")).toBe(true);
 });
});
