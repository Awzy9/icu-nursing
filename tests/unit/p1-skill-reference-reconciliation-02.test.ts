import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("targeted skills evidence reconciliation 2", () => {
  it("SK-06-suctioning preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-06-suctioning.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("less than half"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-07-ventilator-safety-checks preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-07-ventilator-safety-checks.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("predicted body weight"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-08-oxygen-delivery-devices preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-08-oxygen-delivery-devices.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("skin pigmentation differences"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-09-blood-transfusion preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-09-blood-transfusion.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("Do not give a diuretic reflexively"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-10-enteral-feeding preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-10-enteral-feeding.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("uncontrolled shock"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
});
