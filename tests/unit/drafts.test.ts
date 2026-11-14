import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { validateDraft } from "@/lib/draft-validator";

const dir = "content/drafts/batch-01";
const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
const good = readFileSync(`${dir}/${files[0]}`, "utf8");

describe("Phase 2 drafts", () => {
  it("has the batch files", () => expect(files.length).toBeGreaterThanOrEqual(5));
  for (const f of files) it(`${f} passes validation`, () => expect(validateDraft(readFileSync(`${dir}/${f}`, "utf8"))).toEqual([]));
  it("rejects claims of review", () => {
    expect(validateDraft(good.replace("clinically_reviewed: false", "clinically_reviewed: true")).length).toBeGreaterThan(0);
    expect(validateDraft(good.replace("status: DRAFT", "status: published")).length).toBeGreaterThan(0);
    expect(validateDraft(good + "\nReviewed by Dr X").length).toBeGreaterThan(0);
  });
  it("rejects dosing and missing banner", () => {
    expect(validateDraft(good + "\nGive 5 mcg/kg/min").some((i) => i.rule === "dosing")).toBe(true);
    expect(validateDraft(good.replace(/NOT clinically reviewed/g, "x")).some((i) => i.rule === "banner")).toBe(true);
  });
});
