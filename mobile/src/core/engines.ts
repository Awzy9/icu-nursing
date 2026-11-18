// Local learning engines: case-based learning and question practice. Pure TypeScript, deterministic given a seed, unit tested
// against the web app's own engine (using the synthetic fixtures). The scoring formula is identical to private.score_tenths in
// the database. Generic over the text type (`Text`) so the same engine runs unmodified against both the synthetic fixtures
// (./content.ts, text is a LocalizedText {en, ar, ...} object - tests only) and real catalog entries' `scenario`/`questions`
// fields (core/remoteContent.ts, text is a plain English string) - the engine never interprets the text itself, only passes it
// through. Real scenario options have no `scope` field, so it is optional.
export interface CaseOption<Text = string> { text: Text; points: number; next: number | null; feedback: Text; consequence?: Text; scope?: string }
export interface CaseStep<Text = string> { info: Text; prompt: Text; observations?: { label: Text; value: number | string; unit?: string }[]; options: CaseOption<Text>[] }
export interface CaseItem<Text = string> { code: string; steps: CaseStep<Text>[]; debrief?: { learning_points: Record<string, string[]> } | null }
export interface Question<Text = string> { code: string; stem: Text; options: Text[]; correct: number; explanations: Text[]; rationale: Text }

export const scoreTenths = (points: number, max: number): number => (max <= 0 ? 0 : Math.floor((2000 * points + max) / (2 * max)));

/** Small deterministic PRNG (mulberry32) so a run shows the same option order every time it is reopened. */
function rng(seed: number) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function seededOrder(n: number, seed: number, salt: number): number[] {
  const r = rng(seed * 31 + salt); const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

// ---- Cases ---------------------------------------------------------------------------------------------------------------------------------
export interface CaseRun { code: string; seed: number; position: number; taken: { position: number; option: number; points: number }[]; done: boolean }
export const startCase = <Text,>(c: CaseItem<Text>, seed: number): CaseRun => ({ code: c.code, seed, position: 1, taken: [], done: false });

/** What the learner may see before deciding: the situation and the option texts. No points, scope, feedback or consequence. */
export function currentStep<Text>(c: CaseItem<Text>, run: CaseRun) {
  const step = c.steps[run.position - 1]!;
  const order = seededOrder(step.options.length, run.seed, run.position);
  return { position: run.position, total: c.steps.length, info: step.info, prompt: step.prompt, observations: step.observations ?? [], options: order.map((index) => ({ index, text: step.options[index]!.text })) };
}
export interface Reveal<Text> { option: CaseOption<Text>; points: number; finished: boolean }
export function choose<Text>(c: CaseItem<Text>, run: CaseRun, optionIndex: number): { run: CaseRun; reveal: Reveal<Text> } {
  if (run.done) throw new Error("case already finished");
  const step = c.steps[run.position - 1]!; const option = step.options[optionIndex];
  if (!option) throw new Error("option does not belong to this step");
  const finished = option.next === null;
  return { run: { ...run, taken: [...run.taken, { position: run.position, option: optionIndex, points: option.points }], position: option.next ?? run.position, done: finished }, reveal: { option, points: option.points, finished } };
}
export function caseSummary<Text>(c: CaseItem<Text>, run: CaseRun) {
  const points = run.taken.reduce((n, t) => n + t.points, 0), max = 2 * run.taken.length;
  const scopes: Record<string, number> = {};
  for (const t of run.taken) { const s = c.steps[t.position - 1]!.options[t.option]!.scope; if (s) scopes[s] = (scopes[s] ?? 0) + 1; }
  return { points, max, scoreTenths: scoreTenths(points, max), scopeCounts: scopes, revisit: run.taken.filter((t) => t.points < 2).map((t) => t.position), debrief: c.debrief?.learning_points ?? null };
}

// ---- Questions -----------------------------------------------------------------------------------------------------------------------------
export interface Practice { seed: number; items: { code: string; order: number[] }[]; answers: (number | null)[] }
export function startPractice<Text>(all: Question<Text>[], count: number, seed: number): Practice {
  const picked = seededOrder(all.length, seed, 7).slice(0, Math.min(count, all.length));
  return { seed, items: picked.map((i, n) => ({ code: all[i]!.code, order: seededOrder(all[i]!.options.length, seed, 100 + n) })), answers: picked.map(() => null) };
}
export function answer(p: Practice, itemIndex: number, shownIndex: number): Practice { return p.answers[itemIndex] !== null ? p : { ...p, answers: p.answers.map((a, i) => (i === itemIndex ? shownIndex : a)) }; }
export const isCorrect = <Text,>(q: Question<Text>, p: Practice, itemIndex: number): boolean => p.answers[itemIndex] !== null && p.items[itemIndex]!.order[p.answers[itemIndex]!] === q.correct;
export const practiceResult = <Text,>(all: Question<Text>[], p: Practice) => ({ right: p.items.filter((it, i) => isCorrect(all.find((q) => q.code === it.code)!, p, i)).length, total: p.items.length });
