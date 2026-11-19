// Pure spaced-revision queue logic, mirroring src/lib/working/revision.ts's
// computeRevisionQueue exactly (same due/new/sort rules), adapted to read from the local
// Progress.attempts record (core/progress.ts) instead of a flat attempts list, since mobile
// already keys attempts by question id.
import { dueAfter } from "./leitner";
import type { Progress } from "./progress";
import type { RevisionQuestionShared } from "@icu/schemas/working-revision";

export type { RevisionQuestionShared as RevisionQuestion } from "@icu/schemas/working-revision";

export interface RevisionStatus { question: RevisionQuestionShared; isNew: boolean; isDue: boolean; dueAt: number | null; box: number }
export interface RevisionQueue { due: RevisionStatus[]; upcoming: RevisionStatus[]; nextDueAt: number | null; totalQuestions: number; totalAttempted: number }

export function computeRevisionQueue(questions: RevisionQuestionShared[], attempts: Progress["attempts"], now = Date.now()): RevisionQueue {
  const statuses: RevisionStatus[] = questions.map((question) => {
    const a = attempts[question.id];
    if (!a) return { question, isNew: true, isDue: true, dueAt: null, box: 1 };
    const dueAt = dueAfter(a.box, Date.parse(a.at));
    return { question, isNew: false, isDue: dueAt <= now, dueAt, box: a.box };
  });
  // A real mistake takes priority over content never attempted yet: when a session is capped
  // (only the most-overdue N shown), what was actually gotten wrong should surface before
  // material simply not yet reached.
  const due = statuses.filter((s) => s.isDue).sort((a, b) => Number(a.isNew) - Number(b.isNew) || (a.dueAt ?? 0) - (b.dueAt ?? 0));
  const upcoming = statuses.filter((s) => !s.isDue).sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
  return { due, upcoming, nextDueAt: upcoming[0]?.dueAt ?? null, totalQuestions: questions.length, totalAttempted: Object.keys(attempts).length };
}
