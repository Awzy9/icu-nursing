import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("targeted skills evidence reconciliation 3", () => {
  it("SK-11-nasogastric-tube-care preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-11-nasogastric-tube-care.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("not a trial flush"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-12-urinary-catheter-care preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-12-urinary-catheter-care.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("ICU admission alone"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-13-chest-drain-monitoring preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-13-chest-drain-monitoring.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("post-removal imaging"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-14-pressure-injury-prevention preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-14-pressure-injury-prevention.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("heel is clear"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-15-patient-repositioning preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-15-patient-repositioning.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("not a permanent replacement"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
});
