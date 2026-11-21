import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const med = (n: string, slug: string) => JSON.parse(read(`content/drafts/medications/MD-${n}-${slug}.json`));

describe("2026 IV potassium and magnesium high-alert review", () => {
  const records = [
    ["MD-18", "18", "magnesium-sulfate"],
    ["MD-19", "19", "potassium-chloride"],
  ];
  it("classifies magnesium sulfate injection high-alert without prescribing dose", () => {
    const m = med("18", "magnesium-sulfate");
    expect(m.high_alert).toBe(true);
    expect(m.high_alert_note).toContain("ISMP");
    expect(m.sections.safety_alerts.items.some((x: {text: string}) => x.text.includes("high-alert"))).toBe(true);
    expect(m.clinically_reviewed).toBe(false);
    expect(m.pharmacist_reviewed).toBe(false);
  });

  it("prevents potassium concentrate versus ready-to-use premix confusion", () => {
    const k = med("19", "potassium-chloride");
    expect(k.high_alert).toBe(true);
    const full = JSON.stringify(k);
    expect(full).toContain("concentrate vial");
    expect(full).toContain("premixed");
    expect(full).toContain("fatal cardiac arrest");
    expect(full).toContain("rate-limiting infusion device");
    expect(full).toContain("S-NSW-IVK-2025");
    expect(full).toContain("S-DAILYMED-KCL-CONC-2026");
    expect(k.clinically_reviewed).toBe(false);
    expect(k.pharmacist_reviewed).toBe(false);
  });

  it("retains unapproved records and matches the generated index and history", () => {
    const ix = JSON.parse(read("src/content/draft-index.json")).entries as {
      key: string; type: string; hash: string; clinically_reviewed: boolean; issues: unknown[];
    }[];
    const hist = JSON.parse(read("src/content/draft-history.json")).entries as Record<string, {hash: string}[]>;
    for (const [key, n, slug] of records) {
      const m = med(n, slug);
      expect(m.status).toBe("DRAFT");
      const h = createHash("sha256").update(JSON.stringify(m)).digest("hex").slice(0, 16);
      const ent = ix.find(x => x.key === key && x.type === "medications");
      expect(ent?.hash).toBe(h);
      expect(ent?.clinically_reviewed).toBe(false);
      expect(ent?.issues).toEqual([]);
      expect(hist[key]?.at(-1)?.hash).toBe(h);
    }
    const sources = read("sources/source_register.csv");
    for (const id of ["S-ISMP-HAM-2024", "S-NSW-IVK-2025", "S-DAILYMED-KCL-CONC-2026"]) expect(sources).toContain(id + ",");
  });
});
