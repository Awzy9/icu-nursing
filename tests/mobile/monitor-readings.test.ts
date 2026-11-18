import { describe, expect, it } from "vitest";
import { monitorReadings } from "../../mobile/src/core/monitorReadings";

describe("monitorReadings", () => {
  it("extracts the known numeric metrics from a step's real observations (hypoglycemia case, SC-10)", () => {
    const readings = monitorReadings([
      { key: "glucose", label: "Blood glucose (fictional)", value: 3.2, unit: "mmol/L" },
      { key: "skin", label: "Skin", value: "Sweaty" },
      { key: "alertness", label: "Alertness", value: "Drowsy but responds" },
    ] as never);
    expect(readings).toEqual([{ metric: expect.objectContaining({ key: "glucose" }), value: 3.2 }]);
  });
  it("ignores an observation whose label/unit does not match a known metric, and a non-numeric value", () => {
    expect(monitorReadings([{ label: "Unknown thing", value: 5, unit: "x" }])).toEqual([]);
    expect(monitorReadings([{ label: "Blood glucose (fictional)", value: "high", unit: "mmol/L" }])).toEqual([]);
  });
  it("returns an empty array for undefined observations", () => { expect(monitorReadings(undefined)).toEqual([]); });
});
