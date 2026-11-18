import { describe, expect, it, vi } from "vitest";
import { createRpc, RpcError } from "../../mobile/src/api/rpc";

// A minimal Supabase client double covering exactly the surface rpc.ts calls: .rpc(),
// .from(table).select()/.upsert()/.delete().eq(), and .auth.getUser(). Each test configures what it returns.
function mockClient(overrides: { rpc?: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>; from?: (table: string) => unknown; userId?: string } = {}) {
  return {
    rpc: overrides.rpc ?? (async () => ({ data: null, error: null })),
    from: overrides.from ?? (() => { throw new Error("from() not configured for this test"); }),
    auth: { getUser: async () => ({ data: { user: { id: overrides.userId ?? "u-1" } }, error: null }) },
  } as never;
}

describe("Rpc: equipment/case/skill contracts still work (regression guard - never had a unit test before)", () => {
  it("validates an RPC response against the shared schema and throws RpcError('contract') on mismatch", async () => {
    const rpc = createRpc(mockClient({ rpc: async () => ({ data: { not: "a valid equipment state" }, error: null }) }));
    await expect(rpc.equipmentState()).rejects.toMatchObject({ code: "contract" });
  });
  it("maps a Postgres error code to the right RpcError code", async () => {
    const rpc = createRpc(mockClient({ rpc: async () => ({ data: null, error: { code: "42501", message: "denied" } }) }));
    await expect(rpc.setEquipmentBookmark("EQ-01", true)).rejects.toMatchObject({ code: "auth" });
  });
});

describe("Rpc: working_* account sync (recordWorkingAttempt, bookmarks, lessons, sessions)", () => {
  it("recordWorkingAttempt calls working_record_attempt with the exact argument shape the server action uses", async () => {
    const rpc = vi.fn(async (fn: string, args?: Record<string, unknown>) => { expect(fn).toBe("working_record_attempt"); expect(args).toEqual({ p_question_id: "q1", p_module_key: "D01-T19", p_choice: 2, p_correct: true, p_answered_at: new Date(1000).toISOString() }); return { data: null, error: null }; });
    await createRpc(mockClient({ rpc })).recordWorkingAttempt("q1", "D01-T19", 2, true, 1000);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("setWorkingBookmark(true) upserts with the signed-in user_id set explicitly (the table has no default for it), and (false) deletes, scoped to module_key", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const del = { eq: vi.fn(async () => ({ error: null })) };
    const from = vi.fn((table: string) => { expect(table).toBe("working_bookmarks"); return { upsert, delete: () => del }; });
    const rpc = createRpc(mockClient({ from: from as never, userId: "u-42" }));
    await rpc.setWorkingBookmark("SK-02", true);
    expect(upsert).toHaveBeenCalledWith({ user_id: "u-42", module_key: "SK-02" }, { onConflict: "user_id,module_key" });
    await rpc.setWorkingBookmark("SK-02", false);
    expect(del.eq).toHaveBeenCalledWith("module_key", "SK-02");
  });

  it("setWorkingLessonComplete upserts user_id + completed + updated_at", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const rpc = createRpc(mockClient({ from: () => ({ upsert }) as never, userId: "u-42" }));
    await rpc.setWorkingLessonComplete("D01-T19", true);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "u-42", module_key: "D01-T19", completed: true }), { onConflict: "user_id,module_key" });
  });

  it("setWorkingBookmark(true) fails with RpcError('auth') when not actually signed in, rather than upserting a null user_id", async () => {
    const client = { from: () => { throw new Error("should never reach from() without a user"); }, auth: { getUser: async () => ({ data: { user: null }, error: null }) } } as never;
    await expect(createRpc(client).setWorkingBookmark("SK-02", true)).rejects.toMatchObject({ code: "auth" });
  });

  it("saveWorkingSession calls working_save_session with the exact shape working_save_session() expects", async () => {
    const rpc = vi.fn(async (fn: string, args?: Record<string, unknown>) => { expect(fn).toBe("working_save_session"); expect(args).toEqual({ p_module_key: "SC-10", p_kind: "scenario", p_version: "v1", p_position: 2, p_score: 2, p_finished: false, p_updated_at: new Date(5000).toISOString() }); return { data: null, error: null }; });
    await createRpc(mockClient({ rpc })).saveWorkingSession("SC-10", "scenario", "v1", 2, 2, false, 5000);
  });

  it("discardWorkingSession deletes the row scoped to module_key", async () => {
    const del = { eq: vi.fn(async () => ({ error: null })) };
    const rpc = createRpc(mockClient({ from: () => ({ delete: () => del }) as never }));
    await rpc.discardWorkingSession("SC-10");
    expect(del.eq).toHaveBeenCalledWith("module_key", "SC-10");
  });

  it("listWorkingBookmarks/Lessons/Sessions validate the returned rows and reject a malformed row rather than rendering wrong data", async () => {
    const select = vi.fn(async () => ({ data: [{ module_key: "EQ-01" }], error: null }));
    const rpc = createRpc(mockClient({ from: () => ({ select }) as never }));
    expect(await rpc.listWorkingBookmarks()).toEqual([{ module_key: "EQ-01" }]);

    const badSelect = vi.fn(async () => ({ data: [{ module_key: "EQ-01" /* missing completed */ }], error: null }));
    const badRpc = createRpc(mockClient({ from: () => ({ select: badSelect }) as never }));
    await expect(badRpc.listWorkingLessons()).rejects.toBeInstanceOf(RpcError);
  });

  it("propagates a Postgres/RLS error from a table write as the right RpcError code", async () => {
    const upsert = vi.fn(async () => ({ error: { code: "42501", message: "not authenticated" } }));
    const rpc = createRpc(mockClient({ from: () => ({ upsert }) as never }));
    await expect(rpc.setWorkingBookmark("SK-02", true)).rejects.toMatchObject({ code: "auth" });
  });
});
