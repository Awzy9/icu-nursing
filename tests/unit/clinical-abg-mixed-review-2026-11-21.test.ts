import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const topicPath = "content/drafts/batch-07/D04-T08-acid-base-abg-interpretation.md";

describe("D04-T08 mixed acid–base disorder safety audit, 2026-11-21", () => {
  const s = read(topicPath);

  it("warns that normal pH can conceal clinically important mixed disorders", () => {
    expect(s).toContain("normal pH cannot exclude");
    expect(s).toContain("not** proof that a normal pH");
    expect(s).toContain("Physiological compensation");
    expect(s).not.toContain("fully compensated means pH has returned to normal");
    expect(s).toContain("PaCO₂ 20 mm Hg");
    expect(s).toContain("HCO₃ 12 mEq/L");
    expect(s).toContain("26 ± 2 mm Hg");
  });

  it("keeps six MCQs and correctly escalates the normal-pH mixed-disorder case", () => {
    expect((s.match(/\*\*Q\d \(/g) || [])).toHaveLength(6);
    const q4 = s.split("**Q4 (")[1]?.split("**Q5 (")[0];
    expect(q4).toContain("**Answer: A.**");
    expect(q4).toContain("pH **7.40**");
    expect(q4).toContain("possible mixed metabolic-acidosis and respiratory-alkalosis");
    expect(q4).toContain("20 is lower than expected");
    expect(s).not.toContain("PaCO₂ normal, uncompensated");
  });

  it("retains lab and clinician boundaries, evidence citations and draft-only governance", () => {
    expect(s).toContain("clinically_reviewed: false");
    expect(s).toContain("status: DRAFT");
    expect(s).toContain("S-ATS-ABG");
    expect(s).toContain("S-MERCK-ACIDBASE");
    expect(s).toContain("S-AAFP-ACID2025");
    expect(s).toContain("The prescriber/critical-care team");
    const sourceRegister = read("sources/source_register.csv");
    for (const id of ["S-ATS-ABG", "S-MERCK-ACIDBASE", "S-AAFP-ACID2025"])
      expect(sourceRegister).toContain(id + ",PARTIAL OR SUMMARY");
  });

  it("synchronizes the SHA256 content hash and revision history", () => {
    const hash = createHash("sha256").update(s.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
    const index = JSON.parse(read("src/content/draft-index.json")).entries as Array<{
      key: string; type: string; hash: string; clinically_reviewed: boolean; sources: Array<{id: string}>;
    }>;
    const history = JSON.parse(read("src/content/draft-history.json")).entries as Record<string, Array<{hash: string}>>;
    const e = index.find(x => x.key === "D04-T08" && x.type === "topics");
    expect(e?.hash).toBe(hash);
    expect(e?.clinically_reviewed).toBe(false);
    expect(e?.sources.some(x => x.id === "S-ATS-ABG")).toBe(true);
    expect(history["D04-T08"]?.at(-1)?.hash).toBe(hash);
  });
});
