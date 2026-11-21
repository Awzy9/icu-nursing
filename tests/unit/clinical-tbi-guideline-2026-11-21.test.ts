import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const draftPath = "content/drafts/batch-08/D03-T03-icp-cpp-monitoring-severe-tbi.md";

describe("2026-11-21 severe TBI ICP/CPP guideline chronology audit", () => {
  it("identifies the RESCUEicp evidence as published and integrated in the 2020 BTF addendum", () => {
    const s = read(draftPath);
    expect(s).toContain("2020 decompressive-craniectomy update");
    expect(s).toContain("already incorporated RESCUEicp");
    expect(s).toContain("not an arbitrary clock time since the injury");
    expect(s).toContain("not be extrapolated to primary decompression");
    expect(s).not.toContain("may change after RESCUEicp");
    expect(s).not.toContain("the guideline expects the RESCUEicp trial");
  });

  it("keeps fourth-edition pressure guidance distinct from surgery and penetrating TBI", () => {
    const s = read(draftPath);
    expect(s).toContain("above **22 mm Hg**");
    expect(s).toContain("between **60 and 70 mm Hg**");
    expect(s).toContain("This 2020 update did not replace the fourth-edition 22 mm Hg");
    expect(s).toContain("penetrating-TBI");
    expect(s).toContain("a distinct population-specific update");
    expect(s).toContain("clinically_reviewed: false");
  });

  it("registers evidence, preserves approval gates and updates the topic history hash", () => {
    const s = read(draftPath);
    expect(s).toContain("status: DRAFT");
    expect(s).toContain("S-BTF-DC-2020");
    expect(s).toContain("S-BTF-PTBI-2026");
    const sources = read("sources/source_register.csv");
    expect(sources).toContain("S-BTF-DC-2020,PARTIAL OR SUMMARY");
    expect(sources).toContain("S-BTF-PTBI-2026,PARTIAL OR SUMMARY");

    const expected = createHash("sha256").update(s.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
    const index = JSON.parse(read("src/content/draft-index.json")).entries as {
      key: string; type: string; clinically_reviewed: boolean; hash: string;
    }[];
    const history = JSON.parse(read("src/content/draft-history.json")).entries as Record<string, { hash: string }[]>;
    const entry = index.find(e => e.key === "D03-T03" && e.type === "topics");
    expect(entry?.hash).toBe(expected);
    expect(entry?.clinically_reviewed).toBe(false);
    expect(history["D03-T03"]?.at(-1)?.hash).toBe(expected);
  });
});
