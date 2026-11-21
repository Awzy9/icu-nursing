import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const topic = "content/drafts/batch-02/D07-T06-enteral-feeding.md";
const skillFiles = [
  ["SK-10", "content/drafts/skills/SK-10-enteral-feeding.json"],
  ["SK-11", "content/drafts/skills/SK-11-nasogastric-tube-care.json"],
] as const;

describe("2026-11-21 nasogastric placement and enteral feeding safety", () => {
  it("does not equate unchanged external markings with safe internal position", () => {
    const content = read(topic);
    expect(content).toContain("External marks alone cannot prove correct initial placement");
    expect(content).toContain("rule out internal displacement even if the external length is unchanged");
    expect(content).toContain("Do not flush, give medication or start feeding");
    expect(content).toContain("2026 systematic review");
    for (const [, file] of skillFiles) {
      const skill = JSON.parse(read(file));
      const safety = skill.sections.safety.items.map((i: {text: string}) => i.text).join(" ");
      expect(safety).toMatch(/external (marks|tube markers)/i);
      expect(safety).toMatch(/internal displacement/i);
    }
  });

  it("requires withholding all tube use when placement remains uncertain", () => {
    const sk10 = JSON.parse(read(skillFiles[0][1]));
    const sk11 = JSON.parse(read(skillFiles[1][1]));
    expect(sk10.sections.safety.items[0].text).toContain("Never flush, give medicines, water or feed");
    expect(sk11.sections.escalation.items[0].text).toContain("Withhold feed, medications, water and flushing");
    expect(sk11.sections.escalation.items[0].text).toContain("do not use auscultation");
    expect(sk11.sections.assessment.items[0].text).toContain("An unchanged length is only an adjunct");
  });

  it("retains DRAFT status and consistent SHA index and revision history", () => {
    const entries = JSON.parse(read("src/content/draft-index.json")).entries as {
      key: string; type: string; hash: string; clinically_reviewed: boolean; gaps: number;
    }[];
    const history = JSON.parse(read("src/content/draft-history.json")).entries as Record<string, {hash: string}[]>;
    const paths = [
      ["D07-T06", "topics", topic],
      ...skillFiles.map(([id, file]) => [id, "skills", file]),
    ] as [string, string, string][];
    for (const [key, type, file] of paths) {
      const raw = read(file);
      const metadata = entries.find(e => e.key === key && e.type === type);
      const obj = type === "skills" ? JSON.parse(raw) : null;
      const hash = createHash("sha256").update(type === "topics" ? raw.replace(/\r\n/g, "\n") : JSON.stringify(obj)).digest("hex").slice(0, 16);
      expect(metadata?.hash, key).toBe(hash);
      expect(metadata?.clinically_reviewed, key).toBe(false);
      expect(history[key]?.at(-1)?.hash, key).toBe(hash);
      if (obj) {
        expect(obj.status).toBe("DRAFT");
        expect(obj.clinically_reviewed).toBe(false);
        expect(metadata?.gaps).toBe(obj.gaps.length);
      } else {
        expect(raw).toContain("status: DRAFT");
        expect(raw).toContain("clinically_reviewed: false");
      }
    }
  });
});
