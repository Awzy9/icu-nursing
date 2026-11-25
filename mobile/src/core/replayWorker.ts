import { nextReplayBatch, type ReplayEvent, type ReplayQueue } from "./progressReplay";

// Explicit rollout flag. Never silently fall back to non-idempotent legacy
// writes once replay is enabled. The backend must be deployed and tested first.
export const replayEnabled = (value: string | undefined): boolean => value === "true";

export interface ReplayWorkerDeps {
  userId: string;
  isActive(): boolean;
  send(userId: string, event: ReplayEvent): Promise<boolean>;
  acknowledge(event: ReplayEvent): void;
}

export async function flushReplayBatch(queue: ReplayQueue, deps: ReplayWorkerDeps): Promise<number> {
  let accepted = 0;
  // The replay RPC checks the server clock and returns false for future events.
  // Do not use a possibly skewed device clock to rewrite or drop any timestamp.
  for (const event of nextReplayBatch(queue, Number.MAX_SAFE_INTEGER, 20)) {
    if (!deps.isActive()) break;
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
