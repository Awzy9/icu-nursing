import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("targeted scenario reconciliation 1", () => {
  it("SC-01-septic-shock preserves clinical safety and review boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-01-septic-shock.json", "utf8"));
    expect(d.steps[0].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("capillary refill assessment"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-02-cardiogenic-shock preserves clinical safety and review boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-02-cardiogenic-shock.json", "utf8"));
    expect(d.steps[2].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("laboratory markers of metabolic acidosis"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-03-acute-respiratory-deterioration preserves clinical safety and review boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-03-acute-respiratory-deterioration.json", "utf8"));
    expect(d.steps[0].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("not ventilation"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-04-ventilator-alarm preserves clinical safety and review boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-04-ventilator-alarm.json", "utf8"));
    expect(d.steps[2].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("absence of an alarm"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-05-sudden-oxygen-desaturation preserves clinical safety and review boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-05-sudden-oxygen-desaturation.json", "utf8"));
    expect(d.steps[0].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("pigmentation may affect"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("does not reward abandoning a patient who remains distressed", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-05-sudden-oxygen-desaturation.json", "utf8"));
    expect(d.steps[2].options.find((o: { text: string }) => o.text.startsWith("Step back")).points).toBe(0);
  });
});
