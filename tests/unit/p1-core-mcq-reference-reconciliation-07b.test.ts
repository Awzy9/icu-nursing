import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";
const cases = [{"path":"content/drafts/batch-07/D04-T09-crrt-principles-partial.md","needle":"regional citrate alone is not adequate","keys":"BDACCB"},{"path":"content/drafts/batch-07/D05-T01-sedatives-partial.md","needle":"Dexmedetomidine may cause clinically important bradycardia","keys":"ADACBD"},{"path":"content/drafts/batch-07/D05-T03-vasopressor-pharmacology-partial.md","needle":"Continuous cardiac output measurement is not required in every patient","keys":"ACDBCA"}];
describe("core topic MCQ reconciliation batch 07b", () => {
  for (const c of cases) it(c.path, () => {
    const d = readFileSync(c.path, "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect(validateDraft(d)).toEqual([]);
    const mcqs = d.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect([...mcqs.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
