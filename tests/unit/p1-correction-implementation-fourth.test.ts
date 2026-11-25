import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (file: string) => JSON.parse(readFileSync("content/drafts/" + file + ".json", "utf8"));
describe("P1 implementation: medication and bedside skill safety", () => {
  it("MD-18-magnesium-sulfate preserves safeguards and draft status", () => {
    const d = read("medications/MD-18-magnesium-sulfate");
    expect(JSON.stringify(d.sections.escalation.items[0])).toContain("emergency response");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-20-calcium-gluconate preserves safeguards and draft status", () => {
    const d = read("medications/MD-20-calcium-gluconate");
    expect(JSON.stringify(d.sections.escalation.items[0])).toContain("emergency response");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-42-atropine preserves safeguards and draft status", () => {
    const d = read("medications/MD-42-atropine");
    expect(JSON.stringify(d.monitoring)).toContain("mucus plugging");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-47-levetiracetam preserves safeguards and draft status", () => {
    const d = read("medications/MD-47-levetiracetam");
    expect(JSON.stringify(d.monitoring)).toContain("DRESS");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("SK-13-chest-drain-monitoring preserves safeguards and draft status", () => {
    const d = read("skills/SK-13-chest-drain-monitoring");
    expect(JSON.stringify(d.checklist)).toContain("fluid drain");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("SK-15-patient-repositioning preserves safeguards and draft status", () => {
    const d = read("skills/SK-15-patient-repositioning");
    expect(JSON.stringify(d.checklist)).toContain("smaller assisted position changes");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("SK-18-ecg-monitoring preserves safeguards and draft status", () => {
    const d = read("skills/SK-18-ecg-monitoring");
    expect(JSON.stringify(d.checklist)).toContain("diagnostic 12-lead ECG");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("SK-25-pain-assessment preserves safeguards and draft status", () => {
    const d = read("skills/SK-25-pain-assessment");
    expect(JSON.stringify(d.checklist)).toContain("behaviour unobservable");
    expect(d.clinically_reviewed).toBe(false);
  });
});
