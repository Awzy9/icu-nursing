import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [{"name":"D06-T01-sepsis","needle":"do not wait for a higher score","keys":"DACBDC"},{"name":"D06-T04-precautions","needle":"Staff respirator requirements during transport depend","keys":"DADBAA"},{"name":"D06-T05-clabsi","needle":"WHO 2026 recommends at least daily","keys":"BDACBC"},{"name":"D07-T04-pressure-injury","needle":"tolerated small weight shifts","keys":"BDCADB"},{"name":"D09-T01-sbar","needle":"receiver confirms the message","keys":"ACBDBC"},{"name":"D09-T02-documentation","needle":"never invent observations","keys":"CBDACD"}];
describe("core topic MCQ reconciliation batch 01", () => {
  for (const c of cases) it(c.name, () => {
    const d = readFileSync("content/drafts/batch-01/" + c.name + ".md", "utf8");
    expect(d).toContain(c.needle);
    expect(d).toContain("clinically_reviewed: false");
    expect([...d.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(c.keys);
  });
});
