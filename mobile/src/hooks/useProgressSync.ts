// Combines local (on-device, guest-safe) progress with the account-owned Supabase sync, mirroring
// the website's own dual guest/signed-in model (src/components/working/progress.tsx): every
// action updates local state immediately (so the app works fully offline and for guests), and
// additionally syncs signed-in progress. Bookmark and completion desired states are persisted
// and retried; attempts and sessions still use the existing best-effort RPC paths.
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { acknowledgeFlag, applyPendingFlags, queueFlag } from "../core/pendingFlags";
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
  const { update } = useApp();
  const { rpc, userId } = useAuth();
  const signedIn = !!(rpc && userId);

  const toggleBookmark = useCallback((kindKey: string) => {
    update((p: Progress) => {
      const next = localToggleBookmark(p, kindKey);
      const desired = next.bookmarks.includes(kindKey);
      return signedIn && desired !== p.bookmarks.includes(kindKey) ? queueFlag(next, "bookmark", kindKey, desired) : next;
    });
  }, [update, signedIn]);

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
    update((p: Progress) => {
      const next = localSetComplete(p, moduleKey, done);
      return signedIn && next.completed.includes(moduleKey) === done ? queueFlag(next, "complete", moduleKey, done) : next;
    });
  }, [update, signedIn]);

  return { toggleBookmark, saveSession, discardSession, recordAnswer, setComplete, signedIn };
}

/**
 * Mounted ONCE at the app root (app/_layout.tsx), not per-screen: on sign-in, pulls the account's
 * existing bookmarks and sessions and merges them into local state, so progress made on another
 * device shows up here too. Separate from useProgressSync so ordinary screens don't each trigger
 * their own catalog fetch just to render a bookmark button.
 */
export function useProgressPullOnSignIn() {
  const { update, ready, progress } = useApp();
  const { rpc, userId } = useAuth();
  const catalog = useCatalogList();
  const catalogEntries = catalog.status === "ready" ? catalog.data : null;
  const latest = useRef(progress);
  latest.current = progress;
  const busy = useRef(false);
  const trigger = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!ready || !userId || !rpc) return;
    let cancelled = false;
    let lastPull = 0;
    const run = async () => {
      if (cancelled || busy.current || AppState.currentState === "background") return;
      busy.current = true;
      try {
        const pending = Object.values(latest.current.pendingFlags ?? {});
        for (const flag of pending) {
          if (cancelled) return;
          try {
            if (flag.kind === "bookmark") {
              const moduleKey = flag.key.split(":")[1];
              if (!moduleKey) continue;
              await rpc.setWorkingBookmark(moduleKey, flag.value, userId);
            } else {
              await rpc.setWorkingLessonComplete(flag.key, flag.value, userId);
            }
            if (!cancelled) update(p => acknowledgeFlag(p, flag));
          } catch { /* retain intent for the next foreground or scheduled retry */ }
        }
        if (cancelled || pending.length || !catalogEntries || Date.now() - lastPull < 60000) return;
        const kindOf = new Map<string, BookmarkKind>(catalogEntries.map(e => [e.key, e.type as BookmarkKind]));
        const [bookmarks, sessions, lessons, attempts] = await Promise.all([
          rpc.listWorkingBookmarks(), rpc.listWorkingSessions(), rpc.listWorkingLessons(), rpc.listWorkingAttempts(),
        ]);
        if (!cancelled) {
          lastPull = Date.now();
          update(p => applyPendingFlags(mergeRemoteAttempts(mergeRemoteCompleted(mergeRemoteSessions(mergeRemoteBookmarks(p, bookmarks, kindOf), sessions), lessons), attempts)));
        }
      } catch { /* retry the incomplete account pull; do not treat a failed read as an empty account */ }
      finally { busy.current = false; }
    };
    const kick = () => { void run(); };
    trigger.current = kick;
    kick();
    const timer = setInterval(kick, 15000);
    const app = AppState.addEventListener("change", state => {
      if (state === "active") { lastPull = 0; kick(); }
    });
    return () => { cancelled = true; trigger.current = null; clearInterval(timer); app.remove(); };
  }, [ready, rpc, userId, catalogEntries, update]);
  useEffect(() => { trigger.current?.(); }, [progress.pendingFlags]);
}
