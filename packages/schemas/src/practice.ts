import { z } from "zod";

/**
 * Practical nursing education exercises (SBAR, documentation, monitoring and escalation, infection prevention, equipment practice, competency
 * self-assessment). Learner-facing content is synthetic and nonclinical only (code SYN-PX-nnn, synthetic: true); the real practical drafts live
 * outside the app and can never satisfy this schema. Scoring is deterministic and pure so the web and native apps share it.
 */
export const PRACTICE_AREAS = ["sbar", "documentation", "monitoring-escalation", "infection-prevention", "equipment-practice", "competency"] as const;
export type PracticeArea = (typeof PRACTICE_AREAS)[number];
export const PRACTICE_KINDS = ["classify", "spot", "sequence", "choice", "checklist"] as const;
export type PracticeKind = (typeof PRACTICE_KINDS)[number];
export const COMPETENCY_LEVELS = ["not_started", "learning", "with_support", "independent"] as const;
export type CompetencyLevel = (typeof COMPETENCY_LEVELS)[number];

const loc = z.record(z.string(), z.string());
const id = z.string().regex(/^[a-z][a-z0-9-]{0,24}$/);

const base = {
  code: z.string().regex(/^SYN-PX-\d{3}$/),
  area: z.enum(PRACTICE_AREAS),
  synthetic: z.literal(true),
  title: loc,
  summary: loc,
  intro: loc,
  debrief: z.record(z.string(), z.array(z.string())),
};
export const classifySchema = z.object({
  ...base, kind: z.literal("classify"),
  categories: z.array(z.object({ id, label: loc })).min(2).max(5),
  items: z.array(z.object({ id, text: loc, category: id, why: loc })).min(3).max(10),
});
export const spotSchema = z.object({
  ...base, kind: z.literal("spot"),
  prompt: loc,
  lines: z.array(z.object({ id, text: loc, problem: z.boolean(), why: loc })).min(3).max(10),
});
export const sequenceSchema = z.object({
  ...base, kind: z.literal("sequence"),
  steps: z.array(z.object({ id, text: loc, why: loc })).min(3).max(8), // stored in the correct order
});
export const choiceSchema = z.object({
  ...base, kind: z.literal("choice"),
  stem: loc,
  table: z.object({ columns: z.array(loc).min(2).max(5), rows: z.array(z.object({ label: loc, values: z.array(loc) })).min(2).max(8) }).optional(),
  options: z.array(z.object({ id, text: loc, correct: z.boolean(), feedback: loc })).min(3).max(4),
});
export const checklistSchema = z.object({
  ...base, kind: z.literal("checklist"),
  items: z.array(z.object({ id, text: loc })).min(3).max(12),
});
export const practiceSchema = z.discriminatedUnion("kind", [classifySchema, spotSchema, sequenceSchema, choiceSchema, checklistSchema]).superRefine((e, ctx) => {
  const bad = (m: string) => ctx.addIssue({ code: "custom", message: m });
  if (e.kind === "classify") {
    const cats = new Set(e.categories.map((c) => c.id));
    if (cats.size !== e.categories.length) bad("duplicate category id");
    if (e.items.some((i) => !cats.has(i.category))) bad("an item names an unknown category");
    if ([...cats].some((c) => !e.items.some((i) => i.category === c))) bad("every category needs at least one item");
  }
  if (e.kind === "spot" && (!e.lines.some((l) => l.problem) || !e.lines.some((l) => !l.problem))) bad("a spot exercise needs at least one problem line and one sound line");
  if (e.kind === "choice") {
    if (e.options.filter((o) => o.correct).length !== 1) bad("a choice exercise needs exactly one correct option");
    if (e.table && e.table.rows.some((r) => r.values.length !== e.table!.columns.length - 1)) bad("table rows must have one value per column after the label column");
  }
  const ids = e.kind === "classify" ? e.items.map((i) => i.id) : e.kind === "spot" ? e.lines.map((l) => l.id) : e.kind === "sequence" ? e.steps.map((s) => s.id) : e.kind === "choice" ? e.options.map((o) => o.id) : e.items.map((i) => i.id);
  if (new Set(ids).size !== ids.length) bad("duplicate item id");
  for (const key of ["en", "ar"]) {
    const texts: Record<string, string>[] = [e.title, e.summary, e.intro];
    if (texts.some((t) => !t[key])) bad(`title, summary and intro need ${key} text`);
  }
});
export type PracticeExercise = z.infer<typeof practiceSchema>;
export type ClassifyExercise = z.infer<typeof classifySchema>;
export type SpotExercise = z.infer<typeof spotSchema>;
export type SequenceExercise = z.infer<typeof sequenceSchema>;
export type ChoiceExercise = z.infer<typeof choiceSchema>;
export type ChecklistExercise = z.infer<typeof checklistSchema>;
export const practiceListSchema = z.array(practiceSchema);

// ---------------------------------------------------------------- deterministic scoring (no randomness, no clock)
export interface ItemResult { id: string; correct: boolean }
export interface PracticeScore { correct: number; total: number; items: ItemResult[]; extra?: Record<string, number> }

export function scoreClassify(ex: ClassifyExercise, answers: Record<string, string | undefined>): PracticeScore {
  const items = ex.items.map((i) => ({ id: i.id, correct: answers[i.id] === i.category }));
  return { correct: items.filter((i) => i.correct).length, total: items.length, items };
}
/** The learner flags the lines they think are a problem. A line is right when the flag matches `problem`; flagging a sound line counts against the score. */
export function scoreSpot(ex: SpotExercise, flagged: ReadonlySet<string>): PracticeScore {
  const items = ex.lines.map((l) => ({ id: l.id, correct: flagged.has(l.id) === l.problem }));
  return {
    correct: items.filter((i) => i.correct).length, total: items.length, items,
    extra: { missed: ex.lines.filter((l) => l.problem && !flagged.has(l.id)).length, falseFlags: ex.lines.filter((l) => !l.problem && flagged.has(l.id)).length },
  };
}
export function scoreSequence(ex: SequenceExercise, order: readonly string[]): PracticeScore {
  const items = ex.steps.map((s, i) => ({ id: s.id, correct: order[i] === s.id }));
  return { correct: items.filter((i) => i.correct).length, total: items.length, items };
}
export function scoreChoice(ex: ChoiceExercise, chosen: string | undefined): PracticeScore {
  const items = ex.options.map((o) => ({ id: o.id, correct: o.correct && chosen === o.id }));
  return { correct: items.some((i) => i.correct) ? 1 : 0, total: 1, items };
}
/** A fixed, repeatable presentation order for sequence exercises that is never the correct order. */
export function presentedOrder(ids: readonly string[], seed: string): string[] {
  let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; const j = h % (i + 1); [out[i], out[j]] = [out[j]!, out[i]!]; }
  if (out.length > 1 && out.every((x, i) => x === ids[i])) out.push(out.shift()!);
  return out;
}
export const isLevel = (v: unknown): v is CompetencyLevel => (COMPETENCY_LEVELS as readonly unknown[]).includes(v);
/** Self-reported levels only. Nothing here is verification: it is a count of what the learner says. */
export function summariseLevels(levels: Record<string, string | undefined>, ids: readonly string[]): Record<CompetencyLevel, number> {
  const out = { not_started: 0, learning: 0, with_support: 0, independent: 0 } as Record<CompetencyLevel, number>;
  for (const i of ids) out[isLevel(levels[i]) ? (levels[i] as CompetencyLevel) : "not_started"]++;
  return out;
}
