import { describe, expect, it } from "vitest";
import { loadMedicationDrafts, loadMedicationLabels, loadGuidelineSources, loadMedicationPlan } from "../../scripts/validate-medication-drafts";
import { validateMedicationDraft } from "@/lib/medication-draft-validator";
const drafts = loadMedicationDrafts();
const get = (id: string) => drafts.find(d => d.med_id === id)!;
describe("Insulin and electrolyte medication evidence reconciliation", () => {
  it("preserves draft and no-dosing safeguards", () => {
    const known = new Set([...loadMedicationLabels(), ...loadGuidelineSources(), "S-FDA-PUMP", "S-AHRQ-TS"]);
    for (const id of ["MD-15", "MD-18", "MD-19", "MD-20", "MD-21"]) {
      const d = get(id);
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
      expect(validateMedicationDraft(d, known, loadMedicationPlan())).toEqual([]);
    }
  });
  it("links insulin nutrition and potassium emergencies separately", () => {
    expect(get("MD-15").sources.map(s=>s.id)).toContain("S-ADA-HOSP-2026");
    expect(get("MD-15").sources.map(s=>s.id)).not.toContain("N-JBDS-HYPO-2020");
    expect(get("MD-20").sections.general_pharmacology!.items.at(-1)!.text).toContain("does not remove potassium");
  });
  it("keeps bicarbonate evidence and restrictions explicit", () => {
    expect(get("MD-21").sources.map(s=>s.id)).toContain("S-BICARICU2-2025");
    expect(get("MD-21").sections.safety_alerts!.items.some(i=>i.text.includes("Routine bicarbonate is not recommended"))).toBe(true);
  });
});
