import { describe, expect, it } from "vitest";
import { emptyProgress, getSession, loadProgress, progressSchema, saveProgress, saveSession } from "../../mobile/src/core/progress";

describe("branching clinical case resume history", () => {
  it("preserves prior visited step positions after serialization and reload", async () => {
    const store = new Map<string, string>();
    const storage = {
      get: async (key: string) => store.get(key) ?? null,
      set: async (key: string, value: string) => { store.set(key, value); },
      remove: async (key: string) => { store.delete(key); },
    };
    const progress = saveSession(emptyProgress(), "SC-20", { kind: "scenario", version: "v1", position: 3, score: 2, finished: false, at: "2026-11-21T12:00:00Z", visited: [1, 2] });
    await saveProgress(storage, progress);
    const hydrated = await loadProgress(storage);
    expect(getSession(hydrated, "SC-20")?.visited).toEqual([1, 2]);
  });
  it("accepts older v2 saves without case history and keeps missing history explicit", () => {
    const progress = saveSession(emptyProgress(), "SC-20", { kind: "scenario", version: "v1", position: 2, score: 0, finished: false, at: "2026-11-21T12:00:00Z" });
    expect(progressSchema.parse(progress).sessions["SC-20"]?.visited).toBeUndefined();
  });
});
