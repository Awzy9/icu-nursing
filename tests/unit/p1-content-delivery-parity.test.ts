import { describe, expect, it } from "vitest";
import { buildWorkingContent } from "../../scripts/build-working-content";
import { catalogEntryResponseSchema } from "../../packages/schemas/src/working-content";

// In-process projection only: this neither publishes the catalog nor bypasses API release gates.
const entries = buildWorkingContent();
function projected(key: string) {
  const entry = entries.find(e => e.key === key);
  expect(entry).toBeDefined();
  return catalogEntryResponseSchema.parse({ version: "test-only", entry }).entry;
}
describe("working content delivery parity", () => {
  it("validates every generated catalog entry against the native client's shared schema", () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      const result = catalogEntryResponseSchema.safeParse({ version: "test-only", entry });
      expect(result.success, entry.key).toBe(true);
    }
  });
  it.each(["D04-T02", "D04-T09"])("preserves draft-only renal guideline status: %s", key => {
    const entry = projected(key);
    expect(entry.body).toContain("2027 public-review draft");
    expect(entry.body).toMatch(/not (?:be cited as|used as|been established as) final|not a final guideline/);
  });
  it("preserves seizure reassessment and resuscitation guidance in structured scenario feedback", () => {
    const entry = projected("SC-08");
    const best = entry.scenario?.steps[0]?.options.find(o => o.points === 2);
    expect(best?.feedback).toContain("reassess airway patency and breathing promptly");
    expect(best?.feedback).toContain("Do not use positioning in place of indicated resuscitation");
  });
  it("preserves practice feedback and the competency scope warning in the structured projection", () => {
    expect(projected("PX-05").practice?.options?.find(o => o.correct)?.feedback).toContain("activate the local emergency response without waiting for a score threshold");
    const checklist = projected("PX-12").practice;
    expect(checklist?.setup).toContain("does not establish observed proficiency");
    expect(checklist?.items).toHaveLength(25);
  });
});
