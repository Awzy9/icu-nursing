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
    expect(longest.length).toBeLessThanOrEqual(28);
  });
  for (const [id,position] of [["SC-04",1],["SC-06",1],["SC-19",2],["SC-11",1],["SC-11",2],["SC-11",3],["SC-12",1],["SC-12",2],["SC-12",3],["SC-13",1],["SC-13",2],["SC-13",3],["SC-01",1],["SC-01",2],["SC-01",3],["SC-02",1],["SC-02",2],["SC-02",3],["SC-16",1],["SC-16",2],["SC-16",3],["SC-03",1],["SC-03",2],["SC-03",3],["SC-04",2],["SC-04",3],["SC-05",1],["SC-05",2],["SC-05",3],["SC-06",2],["SC-06",3]] as const) {
    it(id+" checkpoint "+position+" retains scoring and reduces the length clue",()=>{
      const step=cases.find(d=>d.scenario_id===id)!.steps!.find(s=>s.position===position)!;
      expect(step.options.map(o=>o.points)).toEqual(id==="SC-04" && position===3 ? [2,1,0] : [2,0,0]);
      expect(step.options[0]!.text.length).toBeLessThan(Math.max(...step.options.slice(1).map(o=>o.text.length)));
      expect(step.options.every(o=>o.sources.length>0)).toBe(true);
    });
  }
});
