import { describe, expect, it } from "vitest";
import { localize, matchesQuery, usedFallback } from "@/lib/content/localize";

describe("matchesQuery", () => {
  it("matches a plain substring, case-insensitively", () => {
    expect(matchesQuery(["Acute Kidney Injury"], "kidney")).toBe(true);
    expect(matchesQuery(["Acute Kidney Injury"], "liver")).toBe(false);
  });
  it("treats an empty or missing query as matching everything", () => {
    expect(matchesQuery(["anything"], undefined)).toBe(true);
    expect(matchesQuery(["anything"], "   ")).toBe(true);
  });
  it("does not throw when the query is not a string (e.g. a duplicated ?q= query param)", () => {
    // Next.js's searchParams gives string[] for a repeated key despite route types that claim `q?: string`;
    // a page must never pass that straight through to this helper and crash the request.
    expect(() => matchesQuery(["anything"], ["a", "b"] as unknown as string)).not.toThrow();
    expect(() => matchesQuery(["anything"], 5 as unknown as string)).not.toThrow();
    expect(() => matchesQuery(["anything"], null as unknown as string)).not.toThrow();
  });
});

describe("localize", () => {
  it("returns a plain string unchanged", () => {
    expect(localize("hello", "en")).toBe("hello");
  });
  it("returns an empty string for null or undefined", () => {
    expect(localize(null, "en")).toBe("");
    expect(localize(undefined, "en")).toBe("");
  });
  it("falls back from a region locale to its base language, then to English", () => {
    expect(localize({ en: "Hello", ar: "مرحبا" }, "ar-EG")).toBe("مرحبا");
    expect(localize({ en: "Hello" }, "fr")).toBe("Hello");
  });
});

describe("usedFallback", () => {
  it("is false for a plain string or a missing value", () => {
    expect(usedFallback(null, "ar")).toBe(false);
  });
});
