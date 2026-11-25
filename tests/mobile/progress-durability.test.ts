import { describe, expect, it } from "vitest";
import { createProgressDurability } from "../../mobile/src/core/progressDurability";
import { emptyProgress, type KeyValueStore } from "../../mobile/src/core/progress";

const scope = (): KeyValueStore => ({ get: async () => null, set: async () => {}, remove: async () => {} });
function deferred() {
  let resolve!: () => void, reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("durable account progress", () => {
  it("waits for the exact snapshot write before permitting replay", async () => {
    const tracker = createProgressDurability(), a = scope(), p = emptyProgress(), write = deferred();
    void tracker.writing(a, p, write.promise);
    let settled = false;
    const result = tracker.confirmed(a, p).then(ok => { settled = true; return ok; });
    await Promise.resolve();
    expect(settled).toBe(false);
    write.resolve();
    expect(await result).toBe(true);
  });
  it("blocks failed writes until the same snapshot is successfully retried", async () => {
    const tracker = createProgressDurability(), a = scope(), p = emptyProgress();
    expect(await tracker.writing(a, p, Promise.reject(new Error("disk unavailable")))).toBe(false);
    expect(await tracker.confirmed(a, p)).toBe(false);
    expect(await tracker.writing(a, p, Promise.resolve())).toBe(true);
    expect(await tracker.confirmed(a, p)).toBe(true);
  });
  it("does not certify a newer snapshot or switched account with a stale successful write", async () => {
    const tracker = createProgressDurability(), a = scope(), b = scope(), p = emptyProgress(), newer = emptyProgress(), first = deferred(), second = deferred();
    void tracker.writing(a, p, first.promise);
    const old = tracker.confirmed(a, p);
    void tracker.writing(a, newer, second.promise);
    first.resolve();
    expect(await old).toBe(false);
    expect(await tracker.confirmed(b, newer)).toBe(false);
    const inFlight = tracker.confirmed(a, newer);
    tracker.hydrated(b, p);
    second.resolve();
    expect(await inFlight).toBe(false);
    expect(await tracker.confirmed(b, p)).toBe(true);
    expect(await tracker.confirmed(a, newer)).toBe(false);
  });
});
