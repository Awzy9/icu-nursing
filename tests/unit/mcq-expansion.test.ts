import { describe, expect, it } from "vitest";
import { loadExistingViews, loadExpansion, loadKnown } from "../../scripts/validate-mcq-expansion";
import { batchPositionIssues, parseMcqs } from "@/lib/draft-validator";
import { nearDuplicates, parseMcqViews, validateMcqSet } from "@/lib/mcq-expansion-validator";

const known = loadKnown();
const sets = loadExpansion();
const ok = sets[0]!.text;

describe("MCQ expansion drafts (unpublished)", () => {
  it("add at least 60 original questions, bringing the bank of drafts to at least 300", () => {
    const n = sets.reduce((a, s) => a + parseMcqs(s.text).length, 0);
    expect(n).toBeGreaterThanOrEqual(60);
    expect(n + loadExistingViews().length).toBeGreaterThanOrEqual(300);
  });
  it("every set passes the structure, quality, trace, dosing and review rules, and answer positions are balanced across the expansion", () => {
    for (const s of sets) expect(validateMcqSet(s.text, known), s.file).toEqual([]);
    expect(batchPositionIssues(sets.map((s) => s.text))).toEqual([]);
  });
  it("have no near-duplicates among themselves or against the 240 existing questions", () => {
    const views = sets.flatMap((s) => parseMcqViews(s.text, s.file.slice(0, 5)));
    expect(nearDuplicates(views, [...loadExistingViews(), ...views])).toEqual([]);
  });
  it("are all unreviewed drafts and none is importable content (the question bank only knows synthetic fixtures)", () => {
    for (const s of sets) { expect(s.text).toMatch(/^status: DRAFT$/m); expect(s.text).toMatch(/^clinically_reviewed: false$/m); }
  });
});

describe("the expansion validator rejects", () => {
  const rules = (t: string) => validateMcqSet(t, known).map((i) => i.rule);
  it("review claims, missing traces and unknown sources", () => {
    expect(rules(ok.replace("status: DRAFT", "status: approved"))).toContain("status");
    expect(rules(ok.replace("clinically_reviewed: false", "clinically_reviewed: true"))).toContain("review");
    expect(rules(ok.replace(/^\*\*Trace:\*\*.*$/m, ""))).toContain("trace");
    expect(rules(ok.replace(/(\*\*Trace:\*\* )[A-Za-z0-9-]+/, "$1S-NOT-REAL"))).toContain("trace");
  });
  it("rejects duplicated options and conflicting answer-key lines in expansions", () => {
    const duplicate = ok.replace(/^A\. (.+)$/m, "A. $1").replace(/(^A\. (.+)\r?\n)B\. .+$/m, "$1B. $2");
    expect(validateMcqSet(duplicate, known).some(i => i.message.includes("repeated answer option text"))).toBe(true);
    const conflicting = ok.replace(/^\*\*Answer: [A-D]\.\*\*$/m, "  it("dose content, weak distractors and an unbalanced answer key",\n**Answer: C.**");
    expect(validateMcqSet(conflicting, known).some(i => i.message.includes("multiple answer-key lines"))).toBe(true);
  });
  it("dose content, weak distractors and an unbalanced answer key", () => {
    expect(rules(ok.replace(/^\*\*Why correct:\*\* /m, "**Why correct:** Give 5 mcg/kg/min. "))).toContain("dosing");
    expect(rules(ok.replace(/^B\. .+$/m, "B. Do nothing at all."))).toContain("mcq-distractor");
    const allA = ok.replace(/\*\*Answer: [B-D]\.\*\*/g, "**Answer: A.**");
    expect(rules(allA)).toContain("mcq-position");
  });
});
