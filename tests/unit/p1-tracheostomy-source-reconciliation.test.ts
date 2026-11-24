import { describe, expect, it } from "vitest";
import { loadKnownSources, loadSkillDrafts } from "../../scripts/validate-skill-drafts";
import { validateSkillDraft } from "@/lib/skill-draft-validator";
const drafts = loadSkillDrafts();
describe("tracheostomy source reconciliation", () => {
  it("uses the current local guidance while keeping independent review open", () => {
    for (const id of ["SK-05", "SK-06"]) {
      const d = drafts.find(x => x.skill_id === id)!;
      expect(d.sources.map(s => s.id)).toContain("N-NHSGGC-TRACH-2025");
      expect(d.sources.map(s => s.id)).not.toContain("N-NHSGGC-TRACH-2022");
      expect(d.clinically_reviewed).toBe(false);
      expect(validateSkillDraft(d, loadKnownSources())).toEqual([]);
    }
  });
  it("retains critical obstruction and inflated-cuff speaking-valve safeguards", () => {
    const d = drafts.find(x => x.skill_id === "SK-05")!;
    expect(d.checklist.some(x => x.critical && x.text.includes("speaking valve") && x.text.includes("inflated cuff"))).toBe(true);
    expect(d.checklist.some(x => x.critical && x.text.includes("inability to pass a suction catheter"))).toBe(true);
  });
});
