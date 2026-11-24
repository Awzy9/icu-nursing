import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [{"name":"XQ-04-patient-transport","needle":"both invasive and non-invasive ventilation","keys":"BADCBA"},{"name":"XQ-05-chest-drain","needle":"do not apply this response to a bubbling pneumothorax drain","keys":"ADCBAD"},{"name":"XQ-06-mobilization","needle":"higher level of early active mobilization did not improve","keys":"DCBADC"}];
describe("transfer, drain and mobilization MCQ reconciliation", () => {
  for (const c of cases) it(c.name, () => {
    const d = readFileSync("content/drafts/mcq-expansion/" + c.name + ".md", "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect([...d.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
