import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";
describe("Applied neurological and sedation reasoning", () => {
  const paths = ["content/drafts/batch-03/D03-T01-glasgow-coma-scale.md","content/drafts/batch-08/D03-T03-icp-cpp-monitoring-severe-tbi.md","content/drafts/batch-05/D03-T09-sedation-monitoring.md","content/drafts/batch-02/D03-T10-delirium.md"];
  const keys = ["ACDBCD","DBACCA","ABCDBA","DBADBA"];
  const needles = [["An unchanged total can conceal","Do not assign a false low score or total"],["82 minus 24 gives 58 mm Hg","not an instruction to lower a spontaneously higher CPP"],["Unexpected interruption of sedation during paralysis","not consciousness"],["delirium superimposed on dementia","A positive screen does not itself establish a diagnosis"]];
  paths.forEach((path, i) => it(path, () => {
    const text = readFileSync(path, "utf8");
    expect(validateDraft(text)).toEqual([]);
    expect(text).toContain("clinically_reviewed: false");
    const questions = text.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect([...questions.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(keys[i]);
    for (const needle of needles[i]!) expect(questions).toContain(needle);
  }));
});
