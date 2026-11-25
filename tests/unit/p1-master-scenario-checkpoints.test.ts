import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";

describe("Master scenario teaching checkpoint integrity", () => {
  const drafts = loadScenarioDrafts();
  const known = loadScenarioKnownSources();
  it("retains all 20 cases and every essential checkpoint regardless of earlier choices", () => {
    expect(drafts).toHaveLength(20);
    for (const d of drafts) {
      expect(validateScenarioDraft(d, known), d.scenario_id).toEqual([]);
      const steps = d.steps!;
      for (const [i, step] of steps.entries()) {
        expect(step.options.filter(o => o.points === 2), d.scenario_id + " step " + step.position).toHaveLength(1);
        expect(new Set(step.options.map(o => o.next)), d.scenario_id).toEqual(new Set([steps[i + 1]?.position ?? null]));
        expect(new Set(step.observations.map(o => o.key)).size, d.scenario_id).toBe(step.observations.length);
      }
    }
  });
  it("does not assume blood return after persistent CRRT alarms", () => {
    const d = drafts.find(d => d.scenario_id === "SC-15")!;
    expect(d.steps![1]!.options.find(o => o.points === 2)!.consequence).toContain("determines whether blood return is safe");
    expect(d.clinically_reviewed).toBe(false);
  });
});
