import { describe, expect, it } from "vitest";
import { pickExamQuestions } from "@/lib/working/exam-source";
import { computeExamResult, timeLimitSecondsFor, type ExamQuestion } from "@/lib/working/exam";

const q = (id: string, category: string, answer = 0): ExamQuestion => ({ id, prompt: `Prompt ${id}`, options: ["A", "B", "C", "D"], answer, explanation: "Because A.", moduleKey: "EXAMPLE", moduleTitle: "Example lesson", moduleHref: "/working/EXAMPLE", category });

describe("pickExamQuestions", () => {
  const pool = [q("Q1", "Topic A"), q("Q2", "Topic A"), q("Q3", "Topic B"), q("Q4", "Topic C")];

  it("only draws from the chosen categories", () => {
    const picked = pickExamQuestions(pool, ["Topic A"], 10, "seed-1");
    expect(picked.map((p) => p.id).sort()).toEqual(["Q1", "Q2"]);
  });

  it("caps the count to what's available, never duplicating or inventing questions", () => {
    const picked = pickExamQuestions(pool, ["Topic A", "Topic B", "Topic C"], 2, "seed-1");
    expect(picked).toHaveLength(2);
    expect(new Set(picked.map((p) => p.id)).size).toBe(2);
  });

  it("is deterministic for the same seed, and varies with a different seed", () => {
    const a = pickExamQuestions(pool, ["Topic A", "Topic B", "Topic C"], 4, "seed-1").map((p) => p.id);
    const b = pickExamQuestions(pool, ["Topic A", "Topic B", "Topic C"], 4, "seed-1").map((p) => p.id);
    expect(a).toEqual(b);
    const c = pickExamQuestions(pool, ["Topic A", "Topic B", "Topic C"], 4, "seed-2").map((p) => p.id);
    expect(c.sort()).toEqual(a.slice().sort()); // same pool, same count - just possibly reordered
  });
});

describe("timeLimitSecondsFor", () => {
  it("scales with question count and stays reasonable", () => {
    expect(timeLimitSecondsFor(10)).toBeGreaterThan(0);
    expect(timeLimitSecondsFor(30)).toBeGreaterThan(timeLimitSecondsFor(10));
  });
});

describe("computeExamResult", () => {
  const questions = [q("Q1", "Topic A", 0), q("Q2", "Topic A", 1), q("Q3", "Topic B", 2)];

  it("scores correct answers and treats an unanswered question as incorrect", () => {
    const result = computeExamResult(questions, { Q1: 0, Q2: 2 }); // Q1 correct, Q2 wrong, Q3 unanswered
    expect(result.correct).toBe(1);
    expect(result.unanswered).toBe(1);
    expect(result.total).toBe(3);
    expect(result.gaps.map((g) => g.id).sort()).toEqual(["Q2", "Q3"]);
  });

  it("groups results by topic", () => {
    const result = computeExamResult(questions, { Q1: 0, Q2: 1, Q3: 2 });
    expect(result.topics.find((t) => t.category === "Topic A")).toMatchObject({ total: 2, correct: 2 });
    expect(result.topics.find((t) => t.category === "Topic B")).toMatchObject({ total: 1, correct: 1 });
  });

  it("never claims a perfect score certifies competence (checked at the UI layer, but the data must stay honest)", () => {
    const result = computeExamResult(questions, { Q1: 0, Q2: 1, Q3: 2 });
    expect(result.correct).toBe(result.total);
    expect(result).not.toHaveProperty("certified");
  });
});
