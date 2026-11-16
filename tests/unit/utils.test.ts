import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/utils";
import { formatDate, formatNumber, formatMinutes } from "@/lib/format";
import * as units from "@/lib/units";
import { isRtl } from "@/i18n/routing";

describe("safeRedirectPath", () => {
  it("allows same-site relative paths", () => {
    expect(safeRedirectPath("/library?x=1")).toBe("/library?x=1");
  });
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null, undefined])("rejects %s", (v) => {
    expect(safeRedirectPath(v as string)).toBe("/dashboard");
  });
  it("falls back safely when given a non-string (e.g. a duplicated ?next= query param gives string[])", () => {
    // Next.js's searchParams gives string[] for a repeated key despite route types that claim `next?: string`;
    // this must fall back, not throw, so the login/MFA pages never 500 on `?next=a&next=b`.
    expect(safeRedirectPath(["/a", "/b"] as unknown as string)).toBe("/dashboard");
    expect(safeRedirectPath(5 as unknown as string)).toBe("/dashboard");
    expect(safeRedirectPath({} as unknown as string)).toBe("/dashboard");
  });
});

describe("clinical formatting", () => {
  it("uses Latin digits and the Gregorian calendar in Arabic", () => {
    const d = formatDate("2026-11-14T00:00:00Z", "ar");
    expect(d).toMatch(/2026/);
    expect(d).not.toMatch(/[٠-٩]/);
    expect(formatNumber(1234.5, "ar")).not.toMatch(/[٠-٩]/);
    expect(formatMinutes(15, "ar")).not.toMatch(/[٠-٩]/);
  });
  it("returns an empty string for invalid dates", () => {
    expect(formatDate("not a date", "en")).toBe("");
  });
});

describe("units", () => {
  it("has no conversion functions (doses must never be auto-converted)", () => {
    expect(Object.keys(units).filter((k) => /convert|toMg|toMl|dose/i.test(k))).toEqual([]);
    expect(units.formatQuantity(7.4, "mmol/L", "en")).toBe("7.4 mmol/L");
  });
});

describe("rtl", () => {
  it("flags Arabic as RTL and English as LTR", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
  });
});
