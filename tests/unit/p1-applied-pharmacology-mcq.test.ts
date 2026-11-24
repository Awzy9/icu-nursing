import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";
import { validateMcqSet } from "@/lib/mcq-expansion-validator";
import { loadKnown } from "../../scripts/validate-mcq-expansion";
const paths = ["content/drafts/batch-07/D05-T01-sedatives-partial.md","content/drafts/batch-07/D05-T03-vasopressor-pharmacology-partial.md","content/drafts/mcq-expansion/XQ-08-vasoactive-safety.md","content/drafts/mcq-expansion/XQ-09-sedative-opioid-safety.md"];
const keys = ["ADACBD","ACDBCA","BADCBA","ADCBAD"];
const known = loadKnown();
const needles = [["Dexmedetomidine may cause clinically important bradycardia"],["Continuous cardiac output measurement is not required in every patient"],["reversible diabetes insipidus after cessation","renal impairment prolongs its elimination"],["satisfactory saturation on supplemental oxygen does not establish adequate ventilation","effect of opioid reversal may end before the effect of morphine"]];
describe("Applied pharmacology reasoning", () => {
 paths.forEach((path,i) => it(path, () => {
  const text = readFileSync(path,"utf8");
  expect(i<2?validateDraft(text):validateMcqSet(text,known)).toEqual([]);
  expect([...text.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m=>m[1]).join("")).toBe(keys[i]);
  expect(text).toContain("clinically_reviewed: false");
  for(const needle of needles[i]!) expect(text).toContain(needle);
 }));
});
