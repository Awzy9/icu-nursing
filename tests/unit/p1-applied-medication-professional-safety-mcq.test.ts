import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseMcqs, validateDraft } from "@/lib/draft-validator";
describe("Applied medication and professional safety reasoning", () => {
  const paths = ["content/drafts/batch-06/D05-T16-high-alert-medication-pump-safety.md","content/drafts/batch-01/D09-T02-documentation.md","content/drafts/batch-05/D09-T03-scope-of-practice.md"];
  const keys = ["CADBDA","CBDACD","CADBBC"];
  const needles = [["actual patient and product","potential severity of harm"],["An incident report does not replace clinical documentation","Immediate patient assessment and escalation"],["A resuscitation limitation does not by itself authorize","explicitly confirm task responsibility"]];
  paths.forEach((path, i) => it(path, () => {
    const text = readFileSync(path, "utf8");
    expect(validateDraft(text)).toEqual([]);
    expect(text).toContain("clinically_reviewed: false");
    const questions = text.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect(parseMcqs(text).map(q => q.answer).join("")).toBe(keys[i]);
    for (const needle of needles[i]!) expect(questions).toContain(needle);
  }));
});
