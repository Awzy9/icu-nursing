import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
describe("Airway and neurological simulation checkpoints", () => {
 const drafts=loadScenarioDrafts();
 const known=loadScenarioKnownSources();
 const get=(key:string)=>drafts.find(d=>d.scenario_id===key)!;
 for(const key of ["SC-05","SC-06","SC-07","SC-08"]) it(key+" retains shared checkpoints and conditional consequences",()=>{
  const d=get(key);
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
 it("distinguishes clinical improvement from recovery and checks treatment details",()=>{
  expect(get("SC-05").steps![2]!.observations.some(o=>o.key==="effort"&&o.value==="Still increased")).toBe(true);
  expect(get("SC-06").steps![2]!.observations.some(o=>o.key==="trace"&&String(o.value).includes("to be confirmed"))).toBe(true);
  expect(get("SC-07").steps![2]!.observations.some(o=>o.key==="renal")).toBe(true);
  expect(get("SC-08").steps![2]!.observations.some(o=>o.key==="medication"&&String(o.value).includes("administration time"))).toBe(true);
 });
});
