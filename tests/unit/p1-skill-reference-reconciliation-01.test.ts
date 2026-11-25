import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("targeted skills evidence reconciliation 1", () => {
  it("SK-01-arterial-line-care preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-01-arterial-line-care.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("transducer reference level"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-02-central-venous-catheter-care preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-02-central-venous-catheter-care.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("routine replacement solely"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-03-peripheral-iv-care preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-03-peripheral-iv-care.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("clinically indicated replacement policy"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-04-endotracheal-tube-care preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-04-endotracheal-tube-care.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("airway humidification"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
  it("SK-05-tracheostomy-care preserves targeted safety and draft status", () => {
    const d = JSON.parse(readFileSync("content/drafts/skills/SK-05-tracheostomy-care.json", "utf8"));
    expect(d.checklist.some((c: { text: string; critical: boolean }) => c.critical && c.text.includes("total laryngectomy"))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.status).toBe("DRAFT");
  });
});
