import { describe, expect, it } from "vitest";
import { cleanQuery, groupByType, MIN_QUERY_LENGTH, searchCatalog } from "../../mobile/src/core/search";
import type { WorkingEntrySummary } from "../../mobile/src/core/remoteContent";

const items: WorkingEntrySummary[] = [
  { key: "D06-T01", type: "topics", title: "Recognising possible sepsis in adults", category: "Infection and Sepsis", questionCount: 6 },
  { key: "SK-02", type: "skills", title: "Central venous catheter care", category: "Vascular access", questionCount: 0 },
  { key: "MD-15", type: "medications", title: "Insulin (fictional)", category: "Endocrine", questionCount: 0 },
];

describe("cleanQuery", () => {
  it("normalizes whitespace, strips control characters, and truncates", () => {
    expect(cleanQuery("  sepsis   adults  ")).toBe("sepsis adults");
    expect(cleanQuery("a\u0001b<c>d")).toBe("a b c d");
    expect(cleanQuery("x".repeat(100)).length).toBe(80);
  });
});

describe("searchCatalog", () => {
  it("matches on title, key, or category, case-insensitively", () => {
    expect(searchCatalog(items, "sepsis").map((e) => e.key)).toEqual(["D06-T01"]);
    expect(searchCatalog(items, "SK-02").map((e) => e.key)).toEqual(["SK-02"]);
    expect(searchCatalog(items, "endocrine").map((e) => e.key)).toEqual(["MD-15"]);
    expect(searchCatalog(items, "CATHETER").map((e) => e.key)).toEqual(["SK-02"]);
  });
  it("returns nothing for a query shorter than the minimum length", () => {
    expect(MIN_QUERY_LENGTH).toBe(2);
    expect(searchCatalog(items, "s")).toEqual([]);
    expect(searchCatalog(items, "")).toEqual([]);
  });
  it("returns nothing when no item matches", () => {
    expect(searchCatalog(items, "nonexistent-zzz")).toEqual([]);
  });
});

describe("groupByType", () => {
  it("groups matching items by their content type, preserving order within a group", () => {
    const groups = groupByType(items);
    expect(groups.get("topics")!.map((e) => e.key)).toEqual(["D06-T01"]);
    expect(groups.get("skills")!.map((e) => e.key)).toEqual(["SK-02"]);
    expect(groups.get("medications")!.map((e) => e.key)).toEqual(["MD-15"]);
    expect(groups.has("cases")).toBe(false);
  });
});
