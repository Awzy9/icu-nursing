import { describe, expect, it } from "vitest";
import { loadScenarioDrafts } from "../../scripts/validate-scenario-drafts";

describe("Scenario answer-length clue regression", () => {
  const cases = loadScenarioDrafts();
  it("does not regress the initial answer-length improvements", () => {
    const steps = cases.flatMap(d=>d.steps ?? []);
    const longest = steps.filter(s=>{
      const correct=s.options.find(o=>o.points===2);
      return correct !== undefined && correct.text.length >= Math.max(...s.options.filter(o=>o.points!==2).map(o=>o.text.length));
    });
    expect(steps).toHaveLength(59);
    expect(longest.length).toBeLessThanOrEqual(56);
  });
  for (const [id,position] of [["SC-04",1],["SC-06",1],["SC-19",2]] as const) {
    it(id+" checkpoint "+position+" retains scoring and reduces the length clue",()=>{
      const step=cases.find(d=>d.scenario_id===id)!.steps!.find(s=>s.position===position)!;
      expect(step.options.map(o=>o.points)).toEqual([2,0,0]);
      expect(step.options[0]!.text.length).toBeLessThan(Math.max(...step.options.slice(1).map(o=>o.text.length)));
      expect(step.options.every(o=>o.sources.length>0)).toBe(true);
    });
  }
});
