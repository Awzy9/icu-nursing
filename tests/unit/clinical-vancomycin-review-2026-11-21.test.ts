import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const pathToDraft = "content/drafts/medications/MD-24-vancomycin.json";

describe("2026-11-21 vancomycin clinical safety audit (MD-24)", () => {
  const v = JSON.parse(read(pathToDraft));

  it("does not confuse infusion-related flushing with possible anaphylaxis", () => {
    const safety = v.sections.safety_alerts.items.map((x: {text: string}) => x.text).join(" ");
    expect(safety).toContain("may indicate anaphylaxis");
    expect(safety).toContain("do not assume that a serious reaction will resolve");
    expect(v.sections.escalation.items[0].text.toLowerCase()).toContain("activate emergency response");
    expect(v.monitoring.some((x: {text: string}) => x.text.includes("anaphylaxis"))).toBe(true);
  });

  it("expands label-traced renal, hearing, blood count, serious skin and infusion-site risks", () => {
    expect(v.sections.adverse_effects.items.length).toBeGreaterThanOrEqual(4);
    const text = v.sections.adverse_effects.items.map((x: {text: string}) => x.text).join(" ");
    for (const token of ["neutropenia", "hearing", "renal", "extravasation", "diarrhoea"])
      expect(text.toLowerCase()).toContain(token);
    expect(v.monitoring.some((x: {text: string}) => x.text.includes("white-cell"))).toBe(true);
  });

  it("documents AUC consensus in the report without adding a RED source to the draft", () => {
    const combined = v.sections.monitoring.items.map((x: {text: string}) => x.text).join(" ");
    expect(combined).toContain("ordered timing");
    expect(combined).toContain("pharmacy/prescriber");
    expect(combined).not.toContain("AUC-guided");
    expect(v.sources.some((x: {id: string}) => x.id === "S-IDSA-VANCO-2020")).toBe(false);
    const reg = read("sources/source_register.csv");
    expect(reg).toContain("S-IDSA-VANCO-2020,PARTIAL OR SUMMARY");
    const report = read("docs/clinical-evidence/AI_REVIEW_VANCOMYCIN_2026-11-21.md");
    expect(report).toContain("AUC-based");
    expect(report).toContain("RED (cite-only)");
    expect(JSON.stringify(v)).not.toContain("400 to 600");
  });

  it("retains draft gates and synchronizes metadata hash and history", () => {
    expect(v.status).toBe("DRAFT");
    expect(v.clinically_reviewed).toBe(false);
    expect(v.pharmacist_reviewed).toBe(false);
    const hash = createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 16);
    const entries = JSON.parse(read("src/content/draft-index.json")).entries as Array<{
      key: string; type: string; hash: string; gaps: number; clinically_reviewed: boolean; sources: Array<{id:string}>;
    }>;
    const history = JSON.parse(read("src/content/draft-history.json")).entries as Record<string,{hash: string}[]>;
    const e = entries.find(x => x.key === "MD-24" && x.type === "medications");
    expect(e?.hash).toBe(hash);
    expect(e?.clinically_reviewed).toBe(false);
    expect(e?.gaps).toBe(v.gaps.length);
    expect(e?.sources.some(x => x.id === "S-IDSA-VANCO-2020")).toBe(false);
    expect(history["MD-24"]?.at(-1)?.hash).toBe(hash);
  });
});
