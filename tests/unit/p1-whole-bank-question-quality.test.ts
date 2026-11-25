import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { loadExistingViews, loadExpansion } from "../../scripts/validate-mcq-expansion";
import { nearDuplicates, parseMcqViews } from "@/lib/mcq-expansion-validator";
import { validateDraft } from "@/lib/draft-validator";

const paths = ["content/drafts/batch-03/D01-T12-ett-care-cuff-pressure.md","content/drafts/batch-03/D04-T03-urine-output-fluid-balance.md","content/drafts/batch-04/D01-T19-respiratory-deterioration.md","content/drafts/batch-05/D07-T01-head-to-toe-assessment.md","content/drafts/batch-08/D01-T06-mechanical-ventilation-fundamentals-modes.md"];
const keys = ["BDCADB","CADBBC","DDBCAB","ADBCCB","BDACCD"];
const questions = [5,5,4,4,5];
describe("Whole-bank question quality", () => {
  paths.forEach((path, i) => it("retains keys and strengthens clinical context: " + path, () => {
    const draft = readFileSync(path, "utf8");
    expect(validateDraft(draft)).toEqual([]);
    expect([...draft.matchAll(/^\*\*Answer: ([A-D])\.\*\*/gm)].map(m => m[1]).join("")).toBe(keys[i]);
    expect(draft).toContain("clinically_reviewed: false");
    const views = parseMcqViews(draft, path);
    expect(views[questions[i]! - 1]!.stem.length).toBeGreaterThanOrEqual(60);
  }));

  it("checks all core and expansion questions for lexical duplication", () => {
    const core = loadExistingViews();
    const expansion = loadExpansion().flatMap(s => parseMcqViews(s.text, s.file.slice(0,5)));
    const all = [...core, ...expansion];
    expect(core).toHaveLength(240);
    expect(expansion).toHaveLength(66);
    expect(new Set(all.map(v => v.key)).size).toBe(all.length);
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2);
    const sets = all.map(v => new Set(norm(v.stem + " " + v.opts.join(" "))));
    const duplicateOptions = all.filter(v => new Set(v.opts.map(o => norm(o).join(" "))).size !== 4).map(v => v.key);
    const pairs: string[] = [];
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = sets[i]!, b = sets[j]!;
      const inter = [...a].filter(w => b.has(w)).length;
      if (a.size > 4 && inter / (a.size + b.size - inter) >= 0.7) pairs.push(all[i]!.key + " ~ " + all[j]!.key);
    }
    expect(duplicateOptions).toEqual([]);
    expect(pairs).toEqual([]);
    expect(nearDuplicates(expansion, all)).toEqual([]);
  });
});
