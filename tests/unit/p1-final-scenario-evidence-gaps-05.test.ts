import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
const cases = loadScenarioDrafts();
const get = (key: string) => cases.find(d => d.scenario_id === key)!;
describe("Final scenario evidence gap reconciliation", () => {
  it("preserves draft safeguards for all five cases", () => {
    for (const key of ["SC-05", "SC-07", "SC-14", "SC-17", "SC-20"]) {
      const d = get(key);
      expect(d.clinically_reviewed).toBe(false);
      expect(validateScenarioDraft(d, loadScenarioKnownSources())).toEqual([]);
    }
  });
  it("traces acute desaturation to ABCDE and ICP positioning to neurocritical care", () => {
    expect(get("SC-05").steps![0]!.options[0]!.sources).toContain("S-RCUK-ABCDE-ADULT");
    expect(get("SC-07").steps![1]!.options[0]!.sources).toContain("S-NCS-EDEMA-2020");
  });
  it("uses BSH 2023 severe reaction guidance without waiting for results", () => {
    const d = get("SC-14");
    expect(d.sources.find(s=>s.id==="S-BSH-ATR")?.read).toBe("partial");
    expect(d.steps![1]!.options[0]!.feedback).toContain("must not wait for laboratory results");
  });
  it("retains conditional sedation advice and commercial permission caveat", () => {
    const d = get("SC-17");
    expect(d.steps![1]!.options[0]!.sources).toContain("S-SCCM-PADIS-FOCUSED-2025");
    expect(d.required_sources.some(s=>s.includes("paid-platform"))).toBe(true);
  });
  it("links TBI deterioration to urgent repeat imaging", () => {
    expect(get("SC-20").steps![2]!.options[0]!.sources).toContain("S-ACS-TBI-2024");
  });
});
