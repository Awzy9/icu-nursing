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
  it("tracks both ends of the length spectrum rather than requiring one fixed rank", () => {
    expect(steps).toHaveLength(59);
    const ranks = [0, 1, 2].map(rank => steps.filter(s => lengthRank(s) === rank).length);
    expect(Math.max(...ranks)).toBeLessThanOrEqual(24);
    expect(ranks[2]).toBeGreaterThanOrEqual(19);
    expect(steps.filter(s => spread(s) > 2).length).toBeLessThanOrEqual(11);
  });
  for (const d of cases) for (const step of d.steps ?? []) {
    it(d.scenario_id + " checkpoint " + step.position + " retains canonical scoring and source traces", () => {
      const partial = (d.scenario_id === "SC-04" || d.scenario_id === "SC-18") && step.position === 3;
      expect(step.options.map(o => o.points)).toEqual(partial ? [2, 1, 0] : [2, 0, 0]);
      expect(step.options.every(o => o.sources.length > 0)).toBe(true);
    });
  }
  for (const id of ["SC-01", "SC-02", "SC-03", "SC-04", "SC-05", "SC-06", "SC-07", "SC-08", "SC-17", "SC-20", "SC-09", "SC-10", "SC-11", "SC-12", "SC-13"]) {
    it(id + " offers similar-length options", () => {
      const revised = cases.find(d => d.scenario_id === id)!.steps!;
      expect(revised.every(s => spread(s) <= 1.3)).toBe(true);
      expect(new Set(revised.map(lengthRank)).size).toBeGreaterThanOrEqual(2);
    });
  }
});
