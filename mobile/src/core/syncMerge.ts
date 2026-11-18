// Pure merge logic for pulling a signed-in learner's existing account progress into local state
// on sign-in (so progress made on another device appears here too). Kept separate from the React
// hook (hooks/useProgressSync.ts) so it is unit-testable without React or a Supabase client.
import type { BookmarkKind, Progress, SessionRecord } from "./progress";
import type { BookmarkRow, LessonRow, SessionRow } from "@icu/schemas/working-progress";

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
    if (row.finished) continue; // a finished remote session has nothing to resume locally either
    const existing = sessions[row.module_key];
    const remoteAt = Date.parse(row.updated_at);
    if (existing && Date.parse(existing.at) >= remoteAt) continue;
    const record: SessionRecord = { kind: row.kind, version: row.version, position: row.position, score: row.score, finished: row.finished, at: row.updated_at };
    sessions = { ...sessions, [row.module_key]: record };
    changed = true;
  }
  return changed ? { ...local, sessions } : local;
}

/** Unions remote-complete lesson rows into local.completed. A remote row with completed=false is not unmarked locally (no authoritative "last writer wins" timestamp exists for this field): the merge only ever adds, consistent with every other merge here never destroying local-only progress. */
export function mergeRemoteCompleted(local: Progress, remote: LessonRow[]): Progress {
  const merged = new Set(local.completed);
  for (const row of remote) if (row.completed) merged.add(row.module_key);
  return merged.size === local.completed.length ? local : { ...local, completed: [...merged] };
}
