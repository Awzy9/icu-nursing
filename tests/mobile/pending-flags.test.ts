import { describe, expect, it } from "vitest";
import { acknowledgeFlag, applyPendingFlags, queueFlag } from "../../mobile/src/core/pendingFlags";
import { emptyProgress, progressSchema, scopedProgressStore, saveProgress, loadProgress } from "../../mobile/src/core/progress";

describe("pending account progress flags", () => {
  it("keeps the latest desired state when a response acknowledges an older change", () => {
    const first = queueFlag(emptyProgress(), "bookmark", "topics:D01-T19", true, 100);
    const sent = first.pendingFlags!["bookmark:topics:D01-T19"]!;
    const second = queueFlag(first, "bookmark", "topics:D01-T19", false, 100);
    expect(second.pendingFlags!["bookmark:topics:D01-T19"]?.revision).toBe(101);
    expect(acknowledgeFlag(second, sent)).toBe(second);
    expect(acknowledgeFlag(second, second.pendingFlags!["bookmark:topics:D01-T19"]!).pendingFlags).toEqual({});
  });

  it("retains pending removals despite a stale account snapshot", () => {
    const local = queueFlag(queueFlag(emptyProgress(), "bookmark", "topics:D01-T19", false, 100), "complete", "SC-10", false, 101);
    const stale = { ...local, bookmarks: ["topics:D01-T19"], completed: ["SC-10"] };
    const result = applyPendingFlags(stale);
    expect(result.bookmarks).toEqual([]);
    expect(result.completed).toEqual([]);
    expect(result.pendingFlags).toEqual(local.pendingFlags);
  });

  it("reapplies pending additions without duplicating them", () => {
    const local = queueFlag(queueFlag(emptyProgress(), "bookmark", "skills:SK-02", true, 100), "complete", "SK-02", true, 100);
    const result = applyPendingFlags(local);
    expect(result.bookmarks).toEqual(["skills:SK-02"]);
    expect(result.completed).toEqual(["SK-02"]);
    expect(applyPendingFlags(result)).toBe(result);
  });

  it("survives hydration and keeps one account's queued changes out of another account and guest state", async () => {
    const data = new Map<string,string>();
    const store = {get: async (key:string) => data.get(key) ?? null, set: async (key:string,value:string) => {data.set(key,value);}, remove: async (key:string) => {data.delete(key);}};
    const local = queueFlag(emptyProgress(), "complete", "SK-02", true, 100);
    await saveProgress(scopedProgressStore(store, "account-a"), local);
    expect((await loadProgress(scopedProgressStore(store, "account-a"))).pendingFlags).toEqual(local.pendingFlags);
    expect((await loadProgress(scopedProgressStore(store, "account-b"))).pendingFlags).toBeUndefined();
    expect((await loadProgress(scopedProgressStore(store, null))).pendingFlags).toBeUndefined();
    expect(progressSchema.parse(emptyProgress()).pendingFlags).toBeUndefined();
  });
});
