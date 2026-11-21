import { describe, expect, it } from "vitest";
import { FREE_COUNT, catalogRoute, isFreeCatalogEntry, isFreeIndex, isLockedStaticRoute, pathOf, safeNext } from "../../mobile/src/core/access";

describe("guest access rules", () => {
  it("opens exactly the first three items of a list", () => {
    expect(FREE_COUNT).toBe(3);
    expect([0, 1, 2].every(isFreeIndex)).toBe(true);
    expect([3, 4, 50, -1].some(isFreeIndex)).toBe(false);
    const keys = ["a", "b", "c", "d", "e"];
    expect(["a", "b", "c"].every((k) => isFreeCatalogEntry(keys, k))).toBe(true);
    expect(isFreeCatalogEntry(keys, "d")).toBe(false);
    expect(isFreeCatalogEntry(keys, "missing")).toBe(false);
  });

  it("recognises catalog detail routes and nothing else", () => {
    expect(catalogRoute("/topics/D04-T03")).toEqual({ type: "topics", key: "D04-T03" });
    expect(catalogRoute("/skills/SK-02")).toEqual({ type: "skills", key: "SK-02" });
    expect(catalogRoute("/medications/MD-01")).toEqual({ type: "medications", key: "MD-01" });
    expect(catalogRoute("/equipment/EQ-04")).toEqual({ type: "equipment", key: "EQ-04" });
    expect(catalogRoute("/cases/CS-01")).toEqual({ type: "cases", key: "CS-01" });
    expect(catalogRoute("/practice-activity/PA-01")).toEqual({ type: "practice", key: "PA-01" });
    expect(catalogRoute("/topics")).toBeNull();
    expect(catalogRoute("/topics/a/b")).toBeNull();
    expect(catalogRoute("/search")).toBeNull();
    expect(catalogRoute("/topics/D04%2DT03")).toEqual({ type: "topics", key: "D04-T03" });
  });

  it("locks the advanced tools and keeps three tools and three practice modules open", () => {
    for (const locked of ["/gcs", "/gcs/x", "/news2", "/aline/x", "/crrt", "/defib", "/waveforms", "/waveform-compare", "/vent-lab", "/infusion", "/infusion/KEY", "/transfusion/x"]) expect(isLockedStaticRoute(locked), locked).toBe(true);
    for (const free of ["/infusion-calculator", "/hemo-lab", "/abg", "/abg/x", "/quiz", "/quiz/x", "/nursing-lab", "/ecg", "/ecg/x"]) expect(isLockedStaticRoute(free), free).toBe(false);
    for (const other of ["/", "/home", "/library", "/account", "/signin", "/signup", "/search", "/bookmarks", "/account-required", "/onboarding", "/delete-account"]) expect(isLockedStaticRoute(other), other).toBe(false);
  });

  it("reads plain paths out of hrefs", () => {
    expect(pathOf("/gcs?x=1#y")).toBe("/gcs");
    expect(pathOf({ pathname: "/gcs" })).toBeNull();
    expect(pathOf("https://evil.test/gcs")).toBeNull();
  });

  it("only returns to safe in-app paths after sign-in", () => {
    expect(safeNext("/topics/D04-T03")).toBe("/topics/D04-T03");
    expect(safeNext("/visuals")).toBe("/visuals");
    for (const bad of [undefined, null, "", "topics/x", "//evil.test", "https://evil.test", "/x://y", "/a\\b", "/signin", "/signup?x=1", "/account-required", "/auth/callback", "/delete-account", "/reset-password"]) expect(safeNext(bad), String(bad)).toBeNull();
  });
});
