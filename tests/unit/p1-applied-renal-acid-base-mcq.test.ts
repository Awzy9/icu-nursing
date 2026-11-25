import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseMcqs, validateDraft } from "@/lib/draft-validator";
describe("Applied renal and acid-base reasoning", () => {
  const paths = ["content/drafts/batch-02/D04-T02-aki.md","content/drafts/batch-03/D04-T03-urine-output-fluid-balance.md","content/drafts/batch-07/D04-T06-potassium-disorders.md","content/drafts/batch-07/D04-T08-acid-base-abg-interpretation.md","content/drafts/batch-07/D04-T09-crrt-principles-partial.md"];
  const keys = ["DADBCC","CADBBC","CADBCA","DBCABD","BDACCB"];
  const needles = [["Diuresis is not proof of renal recovery"],["fluid responsiveness does not necessarily establish that additional fluid is needed or safe"],["rapid rise is anticipated","late hypoglycaemia and potassium rebound"],["approximately 26 ± 2 mm Hg","additional respiratory acidosis"],["possible citrate accumulation","No single finding establishes accumulation"]];
  paths.forEach((path, i) => it(path, () => {
    const text = readFileSync(path, "utf8");
    expect(validateDraft(text)).toEqual([]);
    expect(text).toContain("clinically_reviewed: false");
    const questions = text.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect(parseMcqs(text).map(q => q.answer).join("")).toBe(keys[i]);
    for (const needle of needles[i]!) expect(questions).toContain(needle);
  }));
});
