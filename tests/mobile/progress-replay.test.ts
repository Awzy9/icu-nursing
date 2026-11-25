import { describe, expect, it } from "vitest";
import { acknowledgeReplay, enqueueReplay, nextReplayBatch, type ReplayEvent } from "../../mobile/src/core/progressReplay";
import { emptyProgress, loadProgress, saveProgress, scopedProgressStore } from "../../mobile/src/core/progress";

const answer = (at: number, correct = true, questionId = "QB-D01-T03-1"): ReplayEvent => ({
  kind: "answer", moduleKey: "QB-D01-T03", questionId, choice: correct ? 1 : 0, correct, at,
});
const checkpoint = (at: number): ReplayEvent => ({
  kind: "checkpoint", moduleKey: "SC-01", sessionKind: "scenario", version: "sc2-test",
  position: 2, score: 2, finished: false, at, decisions: [{ position: 1, choice: 0 }],
});

describe("offline learning replay preparation", () => {
  it("preserves ordered answer events, including a miss between correct answers", () => {
    const events = [answer(100), answer(200, false), answer(300)];
    const queue = events.reduce(enqueueReplay, []);
    expect(queue).toEqual(events);
    expect(nextReplayBatch(queue, 400)).toEqual([events[0]]);
    expect(nextReplayBatch(acknowledgeReplay(queue, events[0]!), 400)).toEqual([events[1]]);
  });
  it("deduplicates equal-time events without losing later actions", () => {
    const first = answer(100);
    const queue = enqueueReplay([first], answer(100, false));
    expect(queue).toEqual([first]);
    const newer = enqueueReplay(queue, answer(200));
    expect(acknowledgeReplay(newer, first)).toEqual([answer(200)]);
  });
  it("defers future-dated events and never changes their original event time", () => {
    const future = answer(300);
    const independent = answer(50, true, "QB-D01-T03-2");
    const queue = [future, independent];
    expect(nextReplayBatch(queue, 200)).toEqual([independent]);
    expect(nextReplayBatch(queue, 300)).toEqual([independent, future]);
  });
  it("orders checkpoints and dismissals in the same stream", () => {
    const first = checkpoint(100);
    const dismissed: ReplayEvent = { kind: "dismiss", moduleKey: "SC-01", at: 200 };
    const restarted = checkpoint(300);
    const queue = [restarted, dismissed, first].reduce(enqueueReplay, []);
    expect(queue).toEqual([first, dismissed, restarted]);
    expect(nextReplayBatch(acknowledgeReplay(queue, first), 400)).toEqual([dismissed]);
  });
  it("rejects invalid timestamps, invalid choices and malformed scenario histories", () => {
    const queue = [answer(100)];
    expect(enqueueReplay(queue, answer(-1))).toBe(queue);
    expect(enqueueReplay(queue, { ...answer(200), choice: 4 } as ReplayEvent)).toBe(queue);
    expect(enqueueReplay(queue, { ...checkpoint(200), decisions: [{position: 1, choice: 5}] } as ReplayEvent)).toBe(queue);
  });
  it("retains the original timestamps and decision history in account-isolated storage", async () => {
    const data = new Map<string,string>();
    const store = {get: async (key:string) => data.get(key) ?? null, set: async (key:string,value:string) => {data.set(key,value);}, remove: async (key:string) => {data.delete(key);}};
    const pendingReplay = [answer(100), checkpoint(200)];
    await saveProgress(scopedProgressStore(store,"account-a"), {...emptyProgress(),pendingReplay});
    expect((await loadProgress(scopedProgressStore(store,"account-a"))).pendingReplay).toEqual(pendingReplay);
    expect((await loadProgress(scopedProgressStore(store,"account-b"))).pendingReplay).toBeUndefined();
    expect((await loadProgress(scopedProgressStore(store,null))).pendingReplay).toBeUndefined();
  });
});
