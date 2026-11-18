import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { scanBundle } from "../../scripts/check-mobile-bundle";
import { dark, light, MIN_TARGET } from "../../mobile/src/ui/theme";

const root = path.resolve(__dirname, "../..");
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = path.join(dir, f); return f === "node_modules" || f === "dist" ? [] : statSync(p).isDirectory() ? walk(p) : [p]; });
const source = [...walk(path.join(root, "mobile/src")), ...walk(path.join(root, "mobile/app"))].filter((f) => /\.(ts|tsx)$/.test(f));

describe("mobile bundle guard", () => {
  it("passes ordinary content (including real lesson codes and clinical terms, which the app now fetches at runtime rather than bundling)", () => {
    expect(scanBundle("D01-T19 SK-18 norepinephrine a perfectly ordinary bundle")).toEqual([]);
  });
  it("flags internal content-ops file references, secrets and tokens", () => {
    expect(scanBundle("content/drafts/skills").length).toBeGreaterThan(0);
    expect(scanBundle("draft-index").length).toBeGreaterThan(0);
    expect(scanBundle("draft-history").length).toBeGreaterThan(0);
    expect(scanBundle("service_role").length).toBeGreaterThan(0);
    expect(scanBundle("SUPABASE_SERVICE").length).toBeGreaterThan(0);
    expect(scanBundle("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c").length).toBeGreaterThan(0);
  });
  it("flags the internal draft-index's own audit metadata fields (never meant to ship, distinct from the lesson content itself)", () => {
    for (const field of ["licence_class", "clinically_reviewed", "required_sources", "spec_level"]) {
      expect(scanBundle(`some bundle text with ${field} in it`).map((f) => f.problem)).toContain(`internal content-audit field leaked: ${field}`);
    }
  });
  it("does not flag evidence_status: @icu/schemas/skills.ts and medications.ts legitimately use that same field name for an unrelated, already-public concept", () => {
    expect(scanBundle("bundle text with evidence_status in it")).toEqual([]);
  });
  it("flags the removed prototype's fictional sample content (harbour ferry office, bakery dispenser, etc.), case-insensitively", () => {
    for (const needle of ["Sample content", "Harbour Island", "fictional bakery", "fictional ferry", "ferry ticket scanner", "a sample number pattern"]) {
      expect(scanBundle(`some bundle text with ${needle} in it`).length, needle).toBeGreaterThan(0);
    }
  });
});
describe("mobile source", () => {
  it("never references the clinical drafts, the draft index or any service-role credential", () => {
    expect(source.length).toBeGreaterThan(10);
    for (const f of source) {
      const t = readFileSync(f, "utf8");
      expect(t, f).not.toMatch(/content\/drafts|draft-index|draft-history/i);
      // The only place that may name the service-role key is the validator that REFUSES it.
      if (!f.endsWith(path.join("auth", "config.ts"))) expect(t, f).not.toMatch(/service[_-]?role|SERVICE_ROLE/i);
      expect(t, f).not.toMatch(/WebView.*uri:\s*["'`]https?:\/\/(?!localhost)/); // never a website wrapper
    }
  });
  it("keeps the synthetic fixtures (core/content.ts) out of every shipped screen: only the automated tests may import it", () => {
    const appFiles = walk(path.join(root, "mobile/app")).filter((f) => /\.(ts|tsx)$/.test(f));
    const importers = appFiles.filter((f) => /from\s+["'][.\/]*core\/content["']/.test(readFileSync(f, "utf8")));
    expect(importers.map((f) => path.relative(root, f))).toEqual([]);
  });
  it("is not a WebView wrapper of the website: the app has native screens; a WebView exists only for the CAPTCHA bridge", () => {
    const users = source.filter((f) => /react-native-webview/.test(readFileSync(f, "utf8"))).map((f) => path.relative(root, f));
    expect(users.every((f) => f.endsWith(path.join("auth", "CaptchaView.tsx")))).toBe(true);
    expect(readdirSync(path.join(root, "mobile/app")).length).toBeGreaterThan(5);
  });
  it("keeps the Android package identifier, scheme and EAS project exactly, while showing the renamed display name", () => {
    const app = JSON.parse(readFileSync(path.join(root, "mobile/app.json"), "utf8")).expo;
    expect(app.android.package).toBe("com.criticalcarenursing.myapp");
    expect(app.scheme).toBe("icuknowledgemap");
    expect(app.extra.eas.projectId).toBe("bb38e642-1a31-49fd-89fa-81a50d2cd2fa");
    expect(app.name).toBe("Critical Care Nursing");
  });
  it("has removed the original fictional prototype entirely: no /prototype route, no samples.ts, nothing named Prototype in either language", () => {
    expect(source.some((f) => f.endsWith(path.join("app", "prototype.tsx")))).toBe(false);
    expect(source.some((f) => f.endsWith(path.join("src", "samples.ts")))).toBe(false);
    expect(source.some((f) => f.includes(path.join("src", "prototype")))).toBe(false);
    for (const f of source) expect(readFileSync(f, "utf8"), f).not.toMatch(/\bprototype\b/i);
  });
});
describe("design system accessibility", () => {
  const lum = (hex: string) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!; };
  const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x! + 0.05) / (y! + 0.05); };
  for (const [name, p] of [["light", light], ["dark", dark]] as const) {
    it(`${name} palette meets WCAG AA contrast (4.5:1 text, 3:1 borders)`, () => {
      for (const bg of [p.bg, p.surface]) for (const fg of [p.text, p.muted, p.primary, p.dangerText, p.success]) expect(ratio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(p.onPrimary, p.primary)).toBeGreaterThanOrEqual(4.5); expect(ratio(p.warnText, p.warnBg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(p.border, p.bg)).toBeGreaterThanOrEqual(3);
    });
  }
  it("uses at least 48dp touch targets", () => expect(MIN_TARGET).toBeGreaterThanOrEqual(48));
});
