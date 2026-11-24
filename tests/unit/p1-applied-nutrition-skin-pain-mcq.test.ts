import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";
describe("Applied nutrition skin and pain reasoning", () => {
  const paths = ["content/drafts/batch-02/D07-T06-enteral-feeding.md","content/drafts/batch-01/D07-T04-pressure-injury.md","content/drafts/batch-05/D07-T03-pain-assessment.md"];
  const keys = ["ADBACB","BDCADB","CACBDA"];
  const needles = [["refeeding hypophosphataemia","Withhold feed, water and medications","unexpected feed interruption"],["tolerated small weight shifts","Skin staging systems are not appropriate for mucosal pressure injuries"],["reliable patient self-report whenever feasible","absence of observable pain behavior does not establish absence of pain"]];
  paths.forEach((path, i) => it(path, () => {
    const text = readFileSync(path, "utf8");
    expect(validateDraft(text)).toEqual([]);
    expect(text).toContain("clinically_reviewed: false");
    const questions = text.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect([...questions.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(keys[i]);
    for (const needle of needles[i]!) expect(questions).toContain(needle);
  }));
});
