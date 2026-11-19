// Deterministic spaced-repetition schedule (Leitner boxes), mirroring
// src/lib/question-bank/leitner.ts exactly (same constants, same formulas), so a device's
// locally-computed box always matches what the server computes in working_record_attempt.
export const LEITNER_DAYS = [0, 0, 1, 3, 7, 14] as const; // index = box (index 0 unused)
export const MAX_BOX = 5;

export const nextBox = (box: number, correct: boolean): number => (correct ? Math.min(Math.max(box, 0) + 1, MAX_BOX) : 1);
export const daysForBox = (box: number): number => LEITNER_DAYS[Math.max(1, Math.min(box, MAX_BOX))]!;
export const dueAfter = (box: number, fromMs: number): number => fromMs + daysForBox(box) * 86_400_000;
