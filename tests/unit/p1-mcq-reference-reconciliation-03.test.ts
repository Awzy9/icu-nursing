import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [{"name":"XQ-07-crrt-alarms","needle":"Blood return is not automatic","keys":"CBADCB"},{"name":"XQ-08-vasoactive-safety","needle":"does not establish a universal dose","keys":"BADCBA"},{"name":"XQ-09-sedative-opioid-safety","needle":"does not make dexmedetomidine suitable for every patient","keys":"ADCBAD"}];
describe("CRRT and medication safety MCQ reconciliation", () => {
  for (const c of cases) it(c.name, () => {
    const d = readFileSync("content/drafts/mcq-expansion/" + c.name + ".md", "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect([...d.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
