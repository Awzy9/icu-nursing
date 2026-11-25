// Local learning state (bookmarks, visited lessons, ticked checklist steps, finished cases,
// practice results, resumable quiz/scenario sessions). Pure functions plus a tiny storage
// interface. This is the guest (offline, on-device) copy; when signed in, the same events are
// additionally sent to the account-sync RPCs in ../api/rpc.ts, mirroring the web app's own
// dual guest/account model (src/components/working/progress.tsx).
import { z } from "zod";
import { scenarioDecisionHistorySchema } from "@icu/schemas/working-progress";
import { nextBox } from "./leitner";

// Real catalog keys: topics D01-T19, skills SK-18, medications MD-15, cases SC-10,
// equipment EQ-01, practice PX-01 (see src/lib/working/index.ts's workingTypes and
// src/lib/working/model.ts's WorkingEntry.key, matched by the website's own workingEntry()
// validator: /^[A-Z0-9-]+$/).
const BOOKMARK_KIND = ["topics", "skills", "medications", "cases", "equipment", "practice"] as const;
export type BookmarkKind = (typeof BOOKMARK_KIND)[number];
const bookmarkKeyPattern = new RegExp(`^(${BOOKMARK_KIND.join("|")}):[A-Z0-9-]{1,40}$`);

const sessionRecordSchema = z.object({
  kind: z.enum(["quiz", "scenario"]),
  // Match the account database limit; accept older long revision strings so unrelated progress survives hydration.
  version: z.string().max(2000),
  position: z.number().int().min(0),
  score: z.number(),
  finished: z.boolean(),
  at: z.string(),
  // Local-only history for comparison panels when resuming a branching case.
  // Optional so previously saved v2 sessions and remote RPC rows still parse.
  visited: z.array(z.number().int().min(0)).max(100).optional(),
  // Optional local decision history; old sessions and remote rows remain readable.
  decisions: scenarioDecisionHistorySchema.optional().catch(undefined),
});
export type SessionRecord = z.infer<typeof sessionRecordSchema>;

// Per-question spaced-revision record: question id -> whether it was last answered correctly,
// when, and the Leitner box that answer put it in. Mirrors the website's own guest storage
// exactly (src/components/working/progress.tsx's recordAttempt/localStorage model) and the
// server's working_attempts table/public.working_record_attempt, so a device's locally-computed
// box always agrees with what the server would compute from the same answer.
const attemptEntrySchema = z.object({ correct: z.boolean(), at: z.string(), box: z.number().int().min(1).max(5) });
export type AttemptEntry = z.infer<typeof attemptEntrySchema>;

export const progressSchema = z.object({
  v: z.literal(2),
  bookmarks: z.array(z.string().regex(bookmarkKeyPattern)).max(500),
  viewed: z.array(z.string().regex(/^[A-Z0-9-]{1,40}$/)).max(500),
  // .default([]) so existing on-device v2 data saved before this field existed still parses
  // (rather than being discarded as "old schema") instead of forcing a schema version bump.
  completed: z.array(z.string().regex(/^[A-Z0-9-]{1,40}$/)).max(500).default([]),
  ticks: z.record(z.string(), z.array(z.number().int().min(0).max(199)).max(200)),
  cases: z.record(z.string(), z.object({ scoreTenths: z.number().int().min(0).max(1000), at: z.string() })),
  practice: z.array(z.object({ right: z.number().int().min(0), total: z.number().int().min(1), at: z.string() })).max(100),
  sessions: z.record(z.string(), sessionRecordSchema),
  // Optional for legacy v2 storage. Keep only timestamps, never discarded answers.
  sessionDismissals: z.record(z.string(), z.string()).optional(),
  // .default({}) for the same reason as `completed` above: existing on-device v2 data saved
  // before this field existed must still parse.
  attempts: z.record(z.string().regex(/^[A-Z0-9-]{1,60}$/), attemptEntrySchema).default({}),
});
export type Progress = z.infer<typeof progressSchema>;
export const emptyProgress = (): Progress => ({ v: 2, bookmarks: [], viewed: [], completed: [], ticks: {}, cases: {}, practice: [], sessions: {}, attempts: {} });

export const bookmarkKey = (kind: BookmarkKind, key: string): string => `${kind}:${key}`;
export const toggleBookmark = (p: Progress, key: string): Progress => ({ ...p, bookmarks: p.bookmarks.includes(key) ? p.bookmarks.filter((k) => k !== key) : p.bookmarks.length >= 500 ? p.bookmarks : [...p.bookmarks, key] });
export const markViewed = (p: Progress, key: string): Progress => (p.viewed.includes(key) || p.viewed.length >= 500 ? p : { ...p, viewed: [...p.viewed, key] });
export const setComplete = (p: Progress, key: string, done: boolean): Progress => { const has = p.completed.includes(key); if (done === has) return p; return { ...p, completed: done ? (p.completed.length >= 500 ? p.completed : [...p.completed, key]) : p.completed.filter((k) => k !== key) }; };
export const toggleTick = (p: Progress, code: string, index: number): Progress => { const cur = p.ticks[code] ?? []; return { ...p, ticks: { ...p.ticks, [code]: cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index].sort((a, b) => a - b) } }; };
export const recordCase = (p: Progress, code: string, scoreTenths: number, at: string): Progress => ({ ...p, cases: { ...p.cases, [code]: { scoreTenths: Math.max(scoreTenths, p.cases[code]?.scoreTenths ?? 0), at } } });
export const recordPractice = (p: Progress, right: number, total: number, at: string): Progress => ({ ...p, practice: [...p.practice, { right, total, at }].slice(-100) });
export const viewedCount = (p: Progress): number => p.viewed.length;

// Records a question attempt and advances its Leitner box from whatever box it was last in
// (missed -> box 1, due immediately; correct -> one box up, capped at 5), exactly mirroring the
// website's recordAttempt. `at` already wins ties the same way elsewhere in this module (no
// going backwards from a more recent attempt).
export const recordAttempt = (p: Progress, questionId: string, correct: boolean, at: string): Progress => {
  const existing = p.attempts[questionId];
  if (existing && existing.at > at) return p;
  return { ...p, attempts: { ...p.attempts, [questionId]: { correct, at, box: nextBox(existing?.box ?? 1, correct) } } };
};

// Resumable session state (an in-progress quiz or branching case). A case or quiz in progress
// is saved here; finishing it clears the entry (recordCase/recordPractice already captured the
// result) so the learner is not offered to "resume" something already complete.
export const saveSession = (p: Progress, moduleKey: string, session: SessionRecord): Progress => {
  const at = Date.parse(session.at);
  if (!Number.isFinite(at)) return p;
  const existingAt = Date.parse(p.sessions[moduleKey]?.at ?? "");
  const dismissedAt = Date.parse(p.sessionDismissals?.[moduleKey] ?? "");
  if (existingAt > at || dismissedAt >= at) return p;
  if (session.finished) return discardSession(p, moduleKey, session.at);
  return { ...p, sessions: { ...p.sessions, [moduleKey]: session } };
};
export const discardSession = (p: Progress, moduleKey: string, at = new Date().toISOString()): Progress => {
  const timestamp = Date.parse(at);
  if (!Number.isFinite(timestamp)) return p;
  const existingAt = Date.parse(p.sessions[moduleKey]?.at ?? "");
  const dismissedAt = Date.parse(p.sessionDismissals?.[moduleKey] ?? "");
  if (existingAt > timestamp || dismissedAt >= timestamp) return p;
  const sessions = { ...p.sessions };
  delete sessions[moduleKey];
  return { ...p, sessions, sessionDismissals: { ...p.sessionDismissals, [moduleKey]: at } };
};
export const getSession = (p: Progress, moduleKey: string): SessionRecord | undefined => p.sessions[moduleKey];

export interface KeyValueStore { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void>; remove(key: string): Promise<void> }
const KEY = "icu.progress.v2";
const LEGACY_KEY = "icu.progress.v1";
/** Guest history keeps its existing key; account history is isolated per authenticated user.
 * Never use email as a storage prefix (it is changeable and exposes personally identifying text).
 */
export function scopedProgressStore(base: KeyValueStore, userId: string | null): KeyValueStore {
  if (!userId) return base;
  const prefix = `icu.user.${userId}:`;
  return {
    get: (key) => base.get(prefix + key),
    set: (key, value) => base.set(prefix + key, value),
    remove: (key) => base.remove(prefix + key),
  };
}

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
