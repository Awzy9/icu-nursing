import { nextReplayBatch, replayStream, type ReplayEvent, type ReplayQueue } from "./progressReplay";

// Explicit rollout flag. Never silently fall back to non-idempotent legacy
// writes once replay is enabled. The backend must be deployed and tested first.
export const replayEnabled = (value: string | undefined): boolean => value === "true";

/** Round-robin across independent streams; never skip the oldest event within a stream. */
export function createReplayScheduler() {
  let cursor: string | undefined;
  return {
    select(queue: ReplayQueue, limit = 20): ReplayQueue {
      const heads = nextReplayBatch(queue, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
        .sort((a, b) => replayStream(a) < replayStream(b) ? -1 : replayStream(a) > replayStream(b) ? 1 : 0);
      const index = cursor === undefined ? 0 : heads.findIndex(event => replayStream(event) > cursor!);
      const start = index < 0 ? 0 : index;
      return [...heads.slice(start), ...heads.slice(0, start)].slice(0, limit);
    },
    attempted(event: ReplayEvent) { cursor = replayStream(event); },
  };
}

export interface ReplayWorkerDeps {
  userId: string;
  isActive(): boolean;
  send(userId: string, event: ReplayEvent): Promise<boolean>;
  acknowledge(event: ReplayEvent): void;
  scheduler?: ReturnType<typeof createReplayScheduler>;
}

export async function flushReplayBatch(queue: ReplayQueue, deps: ReplayWorkerDeps): Promise<number> {
  let accepted = 0;
  // The replay RPC checks the server clock and returns false for future events.
  // Do not use a possibly skewed device clock to rewrite or drop any timestamp.
  const batch = deps.scheduler?.select(queue) ?? nextReplayBatch(queue, Number.MAX_SAFE_INTEGER, 20);
  for (const event of batch) {
    if (!deps.isActive()) break;
    deps.scheduler?.attempted(event);
    try {
      const ok = await deps.send(deps.userId, event);
      if (!deps.isActive()) break;
      if (ok) {
        deps.acknowledge(event);
        accepted++;
      }
    } catch {
      // Preserve the original event after an interrupted or ambiguous response.
      // The next retry uses the exact same account, payload and timestamp.
    }
  }
  return accepted;
}
