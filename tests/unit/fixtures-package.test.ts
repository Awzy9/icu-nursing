import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import draftIndex from "../../src/content/draft-index.json";

const dir = path.resolve(__dirname, "../../packages/fixtures");
const files = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "package.json");

describe("@icu/fixtures: synthetic, nonclinical, and nothing copied from the clinical drafts", () => {
  it("has the five fixture files", () => expect(files.sort()).toEqual(["cases.json", "equipment.json", "medications.json", "questions.json", "skills.json"]));
  for (const f of files) {
    const text = readFileSync(path.join(dir, f), "utf8").replace(/"category":\s*"[^"]*",?/g, ""); // equipment category slugs are the shared device-category names, not content
    it(`${f}: every code is SYN-*, there are no draft ids, and no draft title or clinical drug appears`, () => {
      const codes = [...text.matchAll(/"code":\s*"([^"]+)"/g)].map((m) => m[1]!);
      expect(codes.length).toBeGreaterThan(0);
      for (const c of codes) expect(c, c).toMatch(/^SYN-/);
      expect(text).not.toMatch(/\b(D\d\d-T\d\d|SK-\d\d|MD-\d\d|SC-\d\d|EQ-\d\d|XQ-\d\d)\b/);
      const lower = text.toLowerCase();
      for (const e of draftIndex.entries) if (e.title.length > 12) expect(lower.includes(e.title.toLowerCase()), `${f} contains the draft title "${e.title}"`).toBe(false);
      for (const drug of ["norepinephrine", "heparin", "insulin", "propofol", "midazolam", "fentanyl", "amiodarone", "ventilator", "intubat", "tracheostomy"]) expect(lower, `${f}: ${drug}`).not.toContain(drug);
    });
  }
});
