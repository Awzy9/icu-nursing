import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [{"name":"XQ-01-urinary-catheter","source":"S-SHEA-CAUTI-2022","needle":"ICU admission alone","keys":"ADCBAD"},{"name":"XQ-02-peripheral-iv","source":"S-WHO-PIVC-2024","needle":"clean nonsterile glove","keys":"DCBADC"},{"name":"XQ-03-central-line-care","source":"S-WHO-CVC-2026","needle":"against routine central catheter replacement","keys":"CBADCB"}];
describe("catheter MCQ reconciliation", () => {
  for (const c of cases) it(c.name, () => {
    const d = readFileSync("content/drafts/mcq-expansion/" + c.name + ".md", "utf8");
    expect(d).toContain(c.source);
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect([...d.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
