import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("2026 respiratory evidence reconciliation", () => {
  it("distinguishes hypoxaemic from hypercapnic support and preserves escalation", () => {
    const text = readFileSync("content/drafts/batch-02/D01-T03-oxygen-therapy.md", "utf8");
    expect(text).toContain("S-ATS-NIRS-2026");
    expect(text).toContain("does not exclude inadequate ventilation");
    expect(text).toContain("do not let a reassuring saturation delay urgent assessment");
    expect(text).toContain("clinically_reviewed: false");
  });
  it("keeps higher PEEP population-specific and preserves sedation exceptions", () => {
    const vent = readFileSync("content/drafts/batch-02/D01-T07-ventilator-parameters.md", "utf8");
    const wean = readFileSync("content/drafts/batch-07/D01-T17-weaning-sbt-extubation-readiness.md", "utf8");
    expect(vent).toContain("Higher PEEP is not automatically appropriate for each patient");
    expect(vent).toContain("did not endorse routine recruitment manoeuvres as standard care");
    expect(wean).toContain("do not interrupt necessary sedation merely to meet a daily checklist");
    for (const text of [vent, wean]) {
      expect(text).toContain("S-SAUDI-MV-2026");
      expect(text).toContain("clinically_reviewed: false");
    }
  });
});
