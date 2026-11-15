import { describe, expect, it } from "vitest";
import { loadKnownSources, loadSkillDrafts } from "../../scripts/validate-skill-drafts";
import { MASTER_SKILLS, validateSkillDraft, validateSkillSet, type SkillDraft } from "@/lib/skill-draft-validator";

const known = loadKnownSources();
const drafts = loadSkillDrafts();
const clone = (d: SkillDraft): SkillDraft => JSON.parse(JSON.stringify(d));
const rules = (d: SkillDraft) => validateSkillDraft(d, known).map((i) => i.rule);

describe("the 25 clinical skill drafts", () => {
  it("cover exactly the original master list, once each, and pass every rule", () => {
    expect(drafts).toHaveLength(25);
    expect(validateSkillSet(drafts)).toEqual([]);
    for (const d of drafts) expect(validateSkillDraft(d, known), d.skill_id).toEqual([]);
    expect(MASTER_SKILLS).toHaveLength(25);
  });
  it("are all unreviewed drafts with no claim of review, approval, validation or competency", () => {
    for (const d of drafts) {
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.clinical_reviewers).toEqual([]);
      expect(["partial", "unsupported"]).toContain(d.evidence_status);
      expect(["original", "cleared"]).not.toContain(d.license_status);
    }
  });
  it("declare gaps and permission notes, and never write bedside steps for skills without sources", () => {
    for (const d of drafts) { expect(d.gaps.length, d.skill_id).toBeGreaterThan(0); expect(d.permissions.length, d.skill_id).toBeGreaterThan(0); }
    for (const n of [5, 13, 16, 20]) {
      const d = drafts.find((x) => x.number === n)!;
      expect(d.evidence_status).toBe("unsupported");
      expect(d.checklist.every((c) => c.support === "local_protocol"), d.skill_id).toBe(true);
    }
  });
  it("every skill in the database import shape fits the schema limits", () => {
    for (const d of drafts) {
      expect(d.title.length).toBeLessThanOrEqual(200);
      expect(d.checklist.length).toBeLessThanOrEqual(60);
      for (const c of d.checklist) expect(c.text.length).toBeLessThanOrEqual(400);
    }
  });
});

describe("the validator rejects", () => {
  const base = drafts.find((d) => d.number === 1)!;
  it("review, approval and status claims", () => {
    const a = clone(base); a.status = "approved"; expect(rules(a)).toContain("status");
    const b = clone(base); b.clinically_reviewed = true; expect(rules(b)).toContain("review");
    const c = clone(base); c.clinical_reviewers = ["someone"]; expect(rules(c)).toContain("review");
    const d = clone(base); d.banner = "Reviewed"; expect(rules(d)).toContain("banner");
  });
  it("supported evidence and cleared licences on a draft", () => {
    const a = clone(base); a.evidence_status = "supported"; expect(rules(a)).toContain("evidence");
    const b = clone(base); b.license_status = "cleared"; expect(rules(b)).toContain("licence");
  });
  it("a sourced statement without a full-text source, an unknown source, and an unlisted citation", () => {
    const a = clone(base); a.sections.indications!.items[0]!.sources = []; expect(rules(a)).toContain("sourced");
    const b = clone(base); b.sources[0]!.id = "S-NOPE"; expect(rules(b)).toContain("source");
    const c = clone(base); c.checklist[0]!.support = "sourced"; c.checklist[0]!.sources = ["S-SSC-2026"]; expect(rules(c)).toContain("sourced"); // partially read
  });
  it("'full' sections containing unsourced or partial statements", () => {
    const a = clone(base); a.sections.safety!.items[0]!.support = "partial"; expect(rules(a)).toContain("support");
  });
  it("dose or rate content, competence verdicts and invented local steps", () => {
    const a = clone(base); a.sections.safety!.items[0]!.text = "Give 5 mcg/kg/min"; expect(rules(a)).toContain("dosing");
    const b = clone(base); b.checklist[0]!.text = "You are competent if all are ticked."; expect(rules(b)).toContain("verdict");
    const c = clone(base); c.sections.procedure!.items[0]!.text = "Insert the needle at 30 degrees and advance."; expect(rules(c)).toContain("local");
    const d = clone(base); d.sections.safety!.items[0]!.text = "Approved by the clinical lead."; expect(rules(d)).toContain("review");
  });
  it("a missing or off-scope skill", () => {
    const a = clone(base); a.title = "Tea making"; expect(rules(a)).toContain("scope");
    expect(validateSkillSet(drafts.slice(1))).not.toEqual([]);
    const b = clone(base); b.gaps = []; expect(rules(b)).toContain("gaps");
  });
});
