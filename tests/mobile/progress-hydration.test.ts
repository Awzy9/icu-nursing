import { describe, expect, it } from "vitest";
import { emptyProgress, loadProgressStrict, saveProgress, scopedProgressStore, type KeyValueStore } from "../../mobile/src/core/progress";

function fixture() {
  const data = new Map<string, string>();
  let fail = false;
  const store: KeyValueStore = {
    get: async key => { if (fail) throw new Error("storage temporarily unavailable"); return data.get(key) ?? null; },
    set: async (key, value) => { data.set(key, value); },
    remove: async key => { data.delete(key); },
  };
  return { data, store, failReads: (value: boolean) => { fail = value; } };
}

describe("strict writable progress hydration", () => {
  it("distinguishes missing progress from an unreadable existing snapshot", async () => {
    const f = fixture();
    expect(await loadProgressStrict(f.store)).toEqual(emptyProgress());
    const progress = { ...emptyProgress(), viewed: ["D01-T01"] };
    await saveProgress(f.store, progress);
    const original = f.data.get("icu.progress.v2");
    f.failReads(true);
    await expect(loadProgressStrict(f.store)).rejects.toThrow("storage temporarily unavailable");
    expect(f.data.get("icu.progress.v2")).toBe(original);
    f.failReads(false);
    expect(await loadProgressStrict(f.store)).toEqual(progress);
  });
  it("preserves corrupt, empty and future-schema stored bytes instead of treating them as new progress", async () => {
    const f = fixture();
    for (const raw of ["{broken", "", JSON.stringify({ ...emptyProgress(), v: 3 })]) {
      f.data.set("icu.progress.v2", raw);
      await expect(loadProgressStrict(f.store)).rejects.toThrow();
      expect(f.data.get("icu.progress.v2")).toBe(raw);
    }
  });
  it("does not mutate legacy data or another learner's snapshot during hydration", async () => {
    const f = fixture();
    const a = scopedProgressStore(f.store, "account-a");
    const b = scopedProgressStore(f.store, "account-b");
    await saveProgress(a, { ...emptyProgress(), viewed: ["D01-T01"] });
    f.data.set("icu.progress.v1", "old local history");
    expect(await loadProgressStrict(b)).toEqual(emptyProgress());
    expect(await loadProgressStrict(f.store)).toEqual(emptyProgress());
    expect(f.data.get("icu.progress.v1")).toBe("old local history");
    expect((await loadProgressStrict(a)).viewed).toEqual(["D01-T01"]);
  });
});
