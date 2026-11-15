import { describe, expect, it } from "vitest";
import { loadMedicationDrafts, loadMedicationLabels, loadMedicationPlan } from "../../scripts/validate-medication-drafts";
import { validateMedicationDraft, validateMedicationSet, type MedicationDraft } from "@/lib/medication-draft-validator";

const plan = loadMedicationPlan();
const known = new Set([...loadMedicationLabels(), "S-FDA-PUMP", "S-AHRQ-TS"]);
const drafts = loadMedicationDrafts();
const clone = (d: MedicationDraft): MedicationDraft => JSON.parse(JSON.stringify(d));
const rules = (d: MedicationDraft) => validateMedicationDraft(d, known, plan).map((i) => i.rule);

describe("the 50-medication plan and the drafted batches", () => {
  it("plans exactly 50 medications and covers the master list's named drugs first", () => {
    expect(plan.size).toBe(50);
    const names = [...plan.values()].slice(0, 21).map((p) => p.name);
    for (const n of ["Norepinephrine", "Epinephrine", "Vasopressin", "Dobutamine", "Milrinone", "Propofol", "Midazolam", "Dexmedetomidine", "Fentanyl", "Morphine", "Ketamine", "Rocuronium", "Cisatracurium", "Heparin", "Insulin", "Amiodarone", "Adenosine", "Magnesium sulfate", "Potassium chloride", "Calcium gluconate", "Sodium bicarbonate"]) expect(names).toContain(n);
    expect(Math.max(...[...plan.values()].map((p) => p.batch))).toBe(5);
  });
  it("every drafted batch passes every rule (10 medications per batch)", () => {
    expect(drafts.length % 10).toBe(0);
    expect(drafts.length).toBe(50);
    expect(validateMedicationSet(drafts, plan)).toEqual([]);
    for (const d of drafts) expect(validateMedicationDraft(d, known, plan), d.med_id).toEqual([]);
  });
  it("every draft is unreviewed (clinically and by a pharmacist), has a regulator label, a jurisdiction limit and declared gaps", () => {
    for (const d of drafts) {
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
      expect(d.label_source).toBe("FDA");
      expect(d.jurisdiction_note).toMatch(/only/i);
      expect(d.gaps.length).toBeGreaterThan(0);
      expect(d.sections.institution_dosing!.items.every((i) => i.support === "local_protocol")).toBe(true);
    }
  });
  it("no draft contains any dose, concentration, rate, titration or compatibility content", () => {
    for (const d of drafts) {
      const text = JSON.stringify({ ...d, gaps: undefined, permissions: undefined, high_alert_note: undefined });
      expect(text, d.med_id).not.toMatch(/\b\d+([.,]\d+)?\s*(mcg|µg|mg|g|kg|units?|meq|mmol|ml|dl)\b/i);
      expect(text, d.med_id).not.toMatch(/titrat|y-site|compatib|dilut|reconstitut|infusion rate/i);
    }
  });
});

describe("the medication draft validator rejects", () => {
  const base = drafts[0]!;
  it("review claims, including a pharmacist review (the workflow is inactive)", () => {
    const a = clone(base); a.pharmacist_reviewed = true; expect(rules(a)).toContain("review");
    const b = clone(base); b.clinically_reviewed = true; expect(rules(b)).toContain("review");
    const c = clone(base); b.status = "approved"; expect(rules(b)).toContain("status"); expect(rules(c)).toEqual([]);
    const d = clone(base); d.banner = "Reviewed"; expect(rules(d)).toContain("banner");
  });
  it("a missing statement that the evidence is a label and not a nursing guideline", () => {
    const a = clone(base); a.evidence_type_note = ""; expect(rules(a)).toContain("evidence_type");
  });
  it("dosing content in any text field", () => {
    const a = clone(base); a.sections.safety_alerts!.items[0]!.text = "Run at 2 mcg/kg/min"; expect(rules(a)).toContain("dosing");
    const b = clone(base); b.summary = "Dilute before use"; expect(rules(b)).toContain("dosing");
    const c = clone(base); c.monitoring[0]!.text = "Titrate to a 65 mmHg target"; expect(rules(c)).toContain("dosing");
  });
  it("a missing or unreadable label, a missing jurisdiction note and a missing institution referral", () => {
    const a = clone(base); a.label_ref = "L-NOPE"; expect(rules(a)).toContain("label");
    const b = clone(base); b.jurisdiction_note = ""; expect(rules(b)).toContain("jurisdiction");
    const c = clone(base); delete (c.sections as Record<string, unknown>).institution_dosing; expect(rules(c)).toContain("section");
    const d = clone(base); d.sections.institution_dosing!.items[0]!.text = "Use the label's usual adult dose."; expect(rules(d)).toContain("institution");
  });
  it("supported evidence, cleared licensing, unsourced statements and oversized batches", () => {
    const a = clone(base); a.evidence_status = "supported"; expect(rules(a)).toContain("evidence");
    const b = clone(base); b.license_status = "cleared"; expect(rules(b)).toContain("licence");
    const c = clone(base); c.sections.safety_alerts!.items[0]!.sources = []; expect(rules(c)).toContain("sourced");
    const many = Array.from({ length: 11 }, () => clone(base)).map((d, i) => ({ ...d, number: i + 1 }));
    expect(validateMedicationSet(many, plan).map((i) => i.rule)).toContain("batch");
  });
});
