import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [{"name":"XQ-10-enteral-tube-position","needle":"Do not introduce water as a trial flush","keys":"DCBADC"},{"name":"XQ-11-scope-escalation","needle":"sensory or motor deficits","keys":"CBADCB"}];
describe("tube placement and escalation MCQ reconciliation", () => {
  for (const c of cases) it(c.name, () => {
    const d = readFileSync("content/drafts/mcq-expansion/" + c.name + ".md", "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect([...d.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
