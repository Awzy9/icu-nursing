import { describe, expect, it } from "vitest";
import { computeExamResult, formatClock, remainingSeconds, tenthsToPercentString, timeLimitSecondsFor, type ExamQuestion } from "../../mobile/src/core/exam";

function q(id: string, category: string, answer = 0): ExamQuestion {
  return { id, prompt: `prompt ${id}`, options: ["a", "b"], answer, explanation: "why", moduleKey: "MOD-01", moduleTitle: "Module", moduleHref: "/working/MOD-01", category };
}

describe("timeLimitSecondsFor", () => {
  it("allows roughly 1.2 minutes per question, matching the website's exam.ts exactly", () => {
    expect(timeLimitSecondsFor(10)).toBe(Math.round(10 * 1.2 * 60));
    expect(timeLimitSecondsFor(20)).toBe(1440);
  });
});

describe("computeExamResult", () => {
  const questions = [q("Q1", "Sepsis", 0), q("Q2", "Sepsis", 1), q("Q3", "Airway", 0)];

  it("scores correct answers and groups by category", () => {
    const result = computeExamResult(questions, { Q1: 0, Q2: 1, Q3: 1 });
    expect(result.total).toBe(3);
    expect(result.correct).toBe(2);
    expect(result.unanswered).toBe(0);
    expect(result.topics).toEqual([{ category: "Sepsis", total: 2, correct: 2 }, { category: "Airway", total: 1, correct: 0 }]);
    expect(result.gaps.map((g) => g.id)).toEqual(["Q3"]);
  });

  it("counts an unanswered question as incorrect, same convention as the website", () => {
    const result = computeExamResult(questions, { Q1: 0 });
    expect(result.unanswered).toBe(2);
    expect(result.correct).toBe(1);
    expect(result.gaps.map((g) => g.id)).toEqual(["Q2", "Q3"]);
  });

  it("scoreTenths matches the shared formula (half-up rounding in tenths of a percent)", () => {
    const result = computeExamResult(questions, { Q1: 0, Q2: 1, Q3: 1 });
    expect(result.scoreTenths).toBe(667); // 2/3 -> 66.7%
  });
});

describe("formatClock", () => {
  it("formats seconds as mm:ss, clamping negative values to zero", () => {
    expect(formatClock(125)).toBe("02:05");
    expect(formatClock(-5)).toBe("00:00");
    expect(formatClock(59)).toBe("00:59");
  });
});

describe("remainingSeconds", () => {
  it("counts down from the server-anchored deadline", () => {
    const startedAt = "2026-01-01T00:00:00.000Z";
    const serverNow = "2026-01-01T00:05:00.000Z";
    const deviceNow = Date.parse("2026-01-01T00:05:00.000Z");
    expect(remainingSeconds(startedAt, 600, serverNow, deviceNow)).toBeCloseTo(300, 0);
  });
  it("is unaffected by a wrong device clock, since it is anchored to serverNow", () => {
    const startedAt = "2026-01-01T00:00:00.000Z";
    const serverNow = "2026-01-01T00:05:00.000Z";
    const wrongDeviceNow = Date.parse("2020-01-01T00:00:00.000Z"); // device clock set years in the past
    expect(remainingSeconds(startedAt, 600, serverNow, wrongDeviceNow)).toBeCloseTo(300, 0);
  });
  it("goes negative once time is up", () => {
    const startedAt = "2026-01-01T00:00:00.000Z";
    const serverNow = "2026-01-01T00:11:00.000Z";
    expect(remainingSeconds(startedAt, 600, serverNow, Date.parse(serverNow))).toBeLessThan(0);
  });
});

describe("tenthsToPercentString", () => {
  it("formats tenths of a percent with exactly one decimal", () => {
    expect(tenthsToPercentString(833)).toBe("83.3");
    expect(tenthsToPercentString(1000)).toBe("100.0");
    expect(tenthsToPercentString(0)).toBe("0.0");
  });
});
