import "server-only";
import { seededOrder } from "@/lib/question-bank/shuffle";
import { workingContent } from "./index";
import type { ExamQuestion, ExamTopic } from "./exam";

let cache: ExamQuestion[] | undefined;
export function allExamQuestions(): ExamQuestion[] {
  cache ??= workingContent().filter((e) => e.type === "questions").flatMap((e) =>
    (e.questions ?? []).map((q) => ({ id: q.id, prompt: q.prompt, options: q.options, answer: q.answer, explanation: q.explanation, moduleKey: e.key, moduleTitle: e.title, moduleHref: `/working/${e.key}`, category: e.category })),
  );
  return cache;
}

export function examTopics(): ExamTopic[] {
  const counts = new Map<string, number>();
  for (const q of allExamQuestions()) counts.set(q.category, (counts.get(q.category) ?? 0) + 1);
  return [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
}

export function examQuestionsByIds(ids: readonly string[]): ExamQuestion[] {
  const byId = new Map(allExamQuestions().map((q) => [q.id, q]));
  return ids.flatMap((id) => { const q = byId.get(id); return q ? [q] : []; });
}

// Deterministic: the same seeded order used by the classic question-bank edition, so an attempt's
// question order is reproducible from its stored seed without storing the order itself. Takes an
// explicit pool (rather than always reading the real catalog) so it stays easy to unit test.
export function pickExamQuestions(pool: ExamQuestion[], categories: string[], count: number, seed: string): ExamQuestion[] {
  const eligible = pool.filter((q) => categories.includes(q.category));
  const ids = seededOrder(eligible.map((q) => q.id), seed, "exam").slice(0, count);
  const byId = new Map(eligible.map((q) => [q.id, q]));
  return ids.flatMap((id) => { const q = byId.get(id); return q ? [q] : []; });
}
