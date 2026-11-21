import { describe, expect, it } from "vitest";
import { evaluatePractice, type PracticeResponses } from "../../mobile/src/core/practice-evaluation";
import type { WorkingEntryShared } from "@icu/schemas/working-content";

type Exercise = NonNullable<WorkingEntryShared["practice"]>;
const response = (patch: Partial<PracticeResponses> = {}): PracticeResponses => ({ answers: {}, flags: [], choice: "", order: [], ...patch });

describe("native practice completion requires validated answers", () => {
  it("does not pass an unanswered or incorrect single choice", () => {
    const e: Exercise = { kind: "choice", setup: "Practice", options: [{ id: "a", text: "First", correct: false, feedback: "Why not" }, { id: "b", text: "Second", correct: true, feedback: "Why" }] };
    expect(evaluatePractice(e, response()).ready).toBe(false);
    expect(evaluatePractice(e, response({ choice: "a" }))).toMatchObject({ ready: true, passed: false, correct: 0, total: 1 });
    expect(evaluatePractice(e, response({ choice: "b" }))).toMatchObject({ ready: true, passed: true, correct: 1, total: 1 });
  });
  it("requires all items classified and all classifications correct", () => {
    const e: Exercise = { kind: "classify", setup: "Practice", items: [{ id: "x", text: "X", category: "a" }, { id: "y", text: "Y", category: "b" }] };
    expect(evaluatePractice(e, response({ answers: { x: "a" } })).ready).toBe(false);
    expect(evaluatePractice(e, response({ answers: { x: "a", y: "a" } }))).toMatchObject({ passed: false, correct: 1, total: 2 });
    expect(evaluatePractice(e, response({ answers: { x: "a", y: "b" } })).passed).toBe(true);
  });
  it("lets the learner flag no lines when all are sound", () => {
    const e: Exercise = { kind: "spot", setup: "Practice", lines: [{ id: "a", text: "Safe", problem: false, why: "" }, { id: "b", text: "Problem", problem: true, why: "" }] };
    expect(evaluatePractice(e, response()).ready).toBe(true);
    expect(evaluatePractice(e, response()).passed).toBe(false);
    expect(evaluatePractice(e, response({ flags: ["b"] })).passed).toBe(true);
    expect(evaluatePractice({ ...e, lines: [{ id: "a", text: "Safe", problem: false, why: "" }] }, response()).passed).toBe(true);
  });
  it("does not pass a shuffled or incomplete ordered sequence", () => {
    const e: Exercise = { kind: "sequence", setup: "Practice", steps: [{ id: "1", text: "One", why: "" }, { id: "2", text: "Two", why: "" }] };
    expect(evaluatePractice(e, response({ order: ["2", "1"] }))).toMatchObject({ ready: true, passed: false, correct: 0 });
    expect(evaluatePractice(e, response({ order: ["1"] })).ready).toBe(false);
    expect(evaluatePractice(e, response({ order: ["1", "2"] })).passed).toBe(true);
  });
  it("requires an explicit status on every checklist item; never labels this clinical certification", () => {
    const e: Exercise = { kind: "checklist", setup: "Practice", items: [{ id: "a", text: "First" }, { id: "b", text: "Second" }] };
    expect(evaluatePractice(e, response()).ready).toBe(false);
    expect(evaluatePractice(e, response({ answers: { a: "independent", b: "not_started" } }))).toMatchObject({ ready: true, passed: true, selfAssessment: true });
  });
  it("fails closed on unsupported or empty practice kinds", () => {
    expect(evaluatePractice({ kind: "unknown", setup: "Training" }, response()).passed).toBe(false);
    expect(evaluatePractice({ kind: "choice", setup: "Training", options: [] }, response({ choice: "a" })).passed).toBe(false);
  });
});
