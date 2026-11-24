import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
const cases = loadScenarioDrafts();
const get = (key: string) => cases.find(d => d.scenario_id === key)!;
describe("Shock evidence gap reconciliation", () => {
  it("preserves draft status and complete registered option traces", () => {
    for (const key of ["SC-01", "SC-02", "SC-09", "SC-16"]) {
      const d = get(key);
      expect(d.clinically_reviewed).toBe(false);
      expect(d.required_sources.length).toBeGreaterThan(0);
      expect(validateScenarioDraft(d, loadScenarioKnownSources())).toEqual([]);
    }
  });
  it("distinguishes antibiotic urgency and ongoing perfusion reassessment", () => {
    expect(get("SC-01").steps![0]!.options[0]!.feedback).toContain("within one hour");
    expect(get("SC-02").steps![2]!.options[0]!.sources).toContain("S-ACC-CS-JACC-2025");
  });
  it("distinguishes EVERDAC strategy evidence from pressure measurement equivalence", () => {
    const o = get("SC-16").steps![0]!.options[0]!;
    expect(o.sources).toContain("S-EVERDAC-2025");
    expect(o.feedback).toContain("interchangeable");
  });
  it("traces emergency haemorrhage recognition to professional guidance", () => {
    expect(get("SC-09").steps![0]!.options[0]!.sources).toContain("S-AOA-BLOOD-2025");
    expect(get("SC-09").steps![1]!.options[2]!.points).toBe(0);
  });
});
