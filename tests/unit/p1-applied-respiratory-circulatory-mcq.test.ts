import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";
describe("Applied respiratory and circulatory reasoning", () => {
  const paths = ["content/drafts/batch-02/D01-T03-oxygen-therapy.md","content/drafts/batch-02/D02-T08-shock-recognition.md","content/drafts/batch-08/D01-T09-ventilator-alarms-nursing-response.md","content/drafts/batch-07/D02-T02-ecg-fundamentals-rhythm-recognition.md"];
  const keys = ["CADBDC","CADBBA","CABDBC","ACBDAC"];
  const needles = [["saturation alone does not establish adequate ventilation"],["Achieving a pressure target does not prove restoration of tissue perfusion","Do not administer additional fluid merely to normalize lactate"],["possible circuit or airway leak","do not widen them simply to suppress noise"],["unstable tachyarrhythmia with a pulse from cardiac arrest"]];
  paths.forEach((path, i) => it(path, () => {
    const text = readFileSync(path, "utf8");
    expect(validateDraft(text)).toEqual([]);
    expect(text).toContain("clinically_reviewed: false");
    const questions = text.split("## 17. MCQs")[1]!.split("## 18.")[0]!;
    expect([...questions.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(keys[i]);
    for (const needle of needles[i]!) expect(questions).toContain(needle);
  }));
});
