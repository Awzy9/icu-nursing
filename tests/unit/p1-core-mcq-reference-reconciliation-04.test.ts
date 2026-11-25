import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";
const cases = [{"path":"content/drafts/batch-04/D01-T19-respiratory-deterioration.md","needle":"hypercapnic respiratory failure confirmed on blood gas analysis","keys":"DDBCAB"},{"path":"content/drafts/batch-04/D02-T04-arterial-line.md","needle":"glucose-containing flush fluid can contaminate arterial samples","keys":"DACABB"},{"path":"content/drafts/batch-02/D04-T02-aki.md","needle":"sustained urine output below 0.5 mL/kg/h","keys":"DADBCC"}];
describe("core topic MCQ reconciliation batch 04", () => {
  for (const c of cases) it(c.path, () => {
    const d = readFileSync(c.path, "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect(validateDraft(d)).toEqual([]);
    const mcqs = d.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect([...mcqs.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
