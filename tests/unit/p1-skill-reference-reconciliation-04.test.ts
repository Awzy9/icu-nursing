import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("targeted skills evidence reconciliation 4", () => {
  it("SK-16-safe-patient-mobilization preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-16-safe-patient-mobilization.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("TEAM trial"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-17-crrt-circuit-monitoring preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-17-crrt-circuit-monitoring.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("total-to-ionized calcium ratio"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-18-ecg-monitoring preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-18-ecg-monitoring.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("ST-segment or QT"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-19-defibrillator-safety preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-19-defibrillator-safety.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("ventilator exhaust"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-20-patient-transport preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-20-patient-transport.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("invasive or non-invasive ventilation"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
});
