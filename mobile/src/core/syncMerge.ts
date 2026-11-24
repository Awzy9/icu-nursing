// Pure merge logic for pulling a signed-in learner's existing account progress into local state
// on sign-in (so progress made on another device appears here too). Kept separate from the React
// hook (hooks/useProgressSync.ts) so it is unit-testable without React or a Supabase client.
import type { BookmarkKind, Progress, SessionRecord } from "./progress";
import { scenarioDecisionHistorySchema, type AttemptRow, type BookmarkRow, type LessonRow, type SessionRow } from "@icu/schemas/working-progress";

/** Resolves each remote bookmark row's module_key to a local "kind:key" string via a key->kind lookup (built from the catalog). Rows for an unknown key are dropped rather than guessed. */
export function mergeRemoteBookmarks(local: Progress, remote: BookmarkRow[], kindOf: Map<string, BookmarkKind>): Progress {
  const merged = new Set(local.bookmarks);
  for (const row of remote) {
    const kind = kindOf.get(row.module_key);
    if (kind) merged.add(`${kind}:${row.module_key}`);
  }
  return merged.size === local.bookmarks.length ? local : { ...local, bookmarks: [...merged] };
}

/** A remote session only overwrites a local one when it is strictly newer (by updated_at) - an older read from a slow network must never revive a local session that was already finished/discarded. */
export function mergeRemoteSessions(local: Progress, remote: SessionRow[]): Progress {
  let sessions = local.sessions;
  let changed = false;
  for (const row of remote) {
    const existing = sessions[row.module_key];
    const remoteAt = Date.parse(row.updated_at);
    if (!Number.isFinite(remoteAt)) continue;
    if (existing && Date.parse(existing.at) >= remoteAt) continue;
    if (row.finished) {
      // A newer completed attempt supersedes an older unfinished local attempt.
      // Do not store a resumable record for a finished remote row.
      if (existing) {
        sessions = { ...sessions };
        delete sessions[row.module_key];
        changed = true;
      }
      continue;
    }
    const record: SessionRecord = { kind: row.kind, version: row.version, position: row.position, score: row.score, finished: row.finished, at: row.updated_at };
    // The winning row owns its history. Never combine choices from different attempts,
    // even if their positions and cumulative scores happen to match.
    if (row.kind === "scenario") {
      const parsed = scenarioDecisionHistorySchema.safeParse(row.decisions);
      if (parsed.success) record.decisions = parsed.data;
    }
    sessions = { ...sessions, [row.module_key]: record };
    changed = true;
  }
  return changed ? { ...local, sessions } : local;
}

/** A remote attempt row only overwrites a local one when it is strictly newer (by answered_at) -
 * same "newer wins" rule as sessions. The server computes box authoritatively
 * (public.working_record_attempt), so a winning remote row's box is trusted as-is rather than
 * being recomputed locally. */
export function mergeRemoteAttempts(local: Progress, remote: AttemptRow[]): Progress {
  let attempts = local.attempts;
  let changed = false;
  for (const row of remote) {
    const existing = attempts[row.question_id];
    if (existing && existing.at >= row.answered_at) continue;
    attempts = { ...attempts, [row.question_id]: { correct: row.correct, at: row.answered_at, box: row.box } };
    changed = true;
  }
  return changed ? { ...local, attempts } : local;
}

/** Unions remote-complete lesson rows into local.completed. A remote row with completed=false is not unmarked locally (no authoritative "last writer wins" timestamp exists for this field): the merge only ever adds, consistent with every other merge here never destroying local-only progress. */
export function mergeRemoteCompleted(local: Progress, remote: LessonRow[]): Progress {
  const merged = new Set(local.completed);
  for (const row of remote) if (row.completed) merged.add(row.module_key);
  return merged.size === local.completed.length ? local : { ...local, completed: [...merged] };
}
