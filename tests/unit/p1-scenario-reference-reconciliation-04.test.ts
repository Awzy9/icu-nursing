import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("targeted scenario reconciliation 4", () => {
  it("SC-16-acute-hypotension preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-16-acute-hypotension.json", "utf8"));
    expect(d.steps[0].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("transducer reference level"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-17-delirium-and-agitation preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-17-delirium-and-agitation.json", "utf8"));
    expect(d.steps[0].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("not assessable"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-18-aspiration-event preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-18-aspiration-event.json", "utf8"));
    expect(d.steps[1].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("trial flush"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-19-anaphylaxis preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-19-anaphylaxis.json", "utf8"));
    expect(d.steps[1].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("repeating IM adrenaline"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-20-acute-neurological-deterioration preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-20-acute-neurological-deterioration.json", "utf8"));
    expect(d.steps[0].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("non-testable"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("does not require a misleading GCS total in the debrief", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-20-acute-neurological-deterioration.json", "utf8"));
    expect(d.debrief.learning_points.join(" ")).toContain("non-testable");
    expect(d.debrief.learning_points.join(" ")).toContain("omit a misleading total");
  });
});
