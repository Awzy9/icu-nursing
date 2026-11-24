import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
describe("Final scenario realism and collection consistency", () => {
 const drafts=loadScenarioDrafts();
 const known=loadScenarioKnownSources();
 const get=(key:string)=>drafts.find(d=>d.scenario_id===key)!;
 it("retains every master scenario and shared checkpoint with conditional consequences",()=>{
  expect(drafts).toHaveLength(20);
  for(const d of drafts){
   expect(validateScenarioDraft(d,known),d.scenario_id).toEqual([]);
   expect(d.clinically_reviewed).toBe(false);
   for(const step of d.steps!){
    expect(step.options).toHaveLength(3);
    expect(step.options.filter(o=>o.points===2)).toHaveLength(1);
    expect(new Set(step.options.map(o=>o.next))).toEqual(new Set([step.position===d.steps!.length?null:step.position+1]));
    expect(new Set(step.observations.map(o=>o.key)).size).toBe(step.observations.length);
    for(const o of step.options) expect(o.consequence).toMatch(/may|could|might/);
   }
  }
  expect(drafts.reduce((n,d)=>n+d.steps!.length,0)).toBe(59);
 });
 it("retains critical distinctions in the final four cases",()=>{
  expect(get("SC-17").steps![2]!.observations.some(o=>o.key==="arousal")).toBe(true);
  expect(get("SC-18").steps![1]!.observations.some(o=>o.key==="tube"&&String(o.value).includes("Unconfirmed"))).toBe(true);
  expect(get("SC-19").steps![1]!.info).toContain("must not interrupt urgent treatment");
  expect(get("SC-20").steps![1]!.observations.some(o=>o.key==="limitations"&&String(o.value).includes("non-testable"))).toBe(true);
 });
});
