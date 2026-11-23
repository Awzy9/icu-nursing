import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildWorkingContent } from "../../scripts/build-working-content";

const root = "content/proposals/p1-11/";
const paths = [
  "GI_HAEMORRHAGE_NURSING.md",
  "ACUTE_LIVER_FAILURE_NURSING.md",
  "TRAUMA_HAEMORRHAGE_NURSING.md",
];
const [gi, liver, trauma] = paths.map((p) => readFileSync(root + p, "utf8"));

describe("P1 batch 11: separately gated high-risk expansion proposals", () => {
  it("retains explicit draft/author/review/publication status in every proposal", () => {
    for (const file of [gi, liver, trauma]) {
      expect(file).toMatch(/^content_stage: PROPOSAL_ONLY$/m);
      expect(file).toMatch(/^status: DRAFT$/m);
      expect(file).toMatch(/^clinically_reviewed: false$/m);
      expect(file).toMatch(/^published: false$/m);
      expect(file).toMatch(/UNPUBLISHED PROPOSAL/);
      expect(file).toMatch(/Publication gate/);
      expect(file).toMatch(/Fictional teaching case/);
      expect(file).toMatch(/Evidence ledger and limitations/);
    }
  });

  it("does not import these unreviewed extensions into the learner working edition", () => {
    const entries = buildWorkingContent();
    const bodies = entries.map((e) => e.body).join("\n");
    for (const id of ["P1-11-GI", "P1-11-LIVER", "P1-11-TRAUMA"]) {
      expect(entries.some((e) => e.key === id)).toBe(false);
      expect(bodies).not.toContain("proposal_id: " + id);
    }
    expect(entries.some((e) => /Acute gastrointestinal haemorrhage — ICU nursing recognition/.test(e.title))).toBe(false);
    expect(entries.some((e) => /Major trauma haemorrhage and evolving coagulopathy/.test(e.title))).toBe(false);
  });

  it("prioritises GI bleeding resuscitation and avoids conflating ulcer and variceal care", () => {
    expect(gi).toMatch(/wait for a repeat haemoglobin/);
    expect(gi).toMatch(/ESGE.*peptic-ulcer/);
    expect(gi).toMatch(/Variceal pathway is different/);
    expect(gi).toMatch(/SUP is prevention, not haemorrhage treatment/);
    expect(gi).toMatch(/2026 Saudi Critical Care Society/);
  });

  it("distinguishes ALF from ACLF and guards against single-value diagnosis or unsupervised interventions", () => {
    expect(liver).toMatch(/ALF.*ACLF/);
    expect(liver).toMatch(/Urgent.*transplant-centre|urgent transplant-centre referral/);
    expect(liver).toMatch(/Do not call all agitation or sleepiness/);
    expect(liver).toMatch(/ammonia result alone/);
    expect(liver).toMatch(/not routine nursing orders/);
  });

  it("escalates traumatic haemorrhage without unsafe universal neurotrauma or product protocols", () => {
    expect(trauma).toMatch(/summon trauma\/critical-care help/);
    expect(trauma).toMatch(/must not be translated into a blanket blood pressure target/);
    expect(trauma).toMatch(/No self-prescribed calcium, TXA, blood product ratio/);
    expect(trauma).toMatch(/Do not bypass safety checks/);
    expect(trauma).toMatch(/2025 German/);
  });
});
