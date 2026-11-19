import { describe, expect, it } from "vitest";
import { simulateVentCycle as simulateVentCycleMobile, type VentParams } from "../../mobile/src/core/vent-model";
import { simulateVentCycle as simulateVentCycleWeb } from "@/lib/working/vent-model";

// vent-model.ts computes live from slider input (unlike the static-content labs), so it is
// ported in full to mobile's core rather than left to the website's own test suite. This
// cross-checks mobile's output against the website's own simulateVentCycle - no drift between
// the two mirrors - across the same scenario presets the UI offers plus a few edge cases.
const DEFAULTS: VentParams = { tidalVolume: 450, respRate: 14, peep: 5, inspiratoryTime: 1, compliance: 50, resistance: 10 };

const CASES: VentParams[] = [
  DEFAULTS,
  { ...DEFAULTS, compliance: 15, resistance: 14 }, // stiff lungs
  { ...DEFAULTS, resistance: 32, compliance: 45 }, // high airway resistance
  { ...DEFAULTS, circuitDisconnected: true }, // circuit disconnect
  { tidalVolume: 200, respRate: 30, peep: 0, inspiratoryTime: 0.6, compliance: 80, resistance: 5 }, // slider min bounds
  { tidalVolume: 600, respRate: 8, peep: 15, inspiratoryTime: 2, compliance: 15, resistance: 35 }, // slider max bounds
  { ...DEFAULTS, inspiratoryPauseTime: 0.3 }, // inspiratory pause
];

describe("simulateVentCycle (mirrors src/lib/working/vent-model.ts exactly)", () => {
  it("agrees with the website's own simulateVentCycle for every case - no drift between the two mirrors", () => {
    for (const params of CASES) {
      expect(simulateVentCycleMobile(params)).toEqual(simulateVentCycleWeb(params));
    }
  });

  it("fires the high-pressure alarm once peak pressure reaches 40 cmH2O, and the low-pressure alarm on a circuit disconnect", () => {
    const stiff = simulateVentCycleMobile({ ...DEFAULTS, compliance: 15, resistance: 30 });
    expect(stiff.highPressureAlarm).toBe(true);
    const disconnect = simulateVentCycleMobile({ ...DEFAULTS, circuitDisconnected: true });
    expect(disconnect.lowPressureAlarm).toBe(true);
  });
});
