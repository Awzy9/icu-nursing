import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { localize, usedFallback } from "@/lib/content/localize";

const flat = (o: Record<string, unknown>, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`]));

describe("message catalogues", () => {
  it("English and Arabic define exactly the same keys", () => {
    expect(flat(ar).sort()).toEqual(flat(en).sort());
  });
  it("has no empty strings", () => {
    for (const cat of [en, ar]) expect(flat(cat as never).length).toBeGreaterThan(100);
    const empties = JSON.stringify(en).includes('""') || JSON.stringify(ar).includes('""');
    expect(empties).toBe(false);
  });
  it("keeps ICU placeholders consistent between locales", () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)(?=[,}])/g)].map((m) => m[1]).sort().join(",");
    const get = (o: Record<string, unknown>, path: string) => path.split(".").reduce<unknown>((a, k) => (a as Record<string, unknown>)[k], o) as string;
    for (const key of flat(en)) expect(ph(get(ar, key)), key).toBe(ph(get(en, key)));
  });
});

describe("localize", () => {
  it("prefers the requested locale and falls back to English", () => {
    expect(localize({ en: "Hello", ar: "مرحبا" }, "ar")).toBe("مرحبا");
    expect(localize({ en: "Hello" }, "ar")).toBe("Hello");
    expect(localize({ en: "Hello", ar: "x" }, "ar-SA")).toBe("x");
    expect(localize(null, "en")).toBe("");
  });
  it("reports when a fallback was used", () => {
    expect(usedFallback({ en: "a" }, "ar")).toBe(true);
    expect(usedFallback({ en: "a", ar: "b" }, "ar")).toBe(false);
  });
});
