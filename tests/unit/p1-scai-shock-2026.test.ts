import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("November 2026 cardiogenic shock update", () => {
  it("retains the distinction between pressure, perfusion and clinician-led staging", () => {
    const t = readFileSync("content/drafts/batch-02/D02-T08-shock-recognition.md", "utf8");
    expect(t).toContain("clinically_reviewed: false");
    expect(t).toContain("a preserved pressure does not exclude inadequate tissue perfusion");
    expect(t).toContain("A device or vasopressor requirement alone does not determine shock stage");
    expect(t).toContain("Formal staging and treatment decisions remain clinician-led");
  });
  it("preserves draft scenario and serial reassessment boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-02-cardiogenic-shock.json", "utf8"));
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
    expect(d.sources.some((s: { id: string; read: string }) => s.id === "S-SCAI-SHOCK-2026" && s.read === "partial")).toBe(true);
    expect(d.required_sources).toHaveLength(2);
    expect(JSON.stringify(d)).toContain("whether the patient is improving, unchanged or deteriorating");
  });
});
