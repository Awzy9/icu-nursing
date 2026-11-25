import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("targeted skills evidence reconciliation 5", () => {
  it("SK-21-infection-prevention preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-21-infection-prevention.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("never re-enter"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-22-infusion-pump-safety preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-22-infusion-pump-safety.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("trace the line from the patient"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-23-sedation-assessment preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-23-sedation-assessment.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("movement-based sedation scales"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-24-neurological-assessment preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-24-neurological-assessment.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("new unequal pupil"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-25-pain-assessment preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-25-pain-assessment.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("not interchangeable numeric scales"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
});
