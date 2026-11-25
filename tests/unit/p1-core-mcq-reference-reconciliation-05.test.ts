import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";
const cases = [{"path":"content/drafts/batch-05/D03-T09-sedation-monitoring.md","needle":"Do not assume sedation is the only cause","keys":"ABCDBA"},{"path":"content/drafts/batch-05/D07-T01-head-to-toe-assessment.md","needle":"last known well","keys":"ADBCCB"},{"path":"content/drafts/batch-05/D07-T03-pain-assessment.md","needle":"absence of observable pain behavior does not establish absence of pain","keys":"CACBDA"},{"path":"content/drafts/batch-05/D09-T03-scope-of-practice.md","needle":"Missing documentation is not automatic proof of negligence","keys":"CADBBC"}];
describe("core topic MCQ reconciliation batch 05", () => {
  for (const c of cases) it(c.path, () => {
    const d = readFileSync(c.path, "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect(validateDraft(d)).toEqual([]);
    const mcqs = d.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect([...mcqs.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
