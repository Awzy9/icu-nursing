import { describe, expect, it } from "vitest";
import { mergeRemoteAttempts, mergeRemoteBookmarks, mergeRemoteCompleted, mergeRemoteSessions, reconcileAccountFlags } from "../../mobile/src/core/syncMerge";
import { discardSession, emptyProgress, progressSchema, saveSession } from "../../mobile/src/core/progress";
import { queueFlag } from "../../mobile/src/core/pendingFlags";

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
  it("keeps only the winning scenario row's individual choices", () => {
    const local = { ...emptyProgress(), sessions: { "SC-10": { kind: "scenario" as const, version: "sc2-example", position: 2, score: 2, finished: false, at: "2026-01-01T00:00:05.000Z", decisions: [{position:1,choice:0}] } } };
    const remote = { module_key: "SC-10", kind: "scenario" as const, version: "sc2-example", position: 2, score: 2, finished: false, updated_at: "2026-01-01T00:00:10.000Z", decisions: [{position:1,choice:1}] };
    expect(mergeRemoteSessions(local,[remote]).sessions["SC-10"]?.decisions).toEqual(remote.decisions);
    expect(mergeRemoteSessions(local,[{...remote,updated_at:"2026-01-01T00:00:01.000Z"}])).toBe(local);
    expect(mergeRemoteSessions(local,[{...remote,decisions:null}]).sessions["SC-10"]?.decisions).toBeUndefined();
    expect(mergeRemoteSessions(local,[{...remote,decisions:[{position:1,choice:4}]}]).sessions["SC-10"]?.decisions).toBeUndefined();
    expect(mergeRemoteSessions(local,[{...remote,kind:"quiz"}]).sessions["SC-10"]?.decisions).toBeUndefined();
  });
  it("never adopts a finished remote session - nothing to resume", () => {
    const merged = mergeRemoteSessions(emptyProgress(), [{ module_key: "SC-10", kind: "scenario", version: "v1", position: 3, score: 6, finished: true, updated_at: "2026-01-01T00:00:01.000Z" }]);
    expect(merged.sessions["SC-10"]).toBeUndefined();
  });
  it("clears older local progress when another device has finished the case", () => {
    const local = { ...emptyProgress(), sessions: { "SC-10": { kind: "scenario" as const, version: "v1", position: 2, score: 2, finished: false, at: "2026-01-01T00:00:05.000Z" } } };
    const remote = { module_key: "SC-10", kind: "scenario" as const, version: "v1", position: 3, score: 6, finished: true, updated_at: "2026-01-01T00:00:10.000Z" };
    expect(mergeRemoteSessions(local, [remote]).sessions["SC-10"]).toBeUndefined();
    expect(local.sessions["SC-10"].position).toBe(2);
    expect(mergeRemoteSessions(local, [{...remote, updated_at: "2026-01-01T00:00:01.000Z"}])).toBe(local);
  });
  it("ignores remote session rows with invalid timestamps", () => {
    const local = emptyProgress();
    expect(mergeRemoteSessions(local, [{ module_key: "SC-10", kind: "scenario", version: "v1", position: 2, score: 2, finished: false, updated_at: "invalid" }])).toBe(local);
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

describe("mergeRemoteAttempts", () => {
  it("adopts a remote attempt for a question with no local attempt, trusting the server-computed box as-is", () => {
    const merged = mergeRemoteAttempts(emptyProgress(), [{ question_id: "Q1", correct: true, answered_at: "2026-01-01T00:00:01.000Z", box: 3 }]);
    expect(merged.attempts.Q1).toEqual({ correct: true, at: "2026-01-01T00:00:01.000Z", box: 3 });
  });
  it("prefers the remote attempt only when it is strictly newer than the local one", () => {
    const local = { ...emptyProgress(), attempts: { Q1: { correct: false, at: "2026-01-01T00:00:05.000Z", box: 1 } } };
    const older = mergeRemoteAttempts(local, [{ question_id: "Q1", correct: true, answered_at: "2026-01-01T00:00:01.000Z", box: 4 }]);
    expect(older.attempts.Q1).toEqual({ correct: false, at: "2026-01-01T00:00:05.000Z", box: 1 }); // local, newer, wins
    const newer = mergeRemoteAttempts(local, [{ question_id: "Q1", correct: true, answered_at: "2026-01-01T00:00:10.000Z", box: 2 }]);
    expect(newer.attempts.Q1).toEqual({ correct: true, at: "2026-01-01T00:00:10.000Z", box: 2 }); // remote, newer, wins
  });
  it("returns the same object reference when nothing changes", () => {
    const local = emptyProgress();
    expect(mergeRemoteAttempts(local, [])).toBe(local);
  });
});


describe("session dismissal and delayed account reads", () => {
  const key = "SC-10";
  const row = { module_key: key, kind: "scenario" as const, version: "v1", position: 2, score: 2, finished: false, updated_at: "2026-01-01T00:00:01.000Z" };
  const session = { kind: "scenario" as const, version: "v1", position: 2, score: 2, finished: false, at: row.updated_at };
  const dismissedAt = "2026-01-01T00:00:05.000Z";
  it("keeps an explicitly restarted case dismissed after storage hydration and a slow account pull", () => {
    const saved = saveSession(emptyProgress(), key, session);
    const dismissed = discardSession(saved, key, dismissedAt);
    const hydrated = progressSchema.parse(JSON.parse(JSON.stringify(dismissed)));
    expect(hydrated.sessions[key]).toBeUndefined();
    expect(mergeRemoteSessions(hydrated, [row])).toBe(hydrated);
    expect(mergeRemoteSessions(hydrated, [{ ...row, updated_at: dismissedAt }])).toBe(hydrated);
  });
  it("keeps a completed local attempt dismissed without retaining its decisions", () => {
    const finished = saveSession(emptyProgress(), key, { ...session, finished: true, at: dismissedAt, decisions: [{ position: 1, choice: 0 }] });
    expect(finished.sessions[key]).toBeUndefined();
    expect(finished.sessionDismissals?.[key]).toBe(dismissedAt);
    expect(mergeRemoteSessions(finished, [row])).toBe(finished);
  });
  it("records a remote completion even when no local resumable session exists", () => {
    const finished = mergeRemoteSessions(emptyProgress(), [{ ...row, finished: true, updated_at: dismissedAt }]);
    expect(mergeRemoteSessions(finished, [row])).toBe(finished);
    expect(finished.sessionDismissals?.[key]).toBe(dismissedAt);
  });
  it("allows a genuinely newer attempt and rejects an older local save or discard", () => {
    const dismissed = discardSession(emptyProgress(), key, dismissedAt);
    expect(saveSession(dismissed, key, session)).toBe(dismissed);
    const newerAt = "2026-01-01T00:00:10.000Z";
    const newer = mergeRemoteSessions(dismissed, [{ ...row, updated_at: newerAt }]);
    expect(newer.sessions[key]?.at).toBe(newerAt);
    expect(discardSession(newer, key, dismissedAt)).toBe(newer);
    expect(saveSession(newer, key, session)).toBe(newer);
  });
  it("compares attempt times chronologically despite timezone offsets and rejects invalid times", () => {
    const local = { ...emptyProgress(), attempts: { Q1: { correct: true, box: 2, at: "2026-01-01T03:00:05+03:00" } } };
    expect(mergeRemoteAttempts(local, [{ question_id: "Q1", correct: false, box: 1, answered_at: "2026-01-01T00:00:10Z" }]).attempts.Q1?.correct).toBe(false);
    expect(mergeRemoteAttempts(local, [{ question_id: "Q1", correct: false, box: 1, answered_at: "invalid" }])).toBe(local);
  });
});


describe("successful signed-in account snapshot", () => {
  const kindOf = new Map([["D01-T19", "topics" as const], ["SK-02", "skills" as const]]);
  it("removes a known bookmark deleted on another device while retaining unresolved catalog keys", () => {
    const local = { ...emptyProgress(), bookmarks: ["topics:D01-T19", "equipment:EQ-99"] };
    expect(reconcileAccountFlags(local, [{ module_key: "SK-02" }], [], kindOf).bookmarks).toEqual(["equipment:EQ-99", "skills:SK-02"]);
  });
  it("honors explicit remote lesson resets without clearing lessons absent from the response", () => {
    const local = { ...emptyProgress(), completed: ["D01-T19", "SC-10"] };
    expect(reconcileAccountFlags(local, [], [{module_key:"D01-T19",completed:false},{module_key:"SK-02",completed:true}],kindOf).completed).toEqual(["SC-10","SK-02"]);
  });
  it("preserves pending local changes during a conflicting server snapshot", () => {
    const local = queueFlag(queueFlag(queueFlag(emptyProgress(), "bookmark", "topics:D01-T19", false, 100), "bookmark", "skills:SK-02", true, 101), "complete", "D01-T19", true, 102);
    const merged = reconcileAccountFlags(local, [{module_key:"D01-T19"}], [{module_key:"D01-T19",completed:false}], kindOf);
    expect(merged.bookmarks).toEqual(["skills:SK-02"]);
    expect(merged.completed).toEqual(["D01-T19"]);
    expect(merged.pendingFlags).toEqual(local.pendingFlags);
  });
});
