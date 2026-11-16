/**
 * Deterministic spaced-repetition schedule (Leitner boxes). Mirrors private.leitner_next_box / private.leitner_days in
 * supabase/migrations/0008_study_modes.sql, and is cross-tested against the database.
 *   wrong answer   -> box 1, due immediately
 *   correct answer -> one box up (new questions enter at box 1), capped at box 5
 *   next review after box 1: 0 days, 2: 1 day, 3: 3 days, 4: 7 days, 5: 14 days
 */
export const LEITNER_DAYS = [0, 0, 1, 3, 7, 14] as const; // index = box (index 0 unused)
export const MAX_BOX = 5;

export const nextBox = (box: number, correct: boolean): number => (correct ? Math.min(Math.max(box, 0) + 1, MAX_BOX) : 1);
export const daysForBox = (box: number): number => LEITNER_DAYS[Math.max(1, Math.min(box, MAX_BOX))]!;
export const dueAfter = (box: number, from: Date): Date => new Date(from.getTime() + daysForBox(box) * 86_400_000);
