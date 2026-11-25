import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";

const cases = loadScenarioDrafts();
const get = (key: string) => cases.find(d => d.scenario_id === key)!;
describe("Emergency evidence gap reconciliation", () => {
  it("retains the clinical draft boundary and valid source traces", () => {
    for (const key of ["SC-08", "SC-12", "SC-13", "SC-19"]) {
      const d = get(key);
      expect(d.clinically_reviewed).toBe(false);
      expect(validateScenarioDraft(d, loadScenarioKnownSources())).toEqual([]);
    }
  });
  it("distinguishes route-specific epinephrine and updated observation guidance", () => {
    const d = get("SC-19");
    expect(d.steps![1]!.options[0]!.sources).toContain("S-ADRENALIN-IM-2025");
    expect(d.steps![1]!.options[0]!.sources).not.toContain("L-EPINEPHRINE");
    expect(d.steps![2]!.options[0]!.sources).toContain("S-NICE-NG258-2026");
  });
  it("retains urgent escalation for deteriorating rhythms and ongoing electrographic seizure risk", () => {
    expect(get("SC-12").steps![1]!.options[2]!.points).toBe(0);
    expect(get("SC-08").steps![2]!.options[0]!.sources).toContain("S-ACNS-CCEEG-2015");
    expect(get("SC-13").steps![0]!.options[0]!.sources).toContain("S-AHA-BLS-2025");
  });
});
