import { describe, expect, it } from "vitest";
import { loadScenarioDrafts } from "../../scripts/validate-scenario-drafts";
const cases = loadScenarioDrafts();
const steps = cases.flatMap(d => d.steps ?? []);
const lengthRank = (s: (typeof steps)[number]) => {
  const correct = s.options.find(o => o.points === 2)!;
  return s.options.filter(o => o.text.length < correct.text.length).length;
};
const spread = (s: (typeof steps)[number]) => {
  const lengths = s.options.map(o => o.text.length);
  return Math.max(...lengths) / Math.min(...lengths);
};
describe("Scenario answer cue and scoring regression", () => {
  it("limits rank bias and option-length spread across all master checkpoints", () => {
    expect(cases).toHaveLength(20);
    expect(steps).toHaveLength(59);
    const ranks = [0, 1, 2].map(rank => steps.filter(s => lengthRank(s) === rank).length);
    expect(Math.max(...ranks)).toBeLessThanOrEqual(21);
    expect(Math.min(...ranks)).toBeGreaterThanOrEqual(19);
    expect(steps.every(s => spread(s) <= 1.3)).toBe(true);
  });
  for (const d of cases) {
    it(d.scenario_id + " varies full-credit length rank", () => {
      expect(new Set((d.steps ?? []).map(lengthRank)).size).toBeGreaterThanOrEqual(2);
    });
    for (const step of d.steps ?? []) {
      it(d.scenario_id + " checkpoint " + step.position + " retains canonical scoring and source traces", () => {
        const partial = (d.scenario_id === "SC-04" || d.scenario_id === "SC-18") && step.position === 3;
        expect(step.options.map(o => o.points)).toEqual(partial ? [2, 1, 0] : [2, 0, 0]);
        expect(step.options.every(o => o.sources.length > 0)).toBe(true);
      });
    }
  }
});
