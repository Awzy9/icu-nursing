import { describe, expect, it } from "vitest";
import { mergeRemoteBookmarks, mergeRemoteCompleted, mergeRemoteSessions } from "../../mobile/src/core/syncMerge";
import { emptyProgress } from "../../mobile/src/core/progress";

describe("mergeRemoteBookmarks", () => {
  it("resolves each remote module_key to kind:key using the lookup, and unions with local bookmarks", () => {
    const local = { ...emptyProgress(), bookmarks: ["skills:SK-02"] };
    const kindOf = new Map([["EQ-01", "equipment" as const], ["SK-02", "skills" as const]]);
    const merged = mergeRemoteBookmarks(local, [{ module_key: "EQ-01" }, { module_key: "SK-02" }], kindOf);
    expect(new Set(merged.bookmarks)).toEqual(new Set(["skills:SK-02", "equipment:EQ-01"]));
  });
  it("drops a remote row whose module_key is not in the lookup, rather than guessing a kind", () => {
    const local = emptyProgress();
    const merged = mergeRemoteBookmarks(local, [{ module_key: "UNKNOWN-99" }], new Map());
    expect(merged.bookmarks).toEqual([]);
  });
  it("returns the same object reference when nothing changes (no unnecessary re-render)", () => {
    const local = { ...emptyProgress(), bookmarks: ["equipment:EQ-01"] };
    const merged = mergeRemoteBookmarks(local, [{ module_key: "EQ-01" }], new Map([["EQ-01", "equipment"]]));
    expect(merged).toBe(local);
  });
});

describe("mergeRemoteSessions", () => {
  it("adopts a remote session for a module with no local session", () => {
    const merged = mergeRemoteSessions(emptyProgress(), [{ module_key: "SC-10", kind: "scenario", version: "v1", position: 2, score: 2, finished: false, updated_at: "2026-01-01T00:00:01.000Z" }]);
    expect(merged.sessions["SC-10"]).toEqual({ kind: "scenario", version: "v1", position: 2, score: 2, finished: false, at: "2026-01-01T00:00:01.000Z" });
  });
  it("prefers the remote session only when it is strictly newer than the local one", () => {
    const local = { ...emptyProgress(), sessions: { "SC-10": { kind: "scenario" as const, version: "v1", position: 1, score: 0, finished: false, at: "2026-01-01T00:00:05.000Z" } } };
    const older = mergeRemoteSessions(local, [{ module_key: "SC-10", kind: "scenario", version: "v1", position: 2, score: 2, finished: false, updated_at: "2026-01-01T00:00:01.000Z" }]);
    expect(older.sessions["SC-10"]!.position).toBe(1); // local, newer, wins
    const newer = mergeRemoteSessions(local, [{ module_key: "SC-10", kind: "scenario", version: "v1", position: 3, score: 4, finished: false, updated_at: "2026-01-01T00:00:10.000Z" }]);
    expect(newer.sessions["SC-10"]!.position).toBe(3); // remote, newer, wins
  });
  it("never adopts a finished remote session - nothing to resume", () => {
    const merged = mergeRemoteSessions(emptyProgress(), [{ module_key: "SC-10", kind: "scenario", version: "v1", position: 3, score: 6, finished: true, updated_at: "2026-01-01T00:00:01.000Z" }]);
    expect(merged.sessions["SC-10"]).toBeUndefined();
  });
  it("returns the same object reference when nothing changes", () => {
    const local = emptyProgress();
    expect(mergeRemoteSessions(local, [])).toBe(local);
  });
});

describe("mergeRemoteCompleted", () => {
  it("unions remote-completed rows into local.completed", () => {
    const local = { ...emptyProgress(), completed: ["SK-02"] };
    const merged = mergeRemoteCompleted(local, [{ module_key: "D01-T19", completed: true }, { module_key: "MD-15", completed: false }]);
    expect(new Set(merged.completed)).toEqual(new Set(["SK-02", "D01-T19"]));
  });
  it("never unmarks a local completion from an incomplete remote row (no authoritative timestamp to arbitrate)", () => {
    const local = { ...emptyProgress(), completed: ["D01-T19"] };
    const merged = mergeRemoteCompleted(local, [{ module_key: "D01-T19", completed: false }]);
    expect(merged.completed).toEqual(["D01-T19"]);
  });
  it("returns the same object reference when nothing changes", () => {
    const local = { ...emptyProgress(), completed: ["D01-T19"] };
    expect(mergeRemoteCompleted(local, [{ module_key: "D01-T19", completed: true }])).toBe(local);
  });
});
