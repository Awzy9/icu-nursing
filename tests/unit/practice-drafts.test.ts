import { describe, expect, it } from "vitest";
import { loadPracticeDrafts } from "../../scripts/validate-practice-drafts";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validatePracticeDraft, validatePracticeSet, type PracticeDraft } from "@/lib/practice-draft-validator";
import { practiceSchema } from "@icu/schemas/practice";

const known = loadScenarioKnownSources();
const drafts = loadPracticeDrafts();
const clone = (d: PracticeDraft): PracticeDraft => JSON.parse(JSON.stringify(d));
const rules = (d: PracticeDraft) => validatePracticeDraft(d, known).map((i) => i.rule);
const by = (k: string) => drafts.find((d) => d.kind === k)!;

describe("the 12 practical-education drafts", () => {
  it("cover every area once the set is complete, and all pass every rule", () => {
    expect(drafts.length).toBe(12);
    expect(validatePracticeSet(drafts)).toEqual([]);
    for (const d of drafts) expect(validatePracticeDraft(d, known), d.practice_id).toEqual([]);
  });
  it("are unreviewed, fictional, English-only drafts that claim nothing", () => {
    for (const d of drafts) { expect(d.status).toBe("DRAFT"); expect(d.clinically_reviewed).toBe(false); expect(d.fictional).toBe(true); expect(d.arabic_status).toBe("not_written"); expect(d.banner).toMatch(/never imported/); }
  });
  it("can never satisfy the learner-facing exercise schema (no SYN- code, not synthetic), so they cannot be served", () => {
    for (const d of drafts) expect(practiceSchema.safeParse({ ...d, code: d.practice_id, synthetic: false }).success).toBe(false);
  });
  it("competency exercises are self-assessment only", () => {
    for (const d of drafts.filter((x) => x.area === "competency")) expect(d.self_assessment_only).toBe(true);
  });
  it("rejects bad drafts", () => {
    const a = clone(by("classify")); a.clinically_reviewed = true; expect(rules(a)).toContain("review");
    const b = clone(by("classify")); b.items![0]!.sources = ["S-NOPE"]; expect(rules(b)).toContain("source");
    const c = clone(by("choice")); c.options![1]!.correct = true; expect(rules(c)).toContain("shape");
    const e = clone(by("spot")); e.lines![0]!.why = "Give 5 mg now"; expect(rules(e)).toContain("dosing");
    const f = clone(by("sequence")); f.steps![0]!.support = "sourced"; f.steps![0]!.sources = []; expect(rules(f)).toContain("sourced");
    const g = clone(drafts.find((d) => d.area === "competency")!); g.self_assessment_only = false; expect(rules(g)).toContain("competency");
    const h = clone(by("classify")); h.practice_id = "SYN-PX-001"; expect(rules(h)).toContain("id");
    const i = clone(drafts.find((d) => d.area === "competency")!); i.setup = "You are competent when you pass this."; expect(rules(i)).toContain("verdict");
    const j = clone(by("classify")); j.items![0]!.support = "sourced"; j.items![0]!.sources = ["S-AHRQ-TS"]; expect(rules(j)).toContain("sourced"); // partial-read source cannot back a 'sourced' claim
  });
});
