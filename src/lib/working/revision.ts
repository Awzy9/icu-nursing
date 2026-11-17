import { daysForBox, dueAfter, nextBox } from "@/lib/question-bank/leitner";
import type { Attempt } from "./activity-types";

// A question description with no attempt-dependent state - safe to pass from server to client as plain data.
export interface RevisionQuestion { id: string; prompt: string; options: string[]; answer: number; explanation: string; moduleKey: string; moduleTitle: string; moduleHref: string }

export interface RevisionStatus { question: RevisionQuestion; isNew: boolean; isDue: boolean; dueAt: number | null; box: number }
export interface RevisionQueue { due: RevisionStatus[]; upcoming: RevisionStatus[]; nextDueAt: number | null; totalQuestions: number; totalAttempted: number }

// Deterministic: the same rule as public.working_record_attempt (reusing private.leitner_next_box /
// private.leitner_days). A question never attempted is always due. A missed question re-enters at
// box 1, due immediately. A correct answer only comes due again after the box's fixed interval.
export function computeRevisionQueue(questions: RevisionQuestion[], attempts: Attempt[], now = Date.now()): RevisionQueue {
  const byId = new Map(attempts.map((a) => [a.id, a]));
  const statuses: RevisionStatus[] = questions.map((question) => {
    const a = byId.get(question.id);
    if (!a) return { question, isNew: true, isDue: true, dueAt: null, box: 1 };
    const dueAt = dueAfter(a.box ?? 1, new Date(a.at)).getTime();
    return { question, isNew: false, isDue: dueAt <= now, dueAt, box: a.box ?? 1 };
  });
  // Within the due queue, a real mistake takes priority over content never attempted yet: when a
  // session is capped (only the most-overdue N shown), what you actually got wrong should surface
  // before material you simply haven't reached.
  const due = statuses.filter((s) => s.isDue).sort((a, b) => Number(a.isNew) - Number(b.isNew) || (a.dueAt ?? 0) - (b.dueAt ?? 0));
  const upcoming = statuses.filter((s) => !s.isDue).sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
  return { due, upcoming, nextDueAt: upcoming[0]?.dueAt ?? null, totalQuestions: questions.length, totalAttempted: attempts.length };
}

export { daysForBox, dueAfter, nextBox };
