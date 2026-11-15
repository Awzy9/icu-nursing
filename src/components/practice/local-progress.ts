"use client";
// Per-device practice progress (never sent anywhere). Wrapped so a blocked or full localStorage never breaks a page.
const KEY = "icu.practice.v1";
export interface PracticeLocal { done: Record<string, { correct: number; total: number; at: number }>; levels: Record<string, string> }
const empty = (): PracticeLocal => ({ done: {}, levels: {} });
export function readLocal(): PracticeLocal {
  try {
    const raw = window.localStorage.getItem(KEY); if (!raw) return empty();
    const v = JSON.parse(raw) as Partial<PracticeLocal>;
    return { done: typeof v.done === "object" && v.done ? v.done : {}, levels: typeof v.levels === "object" && v.levels ? v.levels : {} };
  } catch { return empty(); }
}
export function writeLocal(fn: (p: PracticeLocal) => PracticeLocal): PracticeLocal {
  const next = fn(readLocal());
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable: the page still works for this visit */ }
  return next;
}
export function clearLocal() { try { window.localStorage.removeItem(KEY); } catch { /* ignore */ } }
