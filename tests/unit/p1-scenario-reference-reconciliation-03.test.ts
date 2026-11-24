import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("targeted scenario reconciliation 3", () => {
  it("SC-11-severe-hyperkalemia preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-11-severe-hyperkalemia.json", "utf8"));
    expect(d.steps[1].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("does not lower potassium"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-12-acute-arrhythmia preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-12-acute-arrhythmia.json", "utf8"));
    expect(d.steps[1].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("verifies synchronization"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-13-cardiac-arrest preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-13-cardiac-arrest.json", "utf8"));
    expect(d.steps[2].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("immediately resume chest compressions"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-14-transfusion-reaction preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-14-transfusion-reaction.json", "utf8"));
    expect(d.steps[1].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("bacterial contamination or acute haemolysis"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-15-crrt-circuit-complication preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-15-crrt-circuit-complication.json", "utf8"));
    expect(d.steps[2].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("No single finding establishes the diagnosis"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("does not teach automatic CRRT blood return in the debrief", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-15-crrt-circuit-complication.json", "utf8"));
    expect(d.debrief.learning_points.join(" ")).toContain("blood return is not automatic");
    expect(d.debrief.learning_points.join(" ")).not.toContain("support, return blood");
  });
});
