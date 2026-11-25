import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
describe("Priority audit 11–20 — emergency response scoring", () => {
  const all = loadScenarioDrafts();
  const get = (key: string) => all.find(x => x.scenario_id === key)!;
  it("does not award credit for delaying urgent assessment or treatment", () => {
    for (const [key, step, option] of [["SC-07",0,1],["SC-08",1,2],["SC-10",0,2],["SC-12",0,1]] as const) {
      expect(get(key).steps![step]!.options[option]!.points, key).toBe(0);
    }
  });
  it("does not defer glucose assessment until seizure treatment fails", () => {
    expect(get("SC-08").steps![0]!.options[0]!.text).toContain("glucose in parallel");
  });
  it("distinguishes permitted oral intake from swallowing ability and shockable from non-shockable arrest", () => {
    expect(get("SC-10").steps![0]!.options[0]!.text).toContain("permitted oral intake");
    expect(get("SC-12").steps![1]!.options[0]!.feedback).toContain("Not every pulseless rhythm requires a shock");
  });
  it("preserves draft status and validates the four corrected scenarios", () => {
    const known = loadScenarioKnownSources();
    for (const key of ["SC-07","SC-08","SC-10","SC-12"]) {
      const draft = get(key);
      expect(draft.clinically_reviewed).toBe(false);
      expect(validateScenarioDraft(draft, known), key).toEqual([]);
    }
  });
});
