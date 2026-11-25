import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("Targeted neurocritical care evidence reconciliation", () => {
  it("separates stroke escalation from GCS and avoids universal targets", () => {
    const t = readFileSync("content/drafts/batch-03/D03-T01-glasgow-coma-scale.md", "utf8");
    expect(t).toContain("does not exclude a disabling focal deficit");
    expect(t).toContain("not universal blood-pressure or glucose prescriptions");
    expect(t).toContain("clinically_reviewed: false");
  });
  it("preserves urgent herniation and seizure assessment", () => {
    const i = JSON.parse(readFileSync("content/drafts/scenarios/SC-07-raised-intracranial-pressure.json", "utf8"));
    const s = JSON.parse(readFileSync("content/drafts/scenarios/SC-08-acute-seizure.json", "utf8"));
    expect(JSON.stringify(i)).toContain("A complete Cushing triad is neither required");
    expect(JSON.stringify(s)).toContain("Do not delay authorised seizure treatment while waiting for glucose testing or EEG");
    for (const d of [i, s]) {
      expect(d.clinically_reviewed).toBe(false);
      expect(d.required_sources).toHaveLength(2);
    }
  });
});
