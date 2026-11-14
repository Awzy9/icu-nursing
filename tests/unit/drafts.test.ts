import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { batchPositionIssues, mcqQuality, parseMcqs, validateDraft } from "@/lib/draft-validator";

const dir = "content/drafts/batch-01";
const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
const texts = files.map((f) => readFileSync(`${dir}/${f}`, "utf8"));
const good = texts[0]!;

const q = (id: string, answer: string, opts: string[], extra = {}) => ({
  id, answer, hasWhyCorrect: true,
  options: Object.fromEntries(opts.map((o, i) => ["ABCD"[i]!, o])),
  why: Object.fromEntries(["A", "B", "C", "D"].filter((l) => l !== answer).map((l) => [l, "This is wrong because of the reason."])),
  ...extra,
});
const ok = ["Reassess the patient and escalate using SBAR now", "Wait for the next ward round before acting on it", "Record it and look again at the end of shift", "Ask a relative to find a doctor for the patient"];

describe("Phase 2 drafts: structure and safety", () => {
  it("has the batch files", () => expect(files.length).toBeGreaterThanOrEqual(6));
  files.forEach((f, i) => it(`${f} passes validation`, () => expect(validateDraft(texts[i]!)).toEqual([])));
  it("batch answer positions are balanced", () => expect(batchPositionIssues(texts)).toEqual([]));
  it("every draft has six or more MCQs with an explanation for each wrong option", () => {
    for (const t of texts) {
      const qs = parseMcqs(t);
      expect(qs.length).toBeGreaterThanOrEqual(6);
      for (const m of qs) for (const l of ["A", "B", "C", "D"]) if (l !== m.answer) expect(m.why[l]?.length ?? 0).toBeGreaterThan(14);
    }
  });
  it("rejects claims of review", () => {
    expect(validateDraft(good.replace("clinically_reviewed: false", "clinically_reviewed: true")).length).toBeGreaterThan(0);
    expect(validateDraft(good.replace("status: DRAFT", "status: published")).length).toBeGreaterThan(0);
    expect(validateDraft(good + "\nReviewed by Dr X").length).toBeGreaterThan(0);
  });
  it("rejects dosing and missing banner", () => {
    expect(validateDraft(good + "\nGive 5 mcg/kg/min").some((i) => i.rule === "dosing")).toBe(true);
    expect(validateDraft(good.replace(/NOT clinically reviewed/g, "x")).some((i) => i.rule === "banner")).toBe(true);
  });
});

describe("MCQ quality checks (self-tests)", () => {
  it("accepts a balanced set", () => {
    const qs = ["A", "C", "B", "D", "C", "A"].map((a, i) => q(`Q${i + 1}`, a, ok));
    expect(mcqQuality(qs)).toEqual([]);
  });
  it("flags answer-position imbalance", () => {
    const qs = Array.from({ length: 6 }, (_, i) => q(`Q${i + 1}`, "B", ok));
    expect(mcqQuality(qs).some((i) => i.rule === "mcq-position")).toBe(true);
  });
  it("flags implausibly short distractors", () => {
    const qs = ["A", "C", "B", "D", "C", "A"].map((a, i) => q(`Q${i + 1}`, a, ["Reassess the patient and escalate using SBAR now", "Wait", "Ignore it", "No"]));
    expect(mcqQuality(qs).some((i) => i.rule === "mcq-distractor")).toBe(true);
  });
  it("flags a correct option that is always the longest", () => {
    const long = "Reassess the patient thoroughly, escalate using SBAR, and document the time of the call and the reply";
    const qs = ["A", "C", "B", "D", "C", "A"].map((a, i) => q(`Q${i + 1}`, a, ["A", "B", "C", "D"].map((l) => (l === a ? long : "Wait for the next ward round before acting on it")) as string[]));
    expect(mcqQuality(qs).some((i) => i.rule === "mcq-length")).toBe(true);
  });
  it("flags a missing explanation for a wrong option", () => {
    const qs = ["A", "C", "B", "D", "C", "A"].map((a, i) => q(`Q${i + 1}`, a, ok));
    qs[0]!.why = {};
    expect(mcqQuality(qs).some((i) => /Why not/.test(i.message))).toBe(true);
  });
  it("flags answer-position imbalance across a batch", () => {
    const one = (a: string) => `## 17. MCQs\n${Array.from({ length: 6 }, (_, i) => `**Q${i + 1} (x).** s\nA. aaa\nB. bbb\nC. ccc\nD. ddd\n**Answer: ${a}.**\n`).join("\n")}\n## 18. References`;
    expect(batchPositionIssues([one("A"), one("A"), one("B"), one("A")]).length).toBeGreaterThan(0);
  });
});
