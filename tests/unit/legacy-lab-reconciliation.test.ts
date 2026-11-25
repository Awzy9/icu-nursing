import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
describe("legacy laboratory audit reconciliation", () => {
  it("does not equate optimal damping with verified pressure accuracy", () => {
    const item = read("content/working-aline.json").find((x: {key: string}) => x.key === "ALN-01");
    expect(item.question.answer).toBe(0);
    expect(item.question.options[0]).toContain("dynamic response");
    expect(item.question.explanation).toContain("leveling, zeroing and clinical agreement");
    expect(item.question.explanation).not.toContain("can be trusted");
  });
  it("distinguishes obeying commands and localization and avoids reassuring solely from GCS 15", () => {
    const cases = read("content/working-gcs-cases.json");
    const first = cases.find((x: {key: string}) => x.key === "GCS-01");
    const third = cases.find((x: {key: string}) => x.key === "GCS-03");
    expect(first.vignette).toContain("two-part request");
    expect(first.explanation).toContain("does not exclude neurological injury");
    expect(third.vignette).toContain("trapezius pressure");
    expect(third.vignette).toContain("above the clavicle");
    expect(third.explanation).toContain("M5");
  });
});
