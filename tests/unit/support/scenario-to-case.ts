// TEST-ONLY converter: scenario authoring format (content/drafts/scenarios) -> case-engine fixture format.
// It lives under tests/ on purpose: nothing in src/ may import content/drafts, so a draft can never reach the learner-facing app.
import { stableId } from "@/lib/question-bank/fixtures";
import type { CaseFixture } from "@/lib/cases/fixtures";
import type { CaseScope } from "@/lib/cases/types";
import { validateScenarioDraft, type ScenarioDraft } from "@/lib/scenario-draft-validator";

export class ConversionRefused extends Error {}

/** Converts a validated decision graph. Refuses outlines, drafts that fail validation, and anything claiming review. */
export function scenarioToCase(d: ScenarioDraft, known: Set<string>, code: string): CaseFixture {
  if (d.spec_level !== "decision_graph") throw new ConversionRefused(`${d.scenario_id}: only decision graphs can be converted`);
  const issues = validateScenarioDraft(d, known);
  if (issues.length) throw new ConversionRefused(`${d.scenario_id}: ${issues.map((i) => i.rule).join(", ")}`);
  const en = (t: string) => ({ en: t });
  return {
    id: stableId(code), code, domainSlug: "general-icu-nursing", difficulty: d.difficulty, version: 1,
    title: en(d.title), vignette: en(d.setting ?? d.title),
    debrief: d.debrief ? { learning_points: { en: d.debrief.learning_points }, links: d.debrief.links as { kind: "skill" | "topic" | "medication"; code: string }[] } : null,
    steps: d.steps!.map((s, si) => ({
      id: stableId(`${code}:s${si + 1}`), position: s.position, info: en(s.info), prompt: en(s.prompt),
      observations: s.observations.map((o) => ({ key: o.key, label: en(o.label), value: o.value, ...(o.unit ? { unit: o.unit } : {}) })),
      options: s.options.map((o, oi) => ({ id: stableId(`${code}:s${si + 1}:o${oi + 1}`), position: oi + 1, text: en(o.text), points: o.points, next: o.next, scope: o.scope as CaseScope, feedback: en(o.feedback), consequence: en(o.consequence) })),
    })),
  };
}
