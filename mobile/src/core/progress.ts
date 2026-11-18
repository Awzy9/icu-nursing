// Local learning state (bookmarks, visited lessons, ticked checklist steps, finished cases,
// practice results, resumable quiz/scenario sessions). Pure functions plus a tiny storage
// interface. This is the guest (offline, on-device) copy; when signed in, the same events are
// additionally sent to the account-sync RPCs in ../api/rpc.ts, mirroring the web app's own
// dual guest/account model (src/components/working/progress.tsx).
import { z } from "zod";

// Real catalog keys: topics D01-T19, skills SK-18, medications MD-15, cases SC-10,
// equipment EQ-01, practice PX-01 (see src/lib/working/index.ts's workingTypes and
// src/lib/working/model.ts's WorkingEntry.key, matched by the website's own workingEntry()
// validator: /^[A-Z0-9-]+$/).
const BOOKMARK_KIND = ["topics", "skills", "medications", "cases", "equipment", "practice"] as const;
export type BookmarkKind = (typeof BOOKMARK_KIND)[number];
const bookmarkKeyPattern = new RegExp(`^(${BOOKMARK_KIND.join("|")}):[A-Z0-9-]{1,40}$`);

const sessionRecordSchema = z.object({
  kind: z.enum(["quiz", "scenario"]),
  version: z.string().max(40),
  position: z.number().int().min(0),
  score: z.number(),
  finished: z.boolean(),
  at: z.string(),
});
export type SessionRecord = z.infer<typeof sessionRecordSchema>;

export const progressSchema = z.object({
  v: z.literal(2),
  bookmarks: z.array(z.string().regex(bookmarkKeyPattern)).max(500),
  viewed: z.array(z.string().regex(/^[A-Z0-9-]{1,40}$/)).max(500),
  ticks: z.record(z.string(), z.array(z.number().int().min(0).max(199)).max(200)),
  cases: z.record(z.string(), z.object({ scoreTenths: z.number().int().min(0).max(1000), at: z.string() })),
  practice: z.array(z.object({ right: z.number().int().min(0), total: z.number().int().min(1), at: z.string() })).max(100),
  sessions: z.record(z.string(), sessionRecordSchema),
});
export type Progress = z.infer<typeof progressSchema>;
export const emptyProgress = (): Progress => ({ v: 2, bookmarks: [], viewed: [], ticks: {}, cases: {}, practice: [], sessions: {} });

export const bookmarkKey = (kind: BookmarkKind, key: string): string => `${kind}:${key}`;
export const toggleBookmark = (p: Progress, key: string): Progress => ({ ...p, bookmarks: p.bookmarks.includes(key) ? p.bookmarks.filter((k) => k !== key) : p.bookmarks.length >= 500 ? p.bookmarks : [...p.bookmarks, key] });
export const markViewed = (p: Progress, key: string): Progress => (p.viewed.includes(key) || p.viewed.length >= 500 ? p : { ...p, viewed: [...p.viewed, key] });
export const toggleTick = (p: Progress, code: string, index: number): Progress => { const cur = p.ticks[code] ?? []; return { ...p, ticks: { ...p.ticks, [code]: cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index].sort((a, b) => a - b) } }; };
export const recordCase = (p: Progress, code: string, scoreTenths: number, at: string): Progress => ({ ...p, cases: { ...p.cases, [code]: { scoreTenths: Math.max(scoreTenths, p.cases[code]?.scoreTenths ?? 0), at } } });
export const recordPractice = (p: Progress, right: number, total: number, at: string): Progress => ({ ...p, practice: [...p.practice, { right, total, at }].slice(-100) });
export const viewedCount = (p: Progress): number => p.viewed.length;

// Resumable session state (an in-progress quiz or branching case). A case or quiz in progress
// is saved here; finishing it clears the entry (recordCase/recordPractice already captured the
// result) so the learner is not offered to "resume" something already complete.
export const saveSession = (p: Progress, moduleKey: string, session: SessionRecord): Progress => (session.finished ? discardSession(p, moduleKey) : { ...p, sessions: { ...p.sessions, [moduleKey]: session } });
export const discardSession = (p: Progress, moduleKey: string): Progress => { if (!(moduleKey in p.sessions)) return p; const sessions = { ...p.sessions }; delete sessions[moduleKey]; return { ...p, sessions }; };
export const getSession = (p: Progress, moduleKey: string): SessionRecord | undefined => p.sessions[moduleKey];

export interface KeyValueStore { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void>; remove(key: string): Promise<void> }
const KEY = "icu.progress.v2";
const LEGACY_KEY = "icu.progress.v1";
/** A corrupt, foreign or old-schema value never crashes the app: it is ignored and the learner starts empty rather than seeing a broken screen. */
export async function loadProgress(store: KeyValueStore): Promise<Progress> {
  try {
    const raw = await store.get(KEY);
    if (raw) { const r = progressSchema.safeParse(JSON.parse(raw)); if (r.success) return r.data; }
    // The v1 schema (SYN-only bookmarks, equipment-part "viewed" map) cannot be meaningfully
    // migrated to real content keys; a learner moving from an old build starts fresh rather
    // than carrying over bookmarks that no longer resolve to anything.
    await store.remove(LEGACY_KEY).catch(() => undefined);
    return emptyProgress();
  } catch { return emptyProgress(); }
}
export const saveProgress = (store: KeyValueStore, p: Progress): Promise<void> => store.set(KEY, JSON.stringify(p));
export const clearProgress = (store: KeyValueStore): Promise<void> => store.remove(KEY);
