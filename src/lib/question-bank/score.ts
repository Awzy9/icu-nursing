/** Percentage in tenths (0-1000), rounded half up with integer arithmetic (identical to private.score_tenths in SQL). */
export function scoreTenths(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.floor((2000 * correct + total) / (2 * total));
}

export interface ScorableItem {
  voided: boolean;
  selectedOptionId: string | null;
  correctOptionId: string;
}

/** Deterministic scoring. Unanswered items count as incorrect; voided items (withdrawn before being answered) are excluded. */
export function scoreAttempt(items: readonly ScorableItem[]) {
  const live = items.filter((i) => !i.voided);
  const correct = live.filter((i) => i.selectedOptionId !== null && i.selectedOptionId === i.correctOptionId).length;
  const answered = live.filter((i) => i.selectedOptionId !== null).length;
  return { total: live.length, correct, answered, unanswered: live.length - answered, scoreTenths: scoreTenths(correct, live.length) };
}

/** 833 -> "83.3" (always one decimal so it never depends on the locale's number formatter for correctness). */
export const tenthsToPercentString = (tenths: number) => `${Math.floor(tenths / 10)}.${tenths % 10}`;
