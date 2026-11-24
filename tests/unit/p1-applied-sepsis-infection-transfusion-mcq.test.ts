import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";
describe("Applied sepsis infection and transfusion reasoning", () => {
  const paths = ["content/drafts/batch-01/D06-T01-sepsis.md","content/drafts/batch-01/D06-T05-clabsi.md","content/drafts/batch-02/D06-T07-vae-prevention.md","content/drafts/batch-06/D08-T03-blood-product-administration-reactions.md","content/drafts/batch-08/D08-T02-coagulation-tests-inr-aptt-fibrinogen.md"];
  const keys = ["DACBDC","BDACBC","BDACDA","BDACBC","BDABCD"];
  const needles = [["A low qSOFA does not exclude serious illness","Do not independently select or omit an agent"],["WHO 2026 recommends at least daily","authorized local pathway"],["not equivalent to a clinical diagnosis of VAP","do not delay clinical evaluation"],["maintain IV access without flushing the suspect line","suspected TACO or TRALI is not a reason to restart"],["four-factor PCC plus vitamin K","repeat testing must not delay"]];
  paths.forEach((path, i) => it(path, () => {
    const text = readFileSync(path, "utf8");
    expect(validateDraft(text)).toEqual([]);
    expect(text).toContain("clinically_reviewed: false");
    const questions = text.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect([...questions.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(keys[i]);
    for (const needle of needles[i]!) expect(questions).toContain(needle);
  }));
});
