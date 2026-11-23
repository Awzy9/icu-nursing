import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildWorkingContent } from "../../scripts/build-working-content";

const transfusion = readFileSync("content/proposals/p1-14/TRANSFUSION_RESPIRATORY_DETERIORATION.md", "utf8");
const coag = readFileSync("content/proposals/p1-14/COAGULOPATHY_LIVER_TRAUMA_DIC.md", "utf8");
const variceal = readFileSync("content/proposals/p1-12/VARICEAL_BLEEDING_NURSING.md", "utf8");
const aclf = readFileSync("content/proposals/p1-13/ACLF_ENCEPHALOPATHY_MULTIORGAN_ESCALATION.md", "utf8");
const trauma = readFileSync("content/proposals/p1-13/TRAUMA_SHOCK_TRANSFUSION_NEUROTRAUMA.md", "utf8");
const transfusionCase = JSON.parse(readFileSync("content/drafts/scenarios/SC-14-transfusion-reaction.json", "utf8"));
const transfusionSkill = JSON.parse(readFileSync("content/drafts/skills/SK-09-blood-transfusion.json", "utf8"));
const coagTopic = readFileSync("content/drafts/batch-08/D08-T02-coagulation-tests-inr-aptt-fibrinogen.md", "utf8");

describe("P1 batch 14 — transfusion pulmonary and coagulopathy cross-syndrome safeguards", () => {
  it("keeps both new modules AI-authored, unpublished, and outside the learner working catalog", () => {
    for (const text of [transfusion, coag]) {
      expect(text).toMatch(/^proposal_id: P1-14-/m);
      expect(text).toMatch(/^content_stage: PROPOSAL_ONLY$/m);
      expect(text).toMatch(/^status: DRAFT$/m);
      expect(text).toMatch(/^origin: ai_generated$/m);
      expect(text).toMatch(/^clinically_reviewed: false$/m);
      expect(text).toMatch(/^published: false$/m);
      expect(text).toMatch(/UNPUBLISHED/i);
      expect(text).toMatch(/not clinically reviewed/i);
      expect(text).toMatch(/2026-11-23|23 November 2026/);
      expect(text).toMatch(/licen|rights|reuse/i);
    }
    const catalog = buildWorkingContent();
    const keys = new Set(catalog.map(e => e.key));
    expect(keys.has("P1-14-TRANSFUSION-LUNG")).toBe(false);
    expect(keys.has("P1-14-COAG-CONTEXT")).toBe(false);
    expect(catalog.some(e => e.title.includes("Respiratory deterioration during or after transfusion"))).toBe(false);
    expect(catalog.some(e => e.title.includes("Coagulation changes in cirrhosis, trauma and suspected DIC"))).toBe(false);
  });

  it("escalates respiratory deterioration; does not confuse diagnosis, timeline or bedside prescriptions", () => {
    expect(transfusion).toMatch(/TACO/);
    expect(transfusion).toMatch(/TRALI/);
    expect(transfusion).toMatch(/up to 12 hours/);
    expect(transfusion).toMatch(/within 6 hours/);
    expect(transfusion).toMatch(/Stop the \*\*implicated blood transfusion\*\* promptly/);
    expect(transfusion).toMatch(/without flushing the implicated transfusion set into the patient/);
    expect(transfusion).toMatch(/Do not restart the implicated unit/);
    expect(transfusion).toMatch(/none alone proves TACO/);
    expect(transfusion).toMatch(/Do not diagnose TRALI solely/);
    expect(transfusion).not.toMatch(/(?:furosemide|diuretic)\s+\d+\s*(?:mg|mcg)/i);
    const firstBest = transfusionCase.steps[0].options.find((o: { points: number }) => o.points === 2);
    expect(firstBest.text).toMatch(/Stop the transfusion immediately/);
    expect(firstBest.text).toMatch(/without pushing blood remaining/);
    const escalation = transfusionSkill.sections.escalation.items.map((x: { text: string }) => x.text).join("\n");
    expect(escalation).toMatch(/new administration set|new set|separate\/new administration set/);
    expect(escalation).toMatch(/do not flush remaining blood/);
    expect(transfusionCase.clinically_reviewed).toBe(false);
    expect(transfusionSkill.clinically_reviewed).toBe(false);
  });

  it("separates INR-in-cirrhosis from trauma coagulopathy and 2025 DIC without prescribing", () => {
    expect(coag).toMatch(/PT\/INR in cirrhosis is a poor stand-alone predictor/);
    expect(coag).toMatch(/prophylactic plasma/);
    expect(coag).toMatch(/does not mean clinicians never administer blood products for active severe bleeding/);
    expect(coag).toMatch(/trauma-associated coagulopathy/);
    expect(coag).toMatch(/2025 ISTH SSC/);
    expect(coag).toMatch(/Do not calculate a historical score/);
    expect(coag).toMatch(/do not initiate reversal or product selection independently/);
    expect(coagTopic).toMatch(/2025 ISTH SSC framework updated disease-aware DIC definitions/);
    expect(coagTopic).toMatch(/clinically_reviewed: false/);
    expect(coag).not.toMatch(/(?:plasma|TXA|calcium)\s+\d+\s*(?:units|g|mg|mcg|mL)/i);
  });

  it("keeps variceal, ACLF and trauma parent modules consistent with the new safety proposals", () => {
    expect(variceal).toMatch(/p1-14\\/COAGULOPATHY_LIVER_TRAUMA_DIC\.md/);
    expect(aclf).toMatch(/p1-14\\/COAGULOPATHY_LIVER_TRAUMA_DIC\.md/);
    expect(trauma).toMatch(/p1-14\\/TRANSFUSION_RESPIRATORY_DETERIORATION\.md/);
    expect(variceal).toMatch(/active haemorrhage still needs team-directed emergency resuscitation/);
    expect(aclf).toMatch(/Do not ignore active bleeding/);
    expect(trauma).toMatch(/TACO and TRALI can look similar initially/);
  });
});
