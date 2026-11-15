import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { deletionFormSchema, isRecentlyAuthenticated, mapDeletionError, RECENT_SECONDS, secondsSinceAuthentication } from "@/lib/account/deletion";

const now = 1_800_000_000;
describe("recent authentication (mirrors private.seconds_since_authentication)", () => {
  it("uses the newest authentication method and rejects missing, malformed or future stamps", () => {
    expect(secondsSinceAuthentication([{ method: "password", timestamp: now - 3000 }, { method: "totp", timestamp: now - 20 }], now)).toBe(20);
    expect(secondsSinceAuthentication(undefined, now)).toBeNull();
    expect(secondsSinceAuthentication([], now)).toBeNull();
    expect(secondsSinceAuthentication([{ method: "password" }, { method: "x", timestamp: "now" }, null, 5], now)).toBeNull();
    expect(isRecentlyAuthenticated([{ method: "password", timestamp: now - 30 }], now)).toBe(true);
    expect(isRecentlyAuthenticated([{ method: "password", timestamp: now - RECENT_SECONDS - 1 }], now)).toBe(false);
    expect(isRecentlyAuthenticated([{ method: "password", timestamp: now + 3600 }], now)).toBe(false); // a forged future stamp is not "recent"
    expect(isRecentlyAuthenticated(undefined, now)).toBe(false);
  });
});
describe("deletion form and error mapping", () => {
  it("requires an email and the confirmation checkbox", () => {
    expect(deletionFormSchema.safeParse({ email: "a@b.test", understand: "on" }).success).toBe(true);
    expect(deletionFormSchema.safeParse({ email: "a@b.test", understand: "" }).success).toBe(false);
    expect(deletionFormSchema.safeParse({ email: "", understand: "on" }).success).toBe(false);
    expect(deletionFormSchema.safeParse({ email: "x".repeat(300), understand: "on" }).success).toBe(false);
  });
  it("maps database refusals to translated keys without exposing raw text", () => {
    expect(mapDeletionError({ code: "28000", message: "recent sign-in required" })).toBe("recent");
    expect(mapDeletionError({ code: "28000", message: "second-factor verification required" })).toBe("secondFactor");
    expect(mapDeletionError({ code: "22023" })).toBe("mismatch");
    expect(mapDeletionError({ code: "55000", message: "staff accounts are removed by an administrator after their roles are revoked" })).toBe("staff");
    expect(mapDeletionError({ code: "55000", message: "this account holds retained clinical review records; contact an administrator" })).toBe("retained");
    expect(mapDeletionError({ code: "42501" })).toBe("auth");
    expect(mapDeletionError({ code: "XX000", message: "relation does not exist" })).toBe("generic");
    expect(mapDeletionError(null)).toBe("generic");
  });
});
describe("English and Arabic messages", () => {
  const en = JSON.parse(readFileSync("src/messages/en.json", "utf8")).AccountDeletion, ar = JSON.parse(readFileSync("src/messages/ar.json", "utf8")).AccountDeletion;
  const keys = (o: unknown, p = ""): string[] => (o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => keys(v, `${p}${k}.`)) : [p]);
  it("have exactly the same keys, all non-empty, and every error key used by the action exists", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
    for (const k of keys(en)) expect(k.length).toBeGreaterThan(0);
    for (const e of ["auth", "recent", "secondFactor", "mismatch", "staff", "retained", "rate", "invalid", "generic"]) { expect(en.errors[e]).toBeTruthy(); expect(ar.errors[e]).toBeTruthy(); }
    expect(ar.emailHint).toContain("{email}"); expect(ar.reauthBody).toContain("{minutes}");
  });
});
describe("the action's own source", () => {
  const src = readFileSync("src/app/[locale]/account/delete/actions.ts", "utf8");
  it("never takes a user id from the form and never uses a service-role client", () => {
    expect(src).not.toMatch(/service_role|SERVICE_ROLE|createAdmin|auth\.admin/);
    expect(src).not.toMatch(/form\.get\("(user|id|userId)"\)/);
    expect(src).toMatch(/rpc\("delete_my_account"/);
  });
});
