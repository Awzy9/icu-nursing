import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("targeted scenario reconciliation 2", () => {
  it("SC-06-accidental-extubation preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-06-accidental-extubation.json", "utf8"));
    expect(d.steps[2].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("Sustained exhaled carbon dioxide"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-07-raised-intracranial-pressure preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-07-raised-intracranial-pressure.json", "utf8"));
    expect(d.steps[2].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("osmolar gap over"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-08-acute-seizure preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-08-acute-seizure.json", "utf8"));
    expect(d.steps[2].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("time-sensitive repeat benzodiazepine"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-09-postoperative-bleeding preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-09-postoperative-bleeding.json", "utf8"));
    expect(d.steps[2].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("hypocalcaemia and hyperkalaemia"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
  it("SC-10-hypoglycemia preserves targeted clinical safety and draft boundaries", () => {
    const d = JSON.parse(readFileSync("content/drafts/scenarios/SC-10-hypoglycemia.json", "utf8"));
    expect(d.steps[2].options.some((o: { feedback: string; points: number }) => o.points === 2 && o.feedback.includes("confirmatory point-of-care"))).toBe(true);
    expect(d.status).toBe("DRAFT");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.fictional_patient).toBe(true);
  });
});
