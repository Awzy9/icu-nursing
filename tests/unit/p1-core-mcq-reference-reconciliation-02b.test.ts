import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [{"name":"D02-T15-defibrillation-safety","needle":"Resume chest compressions immediately after the shock","keys":"BDCACA"},{"name":"D03-T10-delirium","needle":"Record an unassessable screen as such","keys":"DBADBA"},{"name":"D04-T02-aki","needle":"not yet met the NICE adult duration criterion","keys":"DADBCC"},{"name":"D06-T07-vae-prevention","needle":"do not delay assessment to complete the prevention bundle","keys":"BDACDA"},{"name":"D07-T06-enteral-feeding","needle":"unexpected feed interruption as a hypoglycemia risk","keys":"ADBACB"}];
describe("core topic MCQ reconciliation batch 02b", () => {
  for (const c of cases) it(c.name, () => {
    const d = readFileSync("content/drafts/batch-02/" + c.name + ".md", "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect([...d.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
