// Content-sensitive, platform-neutral scenario session revision and resume checks.
// Non-cryptographic fingerprint, for revision detection only (not authentication).
import type { z } from "zod";
import type { learningScenarioSchema } from "./working-content";
import type { ScenarioDecision } from "./scenario-debrief";
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

// Recover only a coherent recorded suffix of the attempt. Earlier choices may be
// unavailable in legacy or cross-device sessions; never infer them from the score.
export function restoreScenarioDecisions(s: Scenario, saved: { kind: string; version: string; position: number; score: number; finished: boolean; decisions?: unknown }): { decisions: ScenarioDecision[]; incomplete: boolean } {
  const fallback = { decisions: [], incomplete: saved.position !== s.steps[0]?.position };
  if (!canResumeScenario(s, saved) || !Array.isArray(saved.decisions) || !saved.decisions.length || saved.decisions.length > s.steps.length) return fallback;
  const decisions: ScenarioDecision[] = [];
  let points = 0;
  let expected: number | undefined;
  for (const item of saved.decisions) {
    if (!item || typeof item !== "object" || !Number.isInteger(item.position) || !Number.isInteger(item.choice) || item.choice < 0) return fallback;
    if (expected !== undefined && item.position !== expected) return fallback;
    const step = s.steps.find(step => step.position === item.position);
    const option = step?.options[item.choice];
    if (!step || !option || option.next === null || option.next <= step.position || !Number.isInteger(option.points) || option.points < 0) return fallback;
    decisions.push({ position: item.position, choice: item.choice });
    points += option.points;
    expected = option.next;
  }
  const first = decisions[0]!.position;
  const prefixScore = saved.score - points;
  if (expected !== saved.position || !canResumeScenario(s, {...saved, position: first, score: prefixScore})) return fallback;
  return { decisions, incomplete: first !== s.steps[0]?.position };
}

// Validate a recorded suffix for an in-progress or completed educational case.
// This is not an authorization or competency boundary; native/direct RPC writes
// are still user-owned data and must be validated again before display.
export function validScenarioSave(s: Scenario, saved: { kind: string; version: string; position: number; score: number; finished: boolean; decisions: ScenarioDecision[] }): boolean {
  if (saved.kind !== "scenario" || saved.version !== scenarioVersion(s) || !Number.isInteger(saved.score) || saved.score < 0 || saved.decisions.length > s.steps.length) return false;
  if (!saved.finished) {
    if (!canResumeScenario(s, saved)) return false;
    if (!saved.decisions.length) return true;
    return restoreScenarioDecisions(s,saved).decisions.length === saved.decisions.length;
  }
  const last = saved.decisions.at(-1);
  if (!last || last.position !== saved.position) return false;
  const option = s.steps.find(step => step.position === last.position)?.options[last.choice];
  if (!option || option.next !== null || !Number.isInteger(option.points) || option.points < 0) return false;
  const before = {...saved, finished: false, score: saved.score - option.points, decisions: saved.decisions.slice(0,-1)};
  if (!canResumeScenario(s,before)) return false;
  return !before.decisions.length || restoreScenarioDecisions(s,before).decisions.length === before.decisions.length;
}

// Only use history proved by the recorded decisions or an unambiguous sequence.
// Legacy native "visited" arrays are not proof of the path taken.
export function restoreScenarioHistory(s: Scenario, saved: Parameters<typeof restoreScenarioDecisions>[1]): { positions: number[]; incomplete: boolean } {
  if (!canResumeScenario(s, saved)) return { positions: [], incomplete: true };
  const sequential = sequentialHistory(s, saved.position);
  if (sequential !== undefined) return { positions: sequential, incomplete: false };
  const restored = restoreScenarioDecisions(s, saved);
  const first = restored.decisions[0]?.position;
  if (first === undefined) return { positions: [], incomplete: saved.position !== s.steps[0]?.position };
  const prefix = sequentialHistory(s, first);
  return { positions: [...(prefix ?? []), ...restored.decisions.map(d => d.position)], incomplete: prefix === undefined };
}
