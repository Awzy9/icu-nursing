import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
describe("Bleeding, metabolic and rhythm simulation checkpoints", () => {
 const drafts=loadScenarioDrafts();
 const known=loadScenarioKnownSources();
 const get=(key:string)=>drafts.find(d=>d.scenario_id===key)!;
 for(const key of ["SC-09","SC-10","SC-11","SC-12"]) it(key+" retains shared checkpoints and conditional consequences",()=>{
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
 it("retains residual risks and avoids assuming recovery from a single improved reading",()=>{
  expect(get("SC-09").steps![2]!.observations.some(o=>o.key==="coag")).toBe(true);
  expect(get("SC-10").steps![1]!.observations.some(o=>o.key==="swallow"&&o.value==="Unsafe")).toBe(true);
  expect(get("SC-11").steps![2]!.observations.some(o=>o.key==="renal")).toBe(true);
  expect(get("SC-12").steps![1]!.observations.some(o=>o.key==="pulse"&&o.value==="Present")).toBe(true);
  expect(get("SC-05").steps![0]!.options[0]!.consequence).toContain("other causes of deterioration");
 });
});
