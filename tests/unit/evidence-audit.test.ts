import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { auditEvidence } from "../../scripts/audit-evidence";
import { loadMedicationDrafts } from "../../scripts/validate-medication-drafts";
import { parseCsv } from "../../scripts/build-draft-index";

const labels = new Map(parseCsv(readFileSync("content/drafts/medications/LABEL_SOURCES.csv", "utf8")).map((r) => [r.source_id!, r]));
describe("evidence gap audit (medications and skills)", () => {
  const rows = auditEvidence();
  it("covers all 50 medication and 25 skill drafts and ranks them", () => {
    expect(rows.filter((r) => r.kind === "medication")).toHaveLength(50);
    expect(rows.filter((r) => r.kind === "skill")).toHaveLength(25);
    expect(rows.map((r) => r.score)).toEqual([...rows.map((r) => r.score)].sort((a, b) => b - a));
  });
  it("every medication draft records a label currency check that matches the label register", () => {
    for (const m of loadMedicationDrafts() as unknown as { med_id: string; label_ref: string; label_currency_check: { checked: string; set_id: string; label_version: string; effective_time: string; matches_register: boolean } }[]) {
      const l = labels.get(m.label_ref)!;
      expect(m.label_currency_check, m.med_id).toBeTruthy();
      expect(m.label_currency_check.set_id).toBe(l.set_id); expect(m.label_currency_check.effective_time).toBe(l.effective_time); expect(m.label_currency_check.label_version).toBe(l.label_version);
      expect(m.label_currency_check.matches_register).toBe(true);
    }
  });
  it("keeps the honest gaps visible: escalation has no nursing-practice source, and no draft is high-alert-cleared by guesswork", () => {
    const meds = rows.filter((r) => r.kind === "medication");
    expect(meds.every((r) => r.gaps.some((g) => g.startsWith("escalation")))).toBe(true);
    expect(meds.every((r) => r.red_sources.length === 0)).toBe(true); // no medication draft rests on a RED source
  });
  it("sourced monitoring statements added this phase never carry dosing wording", () => {
    const text = JSON.stringify((loadMedicationDrafts() as unknown as { sections: { monitoring: unknown } }[]).map((m) => m.sections.monitoring));
    expect(text).not.toMatch(/\b\d+\s?(mg|mcg|mL|units)\b/i);
  });
});
