import { describe, expect, it } from "vitest";
import { remainingObservations } from "../../mobile/src/core/monitorReadings";
describe("Native scenario observation completeness", () => {
  const observations = [
    { label: "Blood glucose (fictional)", value: 2.4, unit: "mmol/L" },
    { label: "Alertness", value: "Barely rousable" },
    { label: "Swallow", value: "Unsafe" },
    { label: "Intravenous insulin", value: "Not running" },
    { label: "Eye opening", value: "Less than last check" },
  ];
  it("shows every finding when no specialised panel is selected", () => {
    expect(remainingObservations(observations, { numeric: false, neuro: false, perfusion: false })).toEqual(observations);
  });
  it("retains essential findings alongside numeric and comparison panels", () => {
    expect(remainingObservations(observations, { numeric: true, neuro: true, perfusion: true })).toEqual(observations.slice(2, 4));
  });
  it("does not suppress a measurement that the numeric monitor cannot render", () => {
    const value = { label: "Blood glucose (fictional)", value: "Pending" };
    expect(remainingObservations([value], { numeric: true, neuro: false, perfusion: false })).toEqual([value]);
  });
});
