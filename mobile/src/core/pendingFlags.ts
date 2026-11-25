import { setComplete, type PendingFlag, type Progress } from "./progress";

const idOf = (flag: Pick<PendingFlag, "kind" | "key">) => `${flag.kind}:${flag.key}`;

export function queueFlag(p: Progress, kind: PendingFlag["kind"], key: string, value: boolean, now = Date.now()): Progress {
  const id = idOf({ kind, key });
  const prev = p.pendingFlags?.[id];
  if (prev?.value === value) return p;
  const flag: PendingFlag = { kind, key, value, revision: Math.max(now, (prev?.revision ?? -1) + 1) };
  return { ...p, pendingFlags: { ...p.pendingFlags, [id]: flag } };
}

export function acknowledgeFlag(p: Progress, flag: PendingFlag): Progress {
  const id = idOf(flag);
  const current = p.pendingFlags?.[id];
  // A response to an older intent cannot acknowledge a newer opposite intent.
  if (!current || current.revision !== flag.revision || current.value !== flag.value) return p;
  const pendingFlags = { ...p.pendingFlags };
  delete pendingFlags[id];
  return { ...p, pendingFlags };
}

/** Reapply unsynced desired states after account pulls. */
export function applyPendingFlags(p: Progress): Progress {
  let next = p;
  for (const flag of Object.values(p.pendingFlags ?? {})) {
    if (flag.kind === "complete") {
      next = setComplete(next, flag.key, flag.value);
    } else {
      const present = next.bookmarks.includes(flag.key);
      if (present !== flag.value) {
        const bookmarks = flag.value ? [...next.bookmarks, flag.key].slice(0, 500) : next.bookmarks.filter(k => k !== flag.key);
        next = { ...next, bookmarks };
      }
    }
  }
  return next;
}
