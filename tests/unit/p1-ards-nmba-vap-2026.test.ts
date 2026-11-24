import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("2026 ARDS and VAP evidence reconciliation", () => {
  it("preserves paralysis selection and sedation safeguards", () => {
    const v = readFileSync("content/drafts/batch-02/D01-T07-ventilator-parameters.md", "utf8");
    const s = readFileSync("content/drafts/batch-05/D03-T09-sedation-monitoring.md", "utf8");
    expect(v).toContain("Prone positioning alone does not require paralysis");
    expect(s).toContain("not permission to omit analgesia or sedation");
    expect(s).toContain("Do not undertake a routine awakening trial during active paralysis");
  });
  it("preserves cuff safety and prevents routine chlorhexidine or device substitution", () => {
    const p = readFileSync("content/drafts/batch-02/D06-T07-vae-prevention.md", "utf8");
    const e = readFileSync("content/drafts/batch-03/D01-T12-ett-care-cuff-pressure.md", "utf8");
    expect(p).toContain("discourages routine oral chlorhexidine");
    expect(p).toContain("without a clinician-led risk assessment");
    expect(e).toContain("rather than repeatedly adding air");
    expect(e).toContain("does not establish a universal check interval");
  });
  it("keeps all four lessons unreviewed", () => {
    for (const path of ["content/drafts/batch-02/D01-T07-ventilator-parameters.md","content/drafts/batch-05/D03-T09-sedation-monitoring.md","content/drafts/batch-02/D06-T07-vae-prevention.md","content/drafts/batch-03/D01-T12-ett-care-cuff-pressure.md"]) {
      expect(readFileSync(path, "utf8")).toContain("clinically_reviewed: false");
    }
  });
});
