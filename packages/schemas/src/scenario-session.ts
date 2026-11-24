// Content-sensitive, platform-neutral scenario session revision and resume checks.
// Non-cryptographic fingerprint, for revision detection only (not authentication).
import type { z } from "zod";
import type { learningScenarioSchema } from "./working-content";
type Scenario = z.infer<typeof learningScenarioSchema>;
export function scenarioVersion(s: Scenario): string {
  const data = JSON.stringify([s.setting, s.objectives, s.takeaways, s.steps.map(step => [
    step.position, step.info, step.prompt,
    (step.observations ?? []).map(o => [o.label, o.value, o.unit ?? null]),
    step.options.map(o => [o.text, o.points, o.next, o.feedback, o.consequence ?? null]),
  ])]);
  let a = 2166136261, b = 5381;
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619);
    b = Math.imul(b, 33) ^ c;
  }
  return "sc2-" + (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0");
}
export function canResumeScenario(s: Scenario, saved: { kind: string; version: string; position: number; score: number; finished: boolean }): boolean {
  if (saved.kind !== "scenario" || saved.finished || saved.version !== scenarioVersion(s) ||
      !Number.isInteger(saved.position) || !Number.isInteger(saved.score) || saved.score < 0) return false;
  const index = s.steps.findIndex(step => step.position === saved.position);
  if (index < 0) return false;
  const reachable = new Map<number, Set<number>>([[s.steps[0]!.position, new Set([0])]]);
  for (let i = 0; i < index; i++) {
    const step = s.steps[i]!;
    for (const score of reachable.get(step.position) ?? []) for (const option of step.options) {
      if (option.next === null || !Number.isInteger(option.points) || option.points < 0) continue;
      const nextIndex = s.steps.findIndex(n => n.position === option.next);
      if (nextIndex <= i || nextIndex > index) continue;
      const scores = reachable.get(option.next) ?? new Set<number>();
      scores.add(score + option.points);
      reachable.set(option.next, scores);
    }
  }
  return reachable.get(saved.position)?.has(saved.score) ?? false;
}
// Only infer previous checkpoints when every earlier decision leads to the same next step.
// Genuine branches require stored history; do not invent it from the saved position.
export function sequentialHistory(s: Scenario, position: number): number[] | undefined {
  const index = s.steps.findIndex(step => step.position === position);
  if (index < 0) return undefined;
  for (let i = 0; i < index; i++) {
    const next = s.steps[i + 1]!.position;
    const options = s.steps[i]!.options;
    if (!options.length || options.some(o => o.next !== next)) return undefined;
  }
  return s.steps.slice(0, index).map(step => step.position);
}
