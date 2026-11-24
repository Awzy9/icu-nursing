import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";
const cases = [{"path":"content/drafts/batch-07/D01-T17-weaning-sbt-extubation-readiness.md","needle":"not a reason to withhold emergency oxygen","keys":"BDACBA"},{"path":"content/drafts/batch-07/D02-T02-ecg-fundamentals-rhythm-recognition.md","needle":"initiate CPR if circulation is absent or uncertain","keys":"ACBDAC"},{"path":"content/drafts/batch-07/D04-T06-potassium-disorders.md","needle":"stabilizes the cardiac membrane but does not lower potassium","keys":"CADBCA"},{"path":"content/drafts/batch-07/D04-T08-acid-base-abg-interpretation.md","needle":"pH 7.26, PaCO₂ 58 mm Hg","keys":"DBCABD"}];
describe("core topic MCQ reconciliation batch 07a", () => {
  for (const c of cases) it(c.path, () => {
    const d = readFileSync(c.path, "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect(validateDraft(d)).toEqual([]);
    const mcqs = d.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect([...mcqs.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
