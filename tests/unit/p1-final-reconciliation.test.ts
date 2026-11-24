import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (p: string) => readFileSync(p, "utf8");
describe("P1 targeted audit reconciliation", () => {
  it("requires glucose assessment without delaying stroke escalation", () => {
    expect(read("content/drafts/batch-05/D07-T01-head-to-toe-assessment.md")).toContain("prompt point-of-care glucose measurement without delaying the stroke response");
  });
  it("distinguishes pressure targets from adequate perfusion", () => {
    expect(read("content/drafts/batch-02/D02-T14-cardiac-arrest-nursing.md")).toContain("not proof of adequate tissue perfusion");
  });
  it("retains the unresolved UKKA discrepancy after rechecking", () => {
    const t = read("content/drafts/batch-07/D04-T06-potassium-disorders.md");
    expect(t).toContain("Both versions were rechecked on 2026-11-24, and the discrepancy remains.");
    expect(t).toContain("the two are different assessments");
  });
  it("records the BTS correction without adding drain-size instructions", () => {
    const d = JSON.parse(read("content/drafts/skills/SK-13-chest-drain-monitoring.json"));
    expect(d.sources.find((s: { id: string }) => s.id === "N-BTS-PCS-2023").use).toContain("thorax-2022-219371corr1");
    expect(d.clinically_reviewed).toBe(false);
  });
});
