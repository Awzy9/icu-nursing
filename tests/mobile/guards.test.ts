import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { scanBundle } from "../../scripts/check-mobile-bundle";
import { dark, light, MIN_TARGET } from "../../mobile/src/ui/theme";

const root = path.resolve(__dirname, "../..");
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = path.join(dir, f); return f === "node_modules" || f === "dist" ? [] : statSync(p).isDirectory() ? walk(p) : [p]; });
const source = [...walk(path.join(root, "mobile/src")), ...walk(path.join(root, "mobile/app"))].filter((f) => /\.(ts|tsx)$/.test(f));

describe("mobile bundle guard", () => {
  it("flags planted draft ids, draft titles, secrets and clinical names, and passes a clean bundle", () => {
    const clean = "SYN-EQ-001 SYN-CASE-001 harbour fan speed trace";
    expect(scanBundle(clean)).toEqual([]);
    expect(scanBundle(clean + " MD-01").map((f) => f.problem)).toContain("draft id MD-01 found");
    expect(scanBundle(clean + " content/drafts/skills").length).toBeGreaterThan(0);
    expect(scanBundle(clean + " service_role").length).toBeGreaterThan(0);
    expect(scanBundle(clean + " eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c").length).toBeGreaterThan(0);
    expect(scanBundle("SYN-EQ-001 SYN-CASE-001 norepinephrine").length).toBeGreaterThan(0);
    expect(scanBundle("nothing synthetic").map((f) => f.problem)).toContain("the synthetic fixtures are missing from the bundle");
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
  it("is not a WebView wrapper of the website: the app has native screens; a WebView exists only for the CAPTCHA bridge", () => {
    const users = source.filter((f) => /react-native-webview/.test(readFileSync(f, "utf8"))).map((f) => path.relative(root, f));
    expect(users.every((f) => f.endsWith(path.join("auth", "CaptchaView.tsx")))).toBe(true);
    expect(readdirSync(path.join(root, "mobile/app")).length).toBeGreaterThan(5);
  });
  it("keeps the Android package identifier exactly", () => {
    const app = JSON.parse(readFileSync(path.join(root, "mobile/app.json"), "utf8")).expo;
    expect(app.android.package).toBe("com.criticalcarenursing.myapp");
    expect(app.scheme).toBe("icuknowledgemap");
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
