// Pure scoring logic for exam mode, mirroring src/lib/working/exam.ts's computeExamResult
// exactly (same convention: unanswered counts as incorrect). Question selection and the
// server-anchored timing live elsewhere (core/remoteContent.ts for content, api/rpc.ts for the
// working_exams row) - this module only scores a finished attempt.
import { scoreTenths } from "./engines";
import type { ExamQuestionShared as ExamQuestion } from "@icu/schemas/working-exam";

export type { ExamQuestionShared as ExamQuestion, ExamTopicShared as ExamTopic } from "@icu/schemas/working-exam";

export const COUNT_PRESETS = [10, 20, 30] as const;
export const MINUTES_PER_QUESTION = 1.2;
export const timeLimitSecondsFor = (questionCount: number): number => Math.round(questionCount * MINUTES_PER_QUESTION * 60);

export interface TopicResult { category: string; total: number; correct: number }
export interface ExamResult { total: number; correct: number; unanswered: number; scoreTenths: number; topics: TopicResult[]; gaps: ExamQuestion[] }

export function computeExamResult(questions: ExamQuestion[], answers: Record<string, number>): ExamResult {
  const byCategory = new Map<string, TopicResult>();
  let correct = 0;
  let unanswered = 0;
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

// 833 -> "83.3", matching src/lib/question-bank/score.ts's tenthsToPercentString exactly.
export const tenthsToPercentString = (tenths: number): string => `${Math.floor(tenths / 10)}.${tenths % 10}`;

export const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(m)}:${pad(s % 60)}`;
};

// Anchors the countdown to the server clock (startedAt + timeLimitSeconds, skewed by the
// difference between the device clock and the server's own "now") so a wrong device clock
// cannot extend the exam - identical reasoning to exam-runner.tsx's deadline/skew calculation.
export const remainingSeconds = (startedAt: string, timeLimitSeconds: number, serverNow: string, deviceNow: number): number => {
  const skew = Date.parse(serverNow) - deviceNow;
  const deadline = Date.parse(startedAt) + timeLimitSeconds * 1000;
  return (deadline - (deviceNow + skew)) / 1000;
};
