import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { loadMedicationFixtures, medicationSeedSql } from "@/lib/medications/fixtures";
import { createMedicationFixtureService, type MedicationStore } from "@/lib/medications/fixture-service";
import { medicationTextViolation } from "@/lib/medications/no-dosing";
import { MEDICATION_CATEGORIES, MEDICATION_SECTIONS, MedicationError } from "@/lib/medications/types";

const meds = loadMedicationFixtures();
const mk = () => { const store: MedicationStore = new Map(); return (u = "u") => createMedicationFixtureService(u, { store }); };

describe("medication fixtures", () => {
  it("are labelled synthetic, fictional and nonclinical, with the mandatory institution-specific referrals", () => {
    expect(meds.length).toBeGreaterThanOrEqual(4);
    for (const m of meds) {
      expect(m.code).toMatch(/^SYN-MED-\d{3}$/);
      expect(m.summary.en).toMatch(/no clinical content/i);
      expect(MEDICATION_CATEGORIES).toContain(m.category);
      expect(m.monitoring.length).toBeGreaterThanOrEqual(3);
      for (const k of ["nursing_responsibilities", "safety_alerts", "escalation", "institution_preparation", "institution_dosing"]) expect(m.sections[k], `${m.code} ${k}`).toBeDefined();
      for (const k of Object.keys(m.sections)) expect(MEDICATION_SECTIONS as readonly string[]).toContain(k);
      expect(medicationTextViolation(JSON.stringify(m))).toBeNull();
    }
  });
  it("seed SQL only inserts demo_synthetic rows", () => {
    const sql = medicationSeedSql();
    expect(sql).toMatch(/demo_synthetic/);
    expect(sql).not.toMatch(/'clinical'/);
  });
  it("no application source imports the clinical medication drafts", () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
    for (const f of walk("src").filter((x) => /\.(ts|tsx|json)$/.test(x))) expect(readFileSync(f, "utf8"), f).not.toMatch(/(from|import\(|require\()\s*["'][^"']*content\/drafts/);
  });
});

describe("no-dosing guard (TypeScript twin of the database function)", () => {
  it.each(["Give 5 mg", "a 4 mg/mL vial", "2 mcg/kg/min", "0.9 % saline", "10 mmol", "titrate to effect", "Y-site compatible", "dilute before use", "loading dose", "infusion rate"])("rejects %s", (t) => {
    expect(medicationTextViolation(t)).not.toBeNull();
  });
  it.each(["Monitor blood pressure and report changes.", "Check the second-person label verification.", "A high-alert medication."])("accepts %s", (t) => {
    expect(medicationTextViolation(t)).toBeNull();
  });
});

describe("fixture medication service", () => {
  it("lists, filters, searches and isolates bookmarks per user", async () => {
    const get = mk();
    const a = get("a"), b = get("b");
    expect((await a.list()).length).toBe(meds.length);
    expect((await a.list({ category: "anti-infectives" })).map((x) => x.code)).toEqual(["SYN-MED-003"]);
    expect((await a.list({ highAlert: true })).length).toBe(3);
    expect((await a.list({ query: "MOCKINASE" })).map((x) => x.code)).toEqual(["SYN-MED-004"]);
    expect(await a.get("NOPE-000")).toBeNull();
    await a.setBookmark(meds[0]!.id, true);
    expect((await a.list({ bookmarked: true })).length).toBe(1);
    expect((await b.list({ bookmarked: true })).length).toBe(0);
    await expect(a.setBookmark("not-a-medication", true)).rejects.toThrow(MedicationError);
    const d = await a.get("SYN-MED-001");
    expect(d?.evidence_status).toBe("unassessed");
    expect(d?.label_source).toBeNull();
  });
});
