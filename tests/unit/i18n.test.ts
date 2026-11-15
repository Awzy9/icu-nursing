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

describe("Arabic interface consistency for the learning areas", () => {
  const NS = ["QuestionBank", "Study", "Cases", "Learn"] as const;
  const cats = { en: en as unknown as Record<string, Record<string, string>>, ar: ar as unknown as Record<string, Record<string, string>> };
  const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);
  it("every Arabic string in these areas is actually Arabic (no untranslated English left behind)", () => {
    for (const ns of NS) for (const [k, v] of Object.entries(cats.ar[ns]!)) expect(hasArabic(v), `${ns}.${k}: ${v}`).toBe(true);
  });
  it("every plural message has the mandatory 'other' branch in both languages", () => {
    for (const cat of [cats.en, cats.ar]) for (const ns of NS) for (const [k, v] of Object.entries(cat[ns]!)) if (/plural,/.test(v)) expect(v, `${ns}.${k}`).toMatch(/other \{/);
  });
  it("Arabic plurals that print a count use the CLDR category 'few' (not English-only one/other)", () => {
    for (const ns of NS) for (const [k, v] of Object.entries(cats.ar[ns]!)) if (/plural,/.test(v) && /#/.test(v)) expect(v, `${ns}.${k}`).toMatch(/few \{[^}]*#[^}]*\}/);
  });
});
