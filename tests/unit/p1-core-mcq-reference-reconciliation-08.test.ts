import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [{"name":"D01-T06-mechanical-ventilation-fundamentals-modes","keys":"BDACCD","needle":"pressure-targeted volume-adaptive modes"},{"name":"D01-T09-ventilator-alarms-nursing-response","keys":"CABDBC","needle":"confirm that prescribed support and alarm monitoring have resumed"},{"name":"D03-T03-icp-cpp-monitoring-severe-tbi","keys":"DBACCA","needle":"do not extrapolate this range"},{"name":"D08-T02-coagulation-tests-inr-aptt-fibrinogen","keys":"BDABCD","needle":"four-factor PCC plus vitamin K"}];
describe("Final core MCQ reference reconciliation", () => {
  for (const c of cases) it(c.name, () => {
    const d = readFileSync("content/drafts/batch-08/" + c.name + ".md", "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect([...d.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
