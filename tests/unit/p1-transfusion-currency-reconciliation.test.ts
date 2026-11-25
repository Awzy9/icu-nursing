import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const read = (path: string) => readFileSync(path, "utf8");
describe("targeted transfusion safety reconciliation", () => {
  it("retains draft status and explains pulmonary recognition windows and urgent anaphylaxis response", () => {
    const t = read("content/drafts/batch-06/D08-T03-blood-product-administration-reactions.md");
    expect(t).toContain("clinically_reviewed: false");
    expect(t).toContain("up to 12 hours");
    expect(t).toContain("within six hours");
    expect(t).toContain("TRALI type II");
    expect(t).toContain("intramuscular adrenaline");
    expect(t).toContain("Do not independently continue or restart a suspect component");
    expect(t).toContain("18 November 2026");
  });
  it("keeps escalation and review safeguards in the skill and both scenarios", () => {
    for (const path of ["content/drafts/skills/SK-09-blood-transfusion.json", "content/drafts/scenarios/SC-09-postoperative-bleeding.json", "content/drafts/scenarios/SC-14-transfusion-reaction.json"]) {
      const d = JSON.parse(read(path));
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.sources.some((s: { id: string; read: string }) => s.id === "S-BSH-ATR" && s.read === "partial")).toBe(true);
      expect(JSON.stringify(d)).toMatch(/restart/i);
    }
    const s = JSON.parse(read("content/drafts/skills/SK-09-blood-transfusion.json"));
    expect(s.checklist.some((c: { critical: boolean; text: string }) => c.critical && c.text.includes("active major haemorrhage"))).toBe(true);
    expect(JSON.stringify(s)).toContain("Do not give a diuretic reflexively");
  });
});
