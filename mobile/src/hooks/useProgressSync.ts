// Combines local (on-device, guest-safe) progress with the account-owned Supabase sync, mirroring
// the website's own dual guest/signed-in model (src/components/working/progress.tsx): every
// action updates local state immediately (so the app works fully offline and for guests), and
// additionally fires the matching RPC when signed in. Remote writes are best-effort: a failure
// is swallowed (not re-thrown) so a flaky connection never blocks the learner's own device state
// from updating - this matches "guest progress should persist after relaunch" taking priority
// over the sync itself.
import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "../auth/provider";
import {
  discardSession as localDiscardSession, recordAttempt as localRecordAttempt, saveSession as localSaveSession, setComplete as localSetComplete, toggleBookmark as localToggleBookmark,
  type BookmarkKind, type Progress, type SessionRecord,
} from "../core/progress";
import { mergeRemoteAttempts, mergeRemoteBookmarks, mergeRemoteCompleted, mergeRemoteSessions } from "../core/syncMerge";
import { useApp } from "../state/app";
import { useCatalogList } from "./useRemoteContent";

/** Lightweight: the action functions screens call. Does not itself fetch the catalog - cheap to use in many places (e.g. every BookmarkButton). */
export function useProgressSync() {
  const { progress, update } = useApp();
  const { rpc, email } = useAuth();
  const signedIn = !!(rpc && email);

  const toggleBookmark = useCallback((kindKey: string) => {
    const willBeOn = !progress.bookmarks.includes(kindKey);
    update((p: Progress) => localToggleBookmark(p, kindKey));
    if (signedIn) { const moduleKey = kindKey.split(":")[1] ?? kindKey; void rpc!.setWorkingBookmark(moduleKey, willBeOn).catch(() => undefined); }
  }, [progress.bookmarks, update, rpc, signedIn]);

  const saveSession = useCallback((moduleKey: string, session: SessionRecord) => {
    update((p: Progress) => localSaveSession(p, moduleKey, session));
    if (signedIn) void rpc!.saveWorkingSession(moduleKey, session.kind, session.version, session.position, session.score, session.finished, Date.parse(session.at), session.decisions).catch(() => undefined);
  }, [update, rpc, signedIn]);

  const discardSession = useCallback((moduleKey: string) => {
    const at = new Date().toISOString();
    update((p: Progress) => localDiscardSession(p, moduleKey, at));
    if (signedIn) void rpc!.discardWorkingSession(moduleKey).catch(() => undefined);
  }, [update, rpc, signedIn]);

  const recordAnswer = useCallback((questionId: string, moduleKey: string, choice: number, correct: boolean, at: number) => {
    // Always recorded locally (guest and signed-in alike) so the spaced-revision queue
    // (core/revision.ts) reflects it immediately, mirroring the website's own recordAttempt.
    update((p: Progress) => localRecordAttempt(p, questionId, correct, new Date(at).toISOString()));
    if (signedIn) void rpc!.recordWorkingAttempt(questionId, moduleKey, choice, correct, at).catch(() => undefined);
  }, [update, rpc, signedIn]);

  const setComplete = useCallback((moduleKey: string, done: boolean) => {
    update((p: Progress) => localSetComplete(p, moduleKey, done));
    if (signedIn) void rpc!.setWorkingLessonComplete(moduleKey, done).catch(() => undefined);
  }, [update, rpc, signedIn]);

  return { toggleBookmark, saveSession, discardSession, recordAnswer, setComplete, signedIn };
}

/**
 * Mounted ONCE at the app root (app/_layout.tsx), not per-screen: on sign-in, pulls the account's
 * existing bookmarks and sessions and merges them into local state, so progress made on another
 * device shows up here too. Separate from useProgressSync so ordinary screens don't each trigger
 * their own catalog fetch just to render a bookmark button.
 */
export function useProgressPullOnSignIn() {
  const { update, ready } = useApp();
  const { rpc, email } = useAuth();
  const signedIn = !!(rpc && email);
  const catalog = useCatalogList();
  const catalogEntries = catalog.status === "ready" ? catalog.data : null;
  const lastSyncedEmail = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !signedIn || !rpc || email === lastSyncedEmail.current || !catalogEntries) return;
    let cancelled = false;
    (async () => {
      const kindOf = new Map<string, BookmarkKind>(catalogEntries.map((e) => [e.key, e.type as BookmarkKind]));
      const [bookmarks, sessions, lessons, attempts] = await Promise.all([rpc.listWorkingBookmarks().catch(() => []), rpc.listWorkingSessions().catch(() => []), rpc.listWorkingLessons().catch(() => []), rpc.listWorkingAttempts().catch(() => [])]);
      if (!cancelled) {
        lastSyncedEmail.current = email;
        update((p) => mergeRemoteAttempts(mergeRemoteCompleted(mergeRemoteSessions(mergeRemoteBookmarks(p, bookmarks, kindOf), sessions), lessons), attempts));
      }
    })().catch(() => undefined);
    return () => { cancelled = true; };
  }, [ready, signedIn, rpc, email, catalogEntries, update]);
  useEffect(() => { if (!signedIn) lastSyncedEmail.current = null; }, [signedIn]);
}
