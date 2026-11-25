import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";

describe("November 24 priority draft evidence audit", () => {
  const scenarios = loadScenarioDrafts();
  const known = loadScenarioKnownSources();
  const desaturation = scenarios.find(x => x.scenario_id === "SC-05")!;
  const haemorrhage = scenarios.find(x => x.scenario_id === "SC-09")!;
  it("does not reward leaving a deteriorating patient unattended", () => {
    expect(desaturation.steps![0]!.options[1]!.points).toBe(0);
    expect(haemorrhage.steps![1]!.options[2]!.points).toBe(0);
  });
  it("does not cite artificial-airway suction guidance for the spontaneously breathing patient", () => {
    expect(desaturation.setting).toContain("without a ventilator");
    expect(desaturation.sources.some(s => s.id === "S-AARC-SUCT")).toBe(false);
    expect(desaturation.related.skills).not.toContain("SK-06");
    expect(desaturation.steps![1]!.options[0]!.text).toContain("oral suction");
    expect(desaturation.steps![1]!.options[0]!.sources).toContain("S-OPENRN-FUND-CH8");
  });
  it("preserves draft status and passes source/structure validation", () => {
    for (const d of [desaturation, haemorrhage]) {
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(validateScenarioDraft(d, known)).toEqual([]);
    }
    const register = JSON.parse(readFileSync("content/publication-approvals.json", "utf8"));
    expect(register.approvals).toEqual([]);
    expect(register.lab_approvals).toEqual([]);
  });
});
