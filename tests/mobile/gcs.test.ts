import { describe, expect, it } from "vitest";
import { EYE_OPTIONS, gcsCaseSchema, gcsSeverity, gcsTotal, MOTOR_OPTIONS, VERBAL_OPTIONS } from "../../mobile/src/core/gcs";
import { allGcsCases } from "@/lib/working/gcs-case";

describe("GCS scoring (mirrors src/lib/working/gcs.ts exactly)", () => {
  it("computes the total as E+V+M", () => {
    expect(gcsTotal(4, 5, 6)).toBe(15);
    expect(gcsTotal(1, 1, 1)).toBe(3);
    expect(gcsTotal(3, 3, 4)).toBe(10);
  });

  it("classifies severity bands at the documented boundaries", () => {
    expect(gcsSeverity(3)).toBe("severe");
    expect(gcsSeverity(8)).toBe("severe");
    expect(gcsSeverity(9)).toBe("moderate");
    expect(gcsSeverity(12)).toBe("moderate");
    expect(gcsSeverity(13)).toBe("mild");
    expect(gcsSeverity(15)).toBe("mild");
  });

  it("option tables have the correct score ranges and no duplicate scores", () => {
    expect(EYE_OPTIONS.map((o) => o.score).sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    expect(VERBAL_OPTIONS.map((o) => o.score).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(MOTOR_OPTIONS.map((o) => o.score).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("every option has a non-empty bilingual label", () => {
    for (const opt of [...EYE_OPTIONS, ...VERBAL_OPTIONS, ...MOTOR_OPTIONS]) {
      expect(opt.label[0].length).toBeGreaterThan(0);
      expect(opt.label[1].length).toBeGreaterThan(0);
    }
  });
});

describe("gcsCaseSchema and the real dataset", () => {
  const realCases = allGcsCases();

  it("ships at least one real case to validate against", () => {
    expect(realCases.length).toBeGreaterThan(0);
  });

  it("validates every real case against the mobile schema (same shape the content API serves)", () => {
    for (const c of realCases) expect(gcsCaseSchema.safeParse(c).success, `case ${c.key}`).toBe(true);
  });
});
