import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
const cases = loadScenarioDrafts();
const get = (key: string) => cases.find(d => d.scenario_id === key)!;
describe("Respiratory evidence gap reconciliation", () => {
  it("preserves draft safeguards and source traces", () => {
    for (const key of ["SC-03", "SC-04", "SC-06", "SC-18"]) {
      const d = get(key);
      expect(d.clinically_reviewed).toBe(false);
      expect(d.required_sources.length).toBeGreaterThan(0);
      expect(validateScenarioDraft(d, loadScenarioKnownSources())).toEqual([]);
    }
  });
  it("adds current respiratory support and unplanned extubation evidence", () => {
    expect(get("SC-03").steps![1]!.options[0]!.sources).toContain("S-ATS-NIRS-2026");
    expect(get("SC-06").steps![1]!.options[0]!.sources).toContain("S-ISCCM-WEAN-2024");
    expect(get("SC-06").steps![1]!.options[0]!.feedback).toContain("respiratory exhaustion");
  });
  it("keeps device-specific alarms and aspiration infection distinction explicit", () => {
    expect(get("SC-04").steps![1]!.options[0]!.sources).toContain("S-AARC-MV-SAFETY");
    expect(get("SC-18").steps![2]!.options[0]!.feedback).toContain("not automatically bacterial pneumonia");
  });
});
