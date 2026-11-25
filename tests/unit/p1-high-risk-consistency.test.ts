import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateMedicationDraft } from "@/lib/medication-draft-validator";
import { loadMedicationLabels, loadMedicationPlan, loadGuidelineSources } from "../../scripts/validate-medication-drafts";
import { validateSkillDraft } from "@/lib/skill-draft-validator";
import { loadKnownSources } from "../../scripts/validate-skill-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";

const load = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const calcium = load("content/drafts/medications/MD-20-calcium-gluconate.json");
const pump = load("content/drafts/skills/SK-22-infusion-pump-safety.json");
const transfusion = load("content/drafts/scenarios/SC-14-transfusion-reaction.json");
const crrt = load("content/drafts/scenarios/SC-15-crrt-circuit-complication.json");
const allItems = (x: { sections: Record<string, { items?: {text:string}[] }> }) =>
  Object.values(x.sections).flatMap(s => s.items?.map(i => i.text) ?? []).join(" ");

describe("P1 batch 4 high-risk clinical scenario / medication consistency", () => {
  it("keeps calcium label limitations and critical co-administration warnings visible", () => {
    expect(calcium.clinically_reviewed).toBe(false);
    expect(calcium.pharmacist_reviewed).toBe(false);
    const s = allItems(calcium);
    expect(s).toMatch(/hypocalcaemia/);
    expect(s).toMatch(/hyperkalaemia/);
    expect(s).toMatch(/ceftriaxone/);
    expect(s).toMatch(/cardiac glycosides/);
    expect(s).toMatch(/affected line/);
    expect(calcium.sections.institution_dosing.support).toBe("local_protocol");
    expect(calcium.sections.institution_preparation.support).toBe("local_protocol");
    const known = new Set([...loadMedicationLabels(), ...loadGuidelineSources(), "S-FDA-PUMP", "S-AHRQ-TS"]);
    expect(validateMedicationDraft(calcium, known, loadMedicationPlan())).toEqual([]);
  });

  it("makes access-site injury different from pump hardware malfunction", () => {
    const s = allItems(pump);
    expect(s).toMatch(/functioning pump/);
    expect(s).toMatch(/compromised/);
    expect(s).toMatch(/alternative|alternate/i);
    expect(s).toMatch(/never directs bedside free-flow/);
    expect(pump.checklist.some((c: { phase: string; text: string }) =>
      c.phase === "escalation" && /compromised site/.test(c.text))).toBe(true);
    expect(validateSkillDraft(pump, loadKnownSources())).toEqual([]);
  });

  it("aligns transfusion scenario with initial reaction identification and blood-bank response", () => {
    expect(transfusion.clinically_reviewed).toBe(false);
    const best = transfusion.steps[0].options.find((o: {points: number}) => o.points === 2);
    expect(best.text).toMatch(/recheck patient\/component identity/);
    expect(best.text).toMatch(/blood bank/);
    expect(best.text).toMatch(/without pushing blood remaining/);
    expect(best.feedback).toMatch(/Maintaining venous access/);
    expect(best.sources).toContain("S-ISBT-ATR-EDU");
    expect(validateScenarioDraft(transfusion, loadScenarioKnownSources())).toEqual([]);
  });

  it("requires a trained CRRT operator for circuit troubleshooting and blood return", () => {
    expect(crrt.clinically_reviewed).toBe(false);
    const a = crrt.steps[0].options.find((o: {points: number}) => o.points === 2);
    const b = crrt.steps[1].options.find((o: {points: number}) => o.points === 2);
    expect(a.text).toMatch(/trained CRRT operator/);
    expect(a.text).toMatch(/do not reflexively clear alarms/);
    expect(b.text).toMatch(/Do not attempt blood return unless the trained operator confirms it is safe/);
    expect(b.text).toMatch(/local procedure/);
    expect(b.feedback).toMatch(/clotting or another circuit safety hazard/);
    expect(validateScenarioDraft(crrt, loadScenarioKnownSources())).toEqual([]);
  });

  it("preserves draft-only and no human reviewer claims", () => {
    for (const x of [calcium, pump, transfusion, crrt]) {
      expect(x.status).toBe("DRAFT");
      expect(x.clinically_reviewed).toBe(false);
      expect(x.clinical_reviewers).toEqual([]);
      expect(x.banner).toMatch(/NOT clinically reviewed/);
    }
  });
});
