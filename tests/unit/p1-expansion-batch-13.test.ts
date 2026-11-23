import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildWorkingContent } from "../../scripts/build-working-content";

const dir = "content/proposals/p1-13/";
const aclf = readFileSync(dir + "ACLF_ENCEPHALOPATHY_MULTIORGAN_ESCALATION.md", "utf8");
const trauma = readFileSync(dir + "TRAUMA_SHOCK_TRANSFUSION_NEUROTRAUMA.md", "utf8");
const liverOverview = readFileSync("content/proposals/p1-11/ACUTE_LIVER_FAILURE_NURSING.md", "utf8");
const traumaOverview = readFileSync("content/proposals/p1-11/TRAUMA_HAEMORRHAGE_NURSING.md", "utf8");

describe("P1 batch 13 — ACLF and trauma high-risk teaching gates", () => {
  it("labels both expansions as unpublished, AI-authored and not clinically reviewed", () => {
    for (const source of [aclf, trauma]) {
      expect(source).toMatch(/^proposal_id: P1-13-/m);
      expect(source).toMatch(/^content_stage: PROPOSAL_ONLY$/m);
      expect(source).toMatch(/^status: DRAFT$/m);
      expect(source).toMatch(/^origin: ai_generated$/m);
      expect(source).toMatch(/^clinically_reviewed: false$/m);
      expect(source).toMatch(/^published: false$/m);
      expect(source).toMatch(/UNPUBLISHED PROPOSAL/);
      expect(source).toMatch(/fictional simulation|Fictional simulation/i);
      expect(source).toMatch(/review/i);
    }
  });

  it("excludes unapproved extension material from working learner content", () => {
    const entries = buildWorkingContent();
    const keys = new Set(entries.map(e => e.key));
    for (const key of ["P1-13-ACLF", "P1-13-TRAUMA"]) expect(keys.has(key)).toBe(false);
    expect(entries.some(e => e.title.includes("ACLF encephalopathy and multiorgan deterioration"))).toBe(false);
    expect(entries.some(e => e.title.includes("Trauma shock, transfusion physiology and possible TBI"))).toBe(false);
  });

  it("separates ALF from ACLF, observation from HE diagnosis and referral urgency", () => {
    expect(aclf).toMatch(/30 October 2026/);
    expect(aclf).toMatch(/acute encephalopathy/);
    expect(aclf).toMatch(/sepsis, stroke/);
    expect(aclf).toMatch(/ammonia result/);
    expect(aclf).toMatch(/ACLF should be considered for referral|ACLF.*should be considered for/);
    expect(aclf).toMatch(/urgent evaluation for all ALF patients/);
    expect(aclf).toMatch(/not part of the original 40-topic working edition/i);
    expect(liverOverview).toMatch(/October 30, 2026 global multisociety ACLF consensus/);
  });

  it("prevents universal permissive hypotension and independent trauma transfusion prescriptions", () => {
    expect(trauma).toMatch(/not universally appropriate with severe traumatic brain injury/);
    expect(trauma).toMatch(/no blood pressure or fluid target/);
    expect(trauma).toMatch(/ionised calcium/);
    expect(trauma).toMatch(/hypothermia/);
    expect(trauma).toMatch(/no independent calcium administration/i);
    expect(trauma).toMatch(/Do not bypass safety checks|identity, product/);
    expect(traumaOverview).toMatch(/exception.*permissive-hypotension/);
    expect(trauma).not.toMatch(/(?:calcium chloride|tranexamic acid|TXA)\s+\d+\s*(?:g|mg|mcg|mL)/i);
  });

  it("retains explicit source scope and required clinical sign-off", () => {
    for (const source of [aclf, trauma]) {
      expect(source).toMatch(/2026-11-23/);
      expect(source).toMatch(/source|evidence/i);
      expect(source).toMatch(/commercial|reuse/i);
      expect(source).toMatch(/clinical.*review|review.*clinical/i);
      expect(source).toMatch(/No clinical approval|not independently clinically reviewed/i);
    }
  });
});
