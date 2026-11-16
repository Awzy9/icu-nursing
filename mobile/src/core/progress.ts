// Local learning state (bookmarks, viewed diagram parts, ticked checklist steps, finished cases, practice results). Pure functions plus a tiny storage interface.
import { z } from "zod";

export const progressSchema = z.object({
  v: z.literal(1),
  bookmarks: z.array(z.string().regex(/^(equipment|skill|medication|case):SYN-[A-Z]+-\d{3}$/)).max(200),
  viewed: z.record(z.string(), z.array(z.string().regex(/^[a-z]{1,24}$/)).max(8)),
  ticks: z.record(z.string(), z.array(z.number().int().min(0).max(99)).max(100)),
  cases: z.record(z.string(), z.object({ scoreTenths: z.number().int().min(0).max(1000), at: z.string() })),
  practice: z.array(z.object({ right: z.number().int().min(0), total: z.number().int().min(1), at: z.string() })).max(50),
});
export type Progress = z.infer<typeof progressSchema>;
export const emptyProgress = (): Progress => ({ v: 1, bookmarks: [], viewed: {}, ticks: {}, cases: {}, practice: [] });

export const toggleBookmark = (p: Progress, key: string): Progress => ({ ...p, bookmarks: p.bookmarks.includes(key) ? p.bookmarks.filter((k) => k !== key) : p.bookmarks.length >= 200 ? p.bookmarks : [...p.bookmarks, key] });
export const markViewed = (p: Progress, code: string, part: string): Progress => { const cur = p.viewed[code] ?? []; return cur.includes(part) || cur.length >= 8 ? p : { ...p, viewed: { ...p.viewed, [code]: [...cur, part] } }; };
export const toggleTick = (p: Progress, code: string, index: number): Progress => { const cur = p.ticks[code] ?? []; return { ...p, ticks: { ...p.ticks, [code]: cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index].sort((a, b) => a - b) } }; };
export const recordCase = (p: Progress, code: string, scoreTenths: number, at: string): Progress => ({ ...p, cases: { ...p.cases, [code]: { scoreTenths: Math.max(scoreTenths, p.cases[code]?.scoreTenths ?? 0), at } } });
export const recordPractice = (p: Progress, right: number, total: number, at: string): Progress => ({ ...p, practice: [...p.practice, { right, total, at }].slice(-50) });
export const viewedCount = (p: Progress): number => Object.values(p.viewed).reduce((n, a) => n + a.length, 0);

export interface KeyValueStore { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void>; remove(key: string): Promise<void> }
const KEY = "icu.progress.v1";
/** A corrupt or foreign value never crashes the app: it is ignored and the learner starts empty. */
export async function loadProgress(store: KeyValueStore): Promise<Progress> {
  try { const raw = await store.get(KEY); if (!raw) return emptyProgress(); const r = progressSchema.safeParse(JSON.parse(raw)); return r.success ? r.data : emptyProgress(); } catch { return emptyProgress(); }
}
export const saveProgress = (store: KeyValueStore, p: Progress): Promise<void> => store.set(KEY, JSON.stringify(p));
export const clearProgress = (store: KeyValueStore): Promise<void> => store.remove(KEY);
