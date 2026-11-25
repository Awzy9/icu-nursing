import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("Pressure injury and ICU recovery reconciliation", () => {
  const p = readFileSync("content/drafts/batch-01/D07-T04-pressure-injury.md", "utf8");
  const s = readFileSync("content/drafts/batch-06/D02-T09-septic-shock-nursing-care.md", "utf8");
  const m = readFileSync("content/drafts/mcq-expansion/XQ-06-mobilization.md", "utf8");
  it("distinguishes mucosal injuries and preserves safe device care", () => {
    expect(p).toContain("Do not assign a skin pressure injury stage to a mucosal injury");
    expect(p).toContain("absence of redness does not exclude tissue damage");
    expect(p).toContain("rather than guessing a stage");
  });
  it("individualizes recovery and mobilization", () => {
    expect(s).toContain("insufficient evidence to favor early over routine post-hospital follow-up");
    expect(s).toContain("active shock and worsening perfusion take priority");
    expect(m).toContain("Defer the planned active mobilization");
    for (const draft of [p, s, m]) expect(draft).toContain("clinically_reviewed: false");
  });
});
