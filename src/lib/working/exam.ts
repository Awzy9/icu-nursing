import { scoreTenths } from "@/lib/question-bank/score";

// A question description with no attempt-dependent state - safe to pass from server to client.
export interface ExamQuestion { id: string; prompt: string; options: string[]; answer: number; explanation: string; moduleKey: string; moduleTitle: string; moduleHref: string; category: string }

export interface ExamTopic { category: string; count: number }
export const COUNT_PRESETS = [10, 20, 30] as const;
export const MINUTES_PER_QUESTION = 1.2;

export const timeLimitSecondsFor = (questionCount: number) => Math.round(questionCount * MINUTES_PER_QUESTION * 60);

export interface TopicResult { category: string; total: number; correct: number }
export interface ExamResult { total: number; correct: number; unanswered: number; scoreTenths: number; topics: TopicResult[]; gaps: ExamQuestion[] }

// Unanswered counts as incorrect, same convention as scoreAttempt in the classic edition.
export function computeExamResult(questions: ExamQuestion[], answers: Record<string, number>): ExamResult {
  const byCategory = new Map<string, TopicResult>();
  let correct = 0, unanswered = 0;
  const gaps: ExamQuestion[] = [];
  for (const q of questions) {
    const t = byCategory.get(q.category) ?? { category: q.category, total: 0, correct: 0 };
    t.total += 1;
    const choice = answers[q.id];
    const isCorrect = choice === q.answer;
    if (isCorrect) { correct += 1; t.correct += 1; } else gaps.push(q);
    if (choice === undefined) unanswered += 1;
    byCategory.set(q.category, t);
  }
  return { total: questions.length, correct, unanswered, scoreTenths: scoreTenths(correct, questions.length), topics: [...byCategory.values()], gaps };
}
