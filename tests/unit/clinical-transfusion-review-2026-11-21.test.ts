import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("2026-11-21 transfusion teaching evidence corrections", () => {
  const draftPath = "content/drafts/batch-06/D08-T03-blood-product-administration-reactions.md";

  it("distinguishes potential FNHTR from an established diagnosis", () => {
    const source = read(draftPath);
    expect(source).toContain("FNHTR is a diagnosis of exclusion");
    expect(source).toContain("Do not diagnose FNHTR from fever alone");
    expect(source).toContain("Stop and assess a suspected acute reaction");
    expect(source).toContain("authorized assessment");
  });

  it("does not misclassify wheeze as a harmless skin-only allergy", () => {
    const source = read(draftPath);
    expect(source).toContain("bronchospasm or wheeze is a respiratory warning sign");
    expect(source).toContain("even without rash");
    expect(source).not.toContain("Urticaria or wheeze, often mild");
    expect(source).toContain("Australian Red Cross Lifeblood. Minor allergic reactions");
  });

  it("keeps review gating and draft history coherent", () => {
    const source = read(draftPath);
    expect(source).toContain("status: DRAFT");
    expect(source).toContain("clinically_reviewed: false");
    const expectedHash = createHash("sha256").update(source.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
    const index = JSON.parse(read("src/content/draft-index.json")) as {
      entries: { key: string; type: string; hash: string; clinically_reviewed: boolean }[];
    };
    const history = JSON.parse(read("src/content/draft-history.json")) as {
      entries: Record<string, { hash: string }[]>;
    };
    const record = index.entries.find(e => e.key === "D08-T03" && e.type === "topics");
    expect(record?.hash).toBe(expectedHash);
    expect(record?.clinically_reviewed).toBe(false);
    expect(history.entries["D08-T03"]?.at(-1)?.hash).toBe(expectedHash);
  });
});
