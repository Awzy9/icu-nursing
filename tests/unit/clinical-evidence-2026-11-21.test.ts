import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const topics = {
  "D06-T01": "content/drafts/batch-01/D06-T01-sepsis.md",
  "D02-T08": "content/drafts/batch-02/D02-T08-shock-recognition.md",
  "D04-T06": "content/drafts/batch-07/D04-T06-potassium-disorders.md",
} as const;

describe("clinical evidence corrections — November 2026", () => {
  it("cites current SSC 2026 and identifies the superseded 2021 sepsis guidance", () => {
    const s = read(topics["D06-T01"]);
    const bibliography = s.split("## 18. References")[1]?.split("## 19.")[0] ?? "";
    expect(bibliography).toContain("Sepsis and Septic Shock **2026**");
    expect(bibliography).toContain("surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026");
    expect(bibliography).toContain("Historical/superseded 2021 edition");
  });

  it("does not teach a single lactate cutoff to rule shock in or out", () => {
    const s = read(topics["D02-T08"]);
    const q5 = s.split("**Q5 (understanding).**")[1]?.split("**Q6 (safety).**")[0] ?? "";
    expect(q5).toContain("**Answer: B.**");
    expect(q5).toContain("a single value does not rule shock in or out");
    expect(q5).not.toContain("usually exceeds 2 mmol/L");
    expect(s).toContain("| Lactate (historical 2014 statement) |");
    expect(s).toContain("full 2025 graded recommendation review remains pending");
  });

  it("teaches UKKA 12-lead ECG and continuous monitoring as distinct decisions, disclosing the summary conflict", () => {
    const s = read(topics["D04-T06"]);
    expect(s).toContain("defines it as K⁺ ≥ 5.5 mmol/L");
    expect(s).toContain("urgent 12-lead ECG for K⁺ ≥ 6.0 mmol/L");
    expect(s).toContain("Guideline 14.2 (1C)");
    expect(s).toContain("summary inconsistently prints ≥ 6.5 mmol/L");
    expect(s).not.toContain("The draft does not choose; use the local protocol.");
  });

  it("corrects the learner-facing CRRT filter pressures and patient-first alarm practice", () => {
    const crrt = JSON.parse(read("content/working-crrt.json")) as {
      components: { key: string; description: [string, string] }[];
      alarms: { key: string; question: { options: string[]; answer: number; explanation: string } }[];
    };
    const byKey = (key: string) => crrt.components.find((c) => c.key === key)!;
    const alarm = (key: string) => crrt.alarms.find((a) => a.key === key)!;
    expect(byKey("filter").description[0]).toContain("Transmembrane pressure (TMP)");
    expect(byKey("filter").description[0]).toContain("Filter pressure drop (ΔP)");
    expect(byKey("filter").description[0]).toContain("distinct measurements");
    expect(byKey("filter").description[1]).toContain("قياسان مختلفان");
    expect(byKey("pressures").description[0]).toContain("pressure changes alone cannot confirm");
    expect(byKey("access").description[0]).toContain("rather than relying on red/blue alone");
    for (const key of ["CRRT-A1", "CRRT-A3", "CRRT-A4"]) {
      expect(alarm(key).question.answer).toBe(0);
      expect(alarm(key).question.options[0]).toMatch(/^Assess the patient/);
    }
    expect(alarm("CRRT-A2").question.answer).toBe(0);
    expect(alarm("CRRT-A2").question.explanation).toContain("filter pressure drop (ΔP)");
    expect(alarm("CRRT-A2").question.explanation).toContain("not diagnostic");
    expect(alarm("CRRT-A3").question.explanation).not.toContain("empty bag feeding the line");
  });

  it("keeps generated draft indexes and history synchronized and never claims human clinical approval", () => {
    const index = JSON.parse(read("src/content/draft-index.json")) as { entries: { key: string; type: string; hash: string; clinically_reviewed: boolean }[] };
    const history = JSON.parse(read("src/content/draft-history.json")) as { entries: Record<string, { hash: string; recorded: string }[]> };
    for (const [key, file] of Object.entries(topics)) {
      const text = read(file);
      expect(text).toContain("clinically_reviewed: false");
      const hash = createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
      const entry = index.entries.find((e) => e.key === key && e.type === "topics");
      expect(entry?.clinically_reviewed, key).toBe(false);
      expect(entry?.hash, key).toBe(hash);
      expect(history.entries[key]?.at(-1)?.hash, key).toBe(hash);
    }
  });
});
