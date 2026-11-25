import type { z } from "zod";
import type { learningScenarioSchema } from "./working-content";

type Scenario = z.infer<typeof learningScenarioSchema>;
export type ScenarioDecision = { position: number; choice: number };

// A zero-point decision is an educational review priority, not a validated critical-error
// classification. Do not infer which earlier options were selected from a cumulative score.
export function scenarioDebrief(scenario: Scenario, decisions: readonly ScenarioDecision[]) {
  const seen = new Set<number>();
  const entries = decisions.flatMap(d => {
    const step = scenario.steps.find(s => s.position === d.position);
    const selected = step?.options[d.choice];
    if (!step || !selected || seen.has(d.position)) return [];
    seen.add(d.position);
    const preferred = step.options.reduce((best, o) => o.points > best.points ? o : best, selected);
    return [{ position: step.position, prompt: step.prompt, selected: selected.text, feedback: selected.feedback,
      points: selected.points, maximum: preferred.points, preferred: preferred.text,
      preferredFeedback: preferred.feedback, consequence: selected.consequence ?? null }];
  });
  return {
    entries,
    priorities: entries.filter(e => e.points < e.maximum).sort((a,b) => a.points - b.points || a.position - b.position),
    fullCredit: entries.filter(e => e.points === e.maximum).length,
    strengths: entries.filter(e => e.points === e.maximum),
    observedPoints: entries.reduce((sum,e) => sum + e.points, 0),
    observedMaximum: entries.reduce((sum,e) => sum + e.maximum, 0),
  };
}
