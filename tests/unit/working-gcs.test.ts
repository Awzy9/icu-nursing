import { describe, expect, it } from "vitest";
import { gcsTotal, gcsSeverity, EYE_OPTIONS, VERBAL_OPTIONS, MOTOR_OPTIONS } from "@/lib/working/gcs";

describe("GCS scoring", () => {
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

  it("gives the minimum possible total a severe classification and the maximum a mild one", () => {
    expect(gcsSeverity(gcsTotal(1, 1, 1))).toBe("severe");
    expect(gcsSeverity(gcsTotal(4, 5, 6))).toBe("mild");
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
