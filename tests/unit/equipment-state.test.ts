import { describe, expect, it } from "vitest";
import { createEquipmentFixtureService } from "@/lib/equipment/state-fixture";
import { EquipmentError, equipmentStateSchema } from "@/lib/equipment/state";

const mk = () => { const store = new Map(); return (u: string) => createEquipmentFixtureService(u, { store }); };

describe("equipment state (fixture twin of the eq_* functions)", () => {
  it("saves bookmarks and parts per user, idempotently, and parses with the schema", async () => {
    const svc = mk()("a");
    await svc.setBookmark("SYN-EQ-002", true); await svc.setBookmark("SYN-EQ-002", true); await svc.markViewed("SYN-EQ-002", "peak"); await svc.markViewed("SYN-EQ-002", "peak");
    const s = await svc.get();
    expect(s).toEqual({ fixtures: true, bookmarks: ["SYN-EQ-002"], viewed: { "SYN-EQ-002": ["peak"] } });
    expect(() => equipmentStateSchema.parse(s)).not.toThrow();
    await svc.setBookmark("SYN-EQ-002", false); await svc.resetProgress("SYN-EQ-002");
    expect(await svc.get()).toEqual({ fixtures: true, bookmarks: [], viewed: {} });
  });
  it("isolates users and keeps state across service instances (sessions and devices)", async () => {
    const make = mk();
    await make("a").setBookmark("SYN-EQ-001", true);
    expect((await make("a").get()).bookmarks).toEqual(["SYN-EQ-001"]);
    expect((await make("b").get()).bookmarks).toEqual([]);
  });
  it("rejects non-synthetic codes and malformed parts, and enforces the ceilings", async () => {
    const svc = mk()("a");
    for (const c of ["EQ-01", "SYN-EQ-1", "ICU-VENT-01"]) await expect(svc.setBookmark(c, true)).rejects.toMatchObject({ code: "invalid" });
    await expect(svc.markViewed("SYN-EQ-001", "Bad Part")).rejects.toBeInstanceOf(EquipmentError);
    for (let i = 1; i <= 50; i++) await svc.setBookmark(`SYN-EQ-${String(i).padStart(3, "0")}`, true);
    await expect(svc.setBookmark("SYN-EQ-051", true)).rejects.toMatchObject({ code: "limit" });
    for (const p of ["a", "b", "c", "d", "e", "f", "g", "h"]) await svc.markViewed("SYN-EQ-001", p);
    await expect(svc.markViewed("SYN-EQ-001", "i")).rejects.toMatchObject({ code: "limit" });
  });
});
