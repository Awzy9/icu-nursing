import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [{"name":"D01-T12-ett-care-cuff-pressure","needle":"Loss of capnography with desaturation and absent chest movement is a ventilation emergency","keys":"BDCADB"},{"name":"D03-T01-glasgow-coma-scale","needle":"against reporting a total score when any component is not testable","keys":"ACDBCD"},{"name":"D04-T03-urine-output-fluid-balance","needle":"Oliguria alone is not proof of hypovolaemia","keys":"CADBBC"}];
describe("core topic MCQ reconciliation batch 03", () => {
  for (const c of cases) it(c.name, () => {
    const d = readFileSync("content/drafts/batch-03/" + c.name + ".md", "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    const mcqs = d.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect([...mcqs.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
