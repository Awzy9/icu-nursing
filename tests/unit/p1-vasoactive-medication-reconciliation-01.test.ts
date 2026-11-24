import { describe, expect, it } from "vitest";
import { loadMedicationDrafts, loadMedicationLabels, loadGuidelineSources, loadMedicationPlan } from "../../scripts/validate-medication-drafts";
import { validateMedicationDraft } from "@/lib/medication-draft-validator";
const drafts = loadMedicationDrafts();
const get = (id: string) => drafts.find(d => d.med_id === id)!;
describe("Vasoactive medication evidence reconciliation", () => {
  it("keeps every revised medication unapproved and within the no-dosing schema", () => {
    const known = new Set([...loadMedicationLabels(), ...loadGuidelineSources(), "S-FDA-PUMP", "S-AHRQ-TS"]);
    for (const id of ["MD-01", "MD-02", "MD-03", "MD-04", "MD-05", "MD-30"]) {
      const d = get(id);
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
      expect(validateMedicationDraft(d, known, loadMedicationPlan())).toEqual([]);
      expect(d.sources.some(s => s.id === "S-SSC-2026")).toBe(true);
    }
  });
  it("distinguishes epinephrine emergency pathways", () => {
    expect(get("MD-02").sections.administration_considerations!.items[0]!.sources).toContain("S-ADRENALIN-IM-2025");
    expect(get("MD-02").sections.safety_alerts!.items.at(-1)!.sources).toContain("S-RCUK-SPECIAL-2025");
  });
  it("retains uncertainty and acute-MI label caution for inotropes", () => {
    expect(get("MD-04").sources.some(s=>s.id==="S-DOREMI-2021")).toBe(true);
    expect(get("MD-05").sections.safety_alerts!.items.some(i=>i.text.includes("not recommended during acute myocardial infarction"))).toBe(true);
  });
});
