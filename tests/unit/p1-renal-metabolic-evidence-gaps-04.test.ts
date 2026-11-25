import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
const cases = loadScenarioDrafts();
const get = (key: string) => cases.find(d => d.scenario_id === key)!;
describe("Renal and metabolic evidence gap reconciliation", () => {
  it("preserves draft status and source trace validity", () => {
    for (const key of ["SC-10", "SC-11", "SC-15"]) {
      const d = get(key);
      expect(d.clinically_reviewed).toBe(false);
      expect(validateScenarioDraft(d, loadScenarioKnownSources())).toEqual([]);
    }
  });
  it("distinguishes delivered clearance, fluid removal and citrate monitoring", () => {
    const d = get("SC-15");
    expect(d.steps![2]!.options[0]!.sources).toContain("S-RRT-MULTIDISC-2026");
    expect(d.steps![2]!.options[1]!.points).toBe(0);
    expect(d.steps![2]!.options[0]!.text).toContain("If regional citrate anticoagulation is in use");
  });
  it("retains conflicting UKKA thresholds and escalates even without typical ECG changes", () => {
    expect(get("SC-11").steps![0]!.options[0]!.feedback).toContain("normal ECG does not exclude");
    expect(get("SC-11").required_sources.some(s => s.includes("discrepancy"))).toBe(true);
  });
  it("replaces the older JBDS source without inventing independent approval", () => {
    const d = get("SC-10");
    expect(d.sources.map(s=>s.id)).toContain("S-JBDS-HYPO-2023");
    expect(d.sources.map(s=>s.id)).not.toContain("N-JBDS-HYPO-2020");
    expect(d.steps![0]!.options[0]!.feedback).toContain("10–15 minutes");
  });
});
