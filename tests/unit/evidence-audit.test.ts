import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { auditEvidence } from "../../scripts/audit-evidence";
import { loadMedicationDrafts } from "../../scripts/validate-medication-drafts";
import { loadSourceTable, parseCsv } from "../../scripts/build-draft-index";

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
  it("closes the escalation gap honestly via a real, fully-read nursing-practice source (RCP NEWS2), and keeps the gaps that are still genuinely open visible", () => {
    const meds = rows.filter((r) => r.kind === "medication");
    // Phase 15: every medication draft now cites S-RCP-NEWS2 (a generic, fully-read early-warning-score
    // escalation framework) in its escalation section - a real source, not a guess, so this gap is closed.
    expect(meds.every((r) => !r.gaps.some((g) => g.startsWith("escalation")))).toBe(true);
    // Check every source against the registry, not an obsolete fixed set of five drafts.
    const sourceTable = loadSourceTable();
    for (const draft of loadMedicationDrafts()) {
      const expected = draft.sources.map(s => s.id).filter(id => ["RED", "UNVERIFIED"].includes(sourceTable.get(id)?.licence_class ?? "UNVERIFIED"));
      expect(meds.find(r => r.id === draft.med_id)?.red_sources, draft.med_id).toEqual(expected);
    }
    expect(meds.find(r => r.id === "MD-01")?.red_sources).toContain("S-UIC-EXTRA-2026");
    expect(meds.find(r => r.id === "MD-19")?.red_sources).toContain("S-NHS-SPS-HYPO-2024");
    // Gaps that are still honestly open and must not be silently closed without real work:
    expect(meds.every((r) => r.gaps.some((g) => g.startsWith("US label only")))).toBe(true);
    expect(meds.some((r) => r.gaps.some((g) => g.startsWith("high-alert status")))).toBe(true);
  });
  it("sourced monitoring statements added this phase never carry dosing wording", () => {
    const text = JSON.stringify((loadMedicationDrafts() as unknown as { sections: { monitoring: unknown } }[]).map((m) => m.sections.monitoring));
    expect(text).not.toMatch(/\b\d+\s?(mg|mcg|mL|units)\b/i);
  });
});
