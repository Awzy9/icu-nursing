import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseMcqs, validateDraft } from "@/lib/draft-validator";
const cases = [
  ["content/drafts/batch-02/D02-T08-shock-recognition.md", "Q3", "D", "different trends in pressure and tissue perfusion"],
  ["content/drafts/batch-02/D02-T15-defibrillation-safety.md", "Q4", "A", "both adhesive pads and hand-held paddles"],
  ["content/drafts/batch-07/D05-T03-vasopressor-pharmacology-partial.md", "Q1", "A", "principal cardiovascular actions"],
  ["content/drafts/batch-08/D08-T02-coagulation-tests-inr-aptt-fibrinogen.md", "Q1", "B", "before relying on the coagulation result"],
] as const;
describe("Clinical reasoning stem improvements", () => {
  it.each(cases)("%s retains the supported answer and draft safeguards", (path, question, answer, phrase) => {
    const text = readFileSync(path, "utf8");
    expect(text).toContain(phrase);
    expect(validateDraft(text)).toEqual([]);
    expect(parseMcqs(text)).toHaveLength(6);
    expect(parseMcqs(text).find(q => q.id === question)?.answer).toBe(answer);
    expect(text).toMatch(/^clinically_reviewed: false$/m);
  });
});
