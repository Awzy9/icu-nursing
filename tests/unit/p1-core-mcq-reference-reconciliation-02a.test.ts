import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [{"name":"D01-T03-oxygen-therapy","needle":"UK-ROX 2025 randomized","keys":"CADBDC"},{"name":"D01-T07-ventilator-parameters","needle":"spontaneous effort may confound plateau pressure","keys":"CBDABC"},{"name":"D01-T11-airway-suctioning","needle":"failure to recover requires immediate cessation","keys":"DACBCB"},{"name":"D02-T08-shock-recognition","needle":"dynamic predictors to static preload","keys":"CADBBA"},{"name":"D02-T14-cardiac-arrest-nursing","needle":"If there is no evidence of circulation or doubt remains","keys":"AADBBD"}];
describe("core topic MCQ reconciliation batch 02a", () => {
  for (const c of cases) it(c.name, () => {
    const d = readFileSync("content/drafts/batch-02/" + c.name + ".md", "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect([...d.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
