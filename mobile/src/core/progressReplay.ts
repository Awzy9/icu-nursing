import { z } from "zod";
import { scenarioDecisionHistorySchema } from "@icu/schemas/working-progress";

// Separate from the existing flag outbox. A quiz answer is an event, not a
// desired boolean: collapsing multiple answers would lose Leitner transitions.
const moduleKey = z.string().regex(/^[A-Z0-9-]{1,40}$/);
const eventTime = z.number().int().nonnegative().max(8_640_000_000_000_000);
const answer = z.object({
  kind: z.literal("answer"), moduleKey, questionId: z.string().regex(/^[A-Z0-9-]{1,60}$/),
  choice: z.number().int().min(0).max(3), correct: z.boolean(), at: eventTime,
});
const checkpoint = z.object({
  kind: z.literal("checkpoint"), moduleKey, sessionKind: z.enum(["quiz", "scenario"]),
  version: z.string().min(1).max(2000), position: z.number().int().nonnegative(),
  score: z.number().int().nonnegative(), finished: z.boolean(), at: eventTime,
  decisions: scenarioDecisionHistorySchema.optional(),
}).refine(e => e.sessionKind === "scenario" || e.decisions === undefined);
const dismissal = z.object({ kind: z.literal("dismiss"), moduleKey, at: eventTime });

export const replayEventSchema = z.union([answer, checkpoint, dismissal]);
export type ReplayEvent = z.infer<typeof replayEventSchema>;
export const replayQueueSchema = z.array(replayEventSchema);
export type ReplayQueue = z.infer<typeof replayQueueSchema>;

// Timestamp ties are already first-write-wins in the proposed server contract.
// Dismissals and checkpoints share one session stream, answers one question stream.
export function replayStream(e: ReplayEvent): string {
  return e.kind === "answer" ? `answer:${e.questionId}` : `session:${e.moduleKey}`;
}
function sameEvent(a: ReplayEvent, b: ReplayEvent): boolean {
  return replayStream(a) === replayStream(b) && a.at === b.at;
}

export function enqueueReplay(queue: ReplayQueue, input: ReplayEvent): ReplayQueue {
  const parsed = replayEventSchema.safeParse(input);
  if (!parsed.success) return queue;
  const event = parsed.data;
  if (queue.some(e => sameEvent(e, event))) return queue;
  // Keep every distinct answer (including an incorrect answer between two
  // correct ones). Session snapshots may be coalesced, but never across a
  // pending dismissal, which needs a server-side tombstone.
  const next = [...queue, event];
  return next.sort((a, b) => a.at - b.at);
}

export function acknowledgeReplay(queue: ReplayQueue, event: ReplayEvent): ReplayQueue {
  return queue.some(e => sameEvent(e, event)) ? queue.filter(e => !sameEvent(e, event)) : queue;
}

// A future-dated event must not be clamped to a moving server timestamp on
// every retry. Defer it AND later events for the same stream. Other independent
// streams may still proceed. Pass verified server time, not the device clock.
export function nextReplayBatch(queue: ReplayQueue, serverNow: number, limit = 50): ReplayQueue {
  if (!Number.isFinite(serverNow) || limit <= 0) return [];
  const seen = new Set<string>();
  const next: ReplayQueue = [];
  for (const event of [...queue].sort((a,b) => a.at - b.at)) {
    const key = replayStream(event);
    if (seen.has(key)) continue;
    seen.add(key);
    if (event.at <= serverNow) next.push(event);
    if (next.length >= limit) break;
  }
  // At most one event from each stream per batch. Only after acknowledgement
  // can the caller send the next event for the same question or session.
  return next;
}
