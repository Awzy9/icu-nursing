import { describe, expect, it } from "vitest";
import { computeRevisionQueue, type RevisionQuestion } from "@/lib/working/revision";
import { nextBox, daysForBox } from "@/lib/question-bank/leitner";

const q = (id: string): RevisionQuestion => ({ id, prompt: `Prompt ${id}`, options: ["A", "B", "C", "D"], answer: 0, explanation: "Because A is right.", moduleKey: "EXAMPLE", moduleTitle: "Example lesson", moduleHref: "/working/EXAMPLE" });
const DAY = 86_400_000;

describe("computeRevisionQueue", () => {
  it("treats a never-attempted question as due now", () => {
    const queue = computeRevisionQueue([q("Q1")], []);
    expect(queue.due).toHaveLength(1);
    expect(queue.due[0]!.isNew).toBe(true);
  });

  it("puts a missed question due immediately (box resets to 1)", () => {
    const now = Date.now();
    const queue = computeRevisionQueue([q("Q1")], [{ id: "Q1", title: "t", href: "/working/EXAMPLE", correct: false, at: now - 1000, box: 1 }], now);
    expect(queue.due).toHaveLength(1);
    expect(queue.due[0]!.isNew).toBe(false);
  });

  it("holds a correctly-answered question back until its box's interval has passed", () => {
    const now = Date.now();
    const answeredAt = now - DAY; // 1 day ago, box 2 (1 day interval) - due exactly now
    const dueQueue = computeRevisionQueue([q("Q1")], [{ id: "Q1", title: "t", href: "/working/EXAMPLE", correct: true, at: answeredAt, box: 2 }], now);
    expect(dueQueue.due).toHaveLength(1);
    const notYetQueue = computeRevisionQueue([q("Q1")], [{ id: "Q1", title: "t", href: "/working/EXAMPLE", correct: true, at: now - 1000, box: 2 }], now);
    expect(notYetQueue.due).toHaveLength(0);
    expect(notYetQueue.upcoming).toHaveLength(1);
    expect(notYetQueue.nextDueAt).toBe(now - 1000 + daysForBox(2) * DAY);
  });

  it("reports total questions and attempted count regardless of due status", () => {
    const queue = computeRevisionQueue([q("Q1"), q("Q2")], [{ id: "Q1", title: "t", href: "/working/EXAMPLE", correct: true, at: Date.now(), box: 5 }]);
    expect(queue.totalQuestions).toBe(2);
    expect(queue.totalAttempted).toBe(1);
  });

  it("sorts the due queue by how overdue each question is, most overdue first", () => {
    const now = Date.now();
    const queue = computeRevisionQueue(
      [q("Q1"), q("Q2")],
      [{ id: "Q1", title: "t", href: "/working/EXAMPLE", correct: false, at: now - 1000, box: 1 }, { id: "Q2", title: "t", href: "/working/EXAMPLE", correct: false, at: now - 5000, box: 1 }],
      now,
    );
    expect(queue.due.map((s) => s.question.id)).toEqual(["Q2", "Q1"]);
  });
});

describe("Leitner schedule reuse (matches public.working_record_attempt)", () => {
  it("moves a new question to box 2 on a correct answer, or keeps it at box 1 on a miss", () => {
    expect(nextBox(1, true)).toBe(2);
    expect(nextBox(1, false)).toBe(1);
  });
  it("sends any box back to 1 on a miss, never below 1", () => {
    expect(nextBox(5, false)).toBe(1);
  });
  it("caps progression at box 5", () => {
    expect(nextBox(5, true)).toBe(5);
  });
});
