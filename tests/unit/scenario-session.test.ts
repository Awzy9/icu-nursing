import { describe, expect, it } from "vitest";
import { scenarioVersion, canResumeScenario, sequentialHistory } from "@icu/schemas/scenario-session";
import { learningScenarioSchema } from "@icu/schemas/working-content";
import { emptyProgress, progressSchema, saveSession } from "../../mobile/src/core/progress";
const scenario = { setting: "Fictional", objectives: [], takeaways: ["Reflect"], steps: [1,2,3].map(position => ({
  position, info: "Stage " + position, prompt: "Choose", observations: [{ label: "Reading", value: position, unit: "example" }],
  options: [0,2].map(points => ({ text: "Choice " + points, points, next: position === 3 ? null : position + 1, feedback: "Feedback" })),
})) };
describe("Shared scenario session revision and recovery", () => {
  const saved = { kind: "scenario" as const, version: scenarioVersion(scenario), position: 3, score: 2, finished: false, at: "2026-11-24T00:00:00Z" };
  it("fits mobile storage and agrees after native schema parsing", () => {
    expect(saved.version.length).toBeLessThanOrEqual(40);
    expect(scenarioVersion(learningScenarioSchema.parse(scenario))).toBe(saved.version);
    expect(progressSchema.parse(saveSession(emptyProgress(), "SC-01", saved)).sessions["SC-01"]).toEqual(saved);
  });
  it("retains older long versions on hydration so unrelated progress is not lost", () => {
    const legacy = JSON.stringify(scenario.steps.map(s => ({ p: s.position, n: s.options.length })));
    expect(legacy.length).toBeGreaterThan(40);
    expect(progressSchema.parse(saveSession(emptyProgress(), "SC-01", {...saved, version: legacy})).sessions["SC-01"]?.version).toBe(legacy);
  });
  it("rejects stale content, nonexistent positions and impossible scores", () => {
    expect(canResumeScenario(scenario, saved)).toBe(true);
    expect(canResumeScenario(scenario, {...saved, score: 1})).toBe(false);
    expect(canResumeScenario(scenario, {...saved, position: 9})).toBe(false);
    expect(canResumeScenario(scenario, {...saved, kind: "quiz"})).toBe(false);
    expect(canResumeScenario(scenario, {...saved, finished: true})).toBe(false);
    const changed = structuredClone(scenario);
    changed.steps[0]!.options[0]!.next = 3;
    expect(scenarioVersion(changed)).not.toBe(saved.version);
    expect(canResumeScenario(changed, saved)).toBe(false);
    expect(sequentialHistory(changed, 3)).toBeUndefined();
  });
  it("reconstructs only unambiguous sequential history from the shared position", () => {
    expect(sequentialHistory(scenario, 3)).toEqual([1,2]);
    expect(sequentialHistory(scenario, 1)).toEqual([]);
    expect(sequentialHistory(scenario, 99)).toBeUndefined();
  });
});
