import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";
const cases = [{"path":"content/drafts/batch-06/D02-T09-septic-shock-nursing-care.md","needle":"Fluid responsiveness does not establish a need for fluid","keys":"DBCAAD"},{"path":"content/drafts/batch-06/D02-T12-vasopressor-inotrope-monitoring.md","needle":"For adults aged 65 or older with septic shock","keys":"ACBDCB"},{"path":"content/drafts/batch-06/D05-T16-high-alert-medication-pump-safety.md","needle":"Resolve disagreements before starting or changing the infusion","keys":"CADBDA"},{"path":"content/drafts/batch-06/D08-T03-blood-product-administration-reactions.md","needle":"maintaining IV access without flushing the suspect line","keys":"BDACBC"}];
describe("core topic MCQ reconciliation batch 06", () => {
  for (const c of cases) it(c.path, () => {
    const d = readFileSync(c.path, "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect(validateDraft(d)).toEqual([]);
    const mcqs = d.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect([...mcqs.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
