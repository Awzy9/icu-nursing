import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("Sepsis and catheter stewardship reconciliation", () => {
  it("preserves time-critical antibiotic treatment and review", () => {
    const s = readFileSync("content/drafts/batch-01/D06-T01-sepsis.md", "utf8");
    const h = readFileSync("content/drafts/batch-06/D02-T09-septic-shock-nursing-care.md", "utf8");
    expect(s).toContain("A negative culture alone does not authorize stopping therapy");
    expect(h).toContain("avoid delays to the initial dose");
    expect(h).toContain("Do not independently convert");
  });
  it("maintains individualized catheter care and sepsis escalation", () => {
    const c = readFileSync("content/drafts/batch-01/D06-T05-clabsi.md", "utf8");
    const u = JSON.parse(readFileSync("content/drafts/skills/SK-12-urinary-catheter-care.json", "utf8"));
    expect(c).toContain("not a universal substitution order");
    expect(JSON.stringify(u)).toContain("stewardship is not a reason to delay indicated cultures or urgent treatment");
    expect(JSON.stringify(u)).toContain("trials often excluded people with indwelling catheters");
    expect(u.clinically_reviewed).toBe(false);
  });
  it("retains all review flags and existing case requirements", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-01-septic-shock.json", "utf8"));
    expect(d.clinically_reviewed).toBe(false);
    expect(d.required_sources).toHaveLength(4);
    for (const path of ["content/drafts/batch-01/D06-T01-sepsis.md","content/drafts/batch-06/D02-T09-septic-shock-nursing-care.md","content/drafts/batch-01/D06-T05-clabsi.md"]) expect(readFileSync(path,"utf8")).toContain("clinically_reviewed: false");
  });
});
