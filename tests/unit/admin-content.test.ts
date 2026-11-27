import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildDraftRegister } from "../../scripts/build-draft-register";
import { sourceFlags, sourceSummary, STALE_DAYS } from "@/lib/admin/source-health";

describe("draft register (counts only, shown on /admin/content)", () => {
  const onDisk = JSON.parse(readFileSync("src/content/draft-register.json", "utf8"));
  it("is up to date with the draft files (regenerate with npm run register:drafts)", () => {
    expect(onDisk).toEqual(buildDraftRegister());
  });
  it("covers every content type, reports zero validator issues and zero reviewed drafts", () => {
    expect(Object.keys(onDisk.types).sort()).toEqual(["equipment", "mcqs", "medications", "practice", "scenarios", "skills", "topics"]);
    for (const [k, v] of Object.entries(onDisk.types) as [string, { validator_issues: number; clinically_reviewed: number; total: number }][]) {
      expect(v.validator_issues, k).toBe(0); expect(v.clinically_reviewed, k).toBe(0); expect(v.total, k).toBeGreaterThan(0);
    }
    expect(onDisk.types.scenarios.total).toBe(20); expect(onDisk.types.medications.total).toBe(50); expect(onDisk.types.skills.total).toBe(25); expect(onDisk.types.topics.total).toBe(42); expect(onDisk.types.mcqs.total).toBe(318); expect(onDisk.types.equipment.total).toBe(8);
  });
  it("contains counts only: no titles, ids or prose", () => {
    const walk = (x: unknown): void => { if (typeof x === "string") return; if (typeof x === "number") return; if (x && typeof x === "object") for (const v of Object.values(x)) walk(v); };
    walk(onDisk);
    const text = JSON.stringify({ ...onDisk, note: "" });
    expect(text).not.toMatch(/\b(MD|SK|SC|EQ|D\d\d)-\d|norepinephrine|ventilator|tracheostomy/i);
    expect(text.length).toBeLessThan(2000);
  });
});

describe("source licensing health", () => {
  const today = new Date("2026-11-15T00:00:00Z");
  const base = { id: "x", licence_class: "GREEN", last_checked: "2026-11-01", is_draft_guideline: false, url: "https://example.org" };
  it("flags never-checked, stale, non-reusable, draft and URL-less sources", () => {
    expect(sourceFlags(base, today)).toEqual([]);
    expect(sourceFlags({ ...base, last_checked: null }, today)).toContain("never_checked");
    expect(sourceFlags({ ...base, last_checked: "2026-04-01" }, today)).toContain("stale");
    expect(sourceFlags({ ...base, last_checked: "2026-05-30" }, today)).not.toContain("stale"); // within STALE_DAYS
    expect(STALE_DAYS).toBe(180);
    expect(sourceFlags({ ...base, licence_class: "RED" }, today)).toContain("not_reusable_without_permission");
    expect(sourceFlags({ ...base, licence_class: "UNVERIFIED" }, today)).toContain("not_reusable_without_permission");
    expect(sourceFlags({ ...base, is_draft_guideline: true, url: null }, today)).toEqual(expect.arrayContaining(["draft_guideline", "no_url"]));
  });
  it("summarises by class and counts the ones needing attention", () => {
    const s = sourceSummary([base, { ...base, licence_class: "RED" }, { ...base, licence_class: "YELLOW", last_checked: null }, { ...base, url: null }], today);
    expect(s).toEqual({ total: 4, byClass: { GREEN: 2, RED: 1, YELLOW: 1 }, attention: 2 });
  });
});
