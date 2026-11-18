import { describe, expect, it } from "vitest";
import { computePathProgress, pathAudience, pathObjective, pathTitle, type ResolvedPath, type ResolvedStep } from "../../mobile/src/core/paths";
import { emptyProgress } from "../../mobile/src/core/progress";

function step(key: string, type = "topics"): ResolvedStep {
  return { key, type, title: `title ${key}`, href: `/working/${key}` };
}

const path: ResolvedPath = {
  key: "new-to-icu",
  title: ["New to ICU", "جديد في العناية المركزة"],
  audience: ["Nurses starting in ICU.", "ممرضون جدد."],
  objectives: [["Objective 1", "هدف 1"]],
  estimatedMinutes: 55,
  steps: [step("D07-T01"), step("QB-D07-T01", "questions"), step("SK-25", "skills")],
};

describe("computePathProgress", () => {
  it("treats a step as done purely from the local completed flag, for every step type including quizzes", () => {
    const progress = { ...emptyProgress(), completed: ["D07-T01"] };
    const result = computePathProgress(path.steps, progress);
    expect(result.completed).toBe(1);
    expect(result.total).toBe(3);
    expect(result.percent).toBe(33);
    expect(result.steps.map((s) => s.done)).toEqual([true, false, false]);
    expect(result.nextStep?.step.key).toBe("QB-D07-T01");
  });

  it("is 0% with no steps done and null nextStep is never returned while steps remain", () => {
    const result = computePathProgress(path.steps, emptyProgress());
    expect(result.percent).toBe(0);
    expect(result.nextStep?.step.key).toBe("D07-T01");
  });

  it("is 100% with nextStep null once every step is completed", () => {
    const progress = { ...emptyProgress(), completed: path.steps.map((s) => s.key) };
    const result = computePathProgress(path.steps, progress);
    expect(result.percent).toBe(100);
    expect(result.nextStep).toBeNull();
  });

  it("returns 0% for a path with no steps, rather than dividing by zero", () => {
    expect(computePathProgress([], emptyProgress()).percent).toBe(0);
  });
});

describe("pathTitle / pathAudience / pathObjective", () => {
  it("picks the English or Arabic element of the [en, ar] tuple", () => {
    expect(pathTitle(path, false)).toBe("New to ICU");
    expect(pathTitle(path, true)).toBe("جديد في العناية المركزة");
    expect(pathAudience(path, false)).toBe("Nurses starting in ICU.");
    expect(pathObjective(path.objectives[0]!, true)).toBe("هدف 1");
  });
});
