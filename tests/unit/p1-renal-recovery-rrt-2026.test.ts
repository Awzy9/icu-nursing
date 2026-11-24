import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("2026 renal recovery and CRRT nursing reconciliation", () => {
  it("does not equate diuretic-associated urine with renal recovery", () => {
    for (const path of ["content/drafts/batch-02/D04-T02-aki.md", "content/drafts/batch-07/D04-T09-crrt-principles-partial.md"]) {
      const t = readFileSync(path, "utf8");
      expect(t).toContain("not proof of recovery or readiness to stop RRT");
      expect(t).toContain("clinically_reviewed: false");
    }
  });
  it("preserves trained-team mobility and pharmacy monitoring", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-17-crrt-circuit-monitoring.json", "utf8"));
    expect(d.clinically_reviewed).toBe(false);
    expect(JSON.stringify(d)).toContain("CRRT alone is not an automatic contraindication to early mobilization");
    expect(d.checklist.some((x: { critical: boolean; text: string }) => x.critical && x.text.includes("RRT interruptions and timed antibiotic levels"))).toBe(true);
  });
  it("retains urgent hyperkalaemia escalation and source-discrepancy safeguards", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-11-severe-hyperkalemia.json", "utf8"));
    expect(d.clinically_reviewed).toBe(false);
    expect(d.required_sources).toHaveLength(3);
    expect(JSON.stringify(d)).toContain("definitive removal plan");
    expect(JSON.stringify(d)).toContain("documented follow-up plan");
  });
});
