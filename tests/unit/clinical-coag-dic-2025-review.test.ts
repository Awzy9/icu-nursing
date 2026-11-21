import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const draftPath = "content/drafts/batch-08/D08-T02-coagulation-tests-inr-aptt-fibrinogen.md";

describe("2026-11-21 DIC version and HIT suspicion safety audit", () => {
  const text = read(draftPath);

  it("identifies the 2001-era ISTH score as historical and acknowledges the 2025 revision", () => {
    expect(text).toContain("2001-era ISTH overt-DIC score");
    expect(text).toContain("2025 communication");
    expect(text).toContain("updated scoring thresholds");
    expect(text).toContain("not be taught as the complete, universally current scoring rule");
    expect(text).not.toContain("DIC is diagnosed with the ISTH scoring system");
  });

  it("avoids diagnosing DIC or HIT from a single biomarker", () => {
    expect(text).toContain("A 30% fall does not diagnose HIT");
    expect(text).toContain("4Ts clinical pretest probability");
    expect(text).toContain("neither a high D-dimer nor a single normal fibrinogen");
    const q4 = text.split("**Q4 (")[1]?.split("**Q5 (")[0];
    expect(q4).toContain("**Answer: B.**");
    expect(q4).toContain("updated ISTH proposal");
    expect((text.match(/\*\*Q\d \(/g) || [])).toHaveLength(6);
  });

  it("keeps publication gates and source traceability", () => {
    expect(text).toContain("clinically_reviewed: false");
    expect(text).toContain("status: DRAFT");
    expect(text).toContain("S-ISTH-DIC-2025");
    expect(text).toContain("S-BSH-HIT-2023");
    const sources = read("sources/source_register.csv");
    expect(sources).toContain("S-ISTH-DIC-2025,PARTIAL OR SUMMARY");
    expect(sources).toContain("S-BSH-HIT-2023,PARTIAL OR SUMMARY");
  });

  it("retains validated topic index and revision hash", () => {
    const hash = createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
    const index = JSON.parse(read("src/content/draft-index.json")).entries as {
      key: string; type: string; hash: string; clinically_reviewed: boolean;
      sources: Array<{ id: string }>;
    }[];
    const history = JSON.parse(read("src/content/draft-history.json")).entries as Record<string, Array<{hash: string}>>;
    const e = index.find(x => x.key === "D08-T02" && x.type === "topics");
    expect(e?.clinically_reviewed).toBe(false);
    expect(e?.hash).toBe(hash);
    expect(e?.sources.some(s => s.id === "S-ISTH-DIC-2025")).toBe(true);
    expect(history["D08-T02"]?.at(-1)?.hash).toBe(hash);
  });
});
