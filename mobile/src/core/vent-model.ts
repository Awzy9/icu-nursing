// Deterministic volume-control ventilation breath model, mirroring src/lib/working/vent-model.ts
// exactly (same single-compartment equation of motion, same constants) - this computes live from
// slider input, unlike the static-content labs, so unlike abg.ts/infusion.ts it IS ported in full
// rather than left to the website's own test suite. A test cross-checks mobile's output against
// the website's own simulateVentCycle on the same inputs.
import type { WaveformTrace } from "./waveform";

export interface VentParams {
  tidalVolume: number; // mL
  respRate: number; // breaths/min
  peep: number; // cmH2O
  inspiratoryTime: number; // s
  compliance: number; // mL/cmH2O
  resistance: number; // cmH2O/(L/s)
  inspiratoryPauseTime?: number; // s, default 0
  circuitDisconnected?: boolean; // if true, models a leak so severe almost nothing is delivered
}

export interface VentCycleResult {
  pressure: WaveformTrace; flow: WaveformTrace; volume: WaveformTrace;
  peakPressure: number; plateauPressure: number; cycleTime: number; timeConstant: number;
  highPressureAlarm: boolean; lowPressureAlarm: boolean;
}

const HIGH_PRESSURE_ALARM_THRESHOLD = 40; // cmH2O, a common default ventilator high-pressure limit
const LOW_PRESSURE_ALARM_MARGIN = 3; // cmH2O below set PEEP that suggests a disconnect/leak

export function simulateVentCycle(params: VentParams): VentCycleResult {
  const { tidalVolume, respRate, peep, inspiratoryTime: ti, compliance, resistance, inspiratoryPauseTime = 0 } = params;
  const cycleTime = 60 / respRate;
  const disconnected = params.circuitDisconnected === true;

  const effectiveVt = disconnected ? tidalVolume * 0.03 : tidalVolume;
  const flowLps = (effectiveVt / 1000) / ti; // L/s, constant during inspiration
  const complianceL = compliance / 1000; // L/cmH2O
  const tau = Math.max(resistance * complianceL, 0.01); // s, avoid div-by-zero on pathological inputs

  const plateauPressure = peep + effectiveVt / compliance;
  const peakPressure = plateauPressure + resistance * flowLps;

  const inspEnd = ti;
  const pauseEnd = ti + inspiratoryPauseTime;
  const steps = 40;
  const pressure: [number, number][] = [], flow: [number, number][] = [], volume: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * cycleTime;
    let v: number, f: number, p: number;
    if (t <= inspEnd) {
      v = effectiveVt * (t / inspEnd || 0);
      f = flowLps * 60; // L/s -> L/min, for display
      p = peep + v / compliance + resistance * flowLps;
    } else if (t <= pauseEnd) {
      v = effectiveVt; f = 0; p = plateauPressure;
    } else {
      const te = t - pauseEnd;
      v = effectiveVt * Math.exp(-te / tau);
      f = -(effectiveVt / tau) * Math.exp(-te / tau) * 60 / 1000; // L/min, negative = expiratory
      p = peep + v / compliance;
    }
    pressure.push([round2(t), round2(p)]);
    flow.push([round2(t), round2(f)]);
    volume.push([round2(t), round2(v)]);
  }

  const maxP = Math.max(...pressure.map((p) => p[1]));
  const flowVals = flow.map((p) => p[1]);
  const maxFlow = Math.max(...flowVals), minFlow = Math.min(...flowVals);
  return {
    pressure: { label: "Pressure", unit: "cmH2O", domain: [0, Math.max(40, Math.ceil(maxP / 5) * 5)], points: pressure },
    flow: { label: "Flow", unit: "L/min", domain: [Math.floor(minFlow - 5), Math.ceil(maxFlow + 5)], points: flow },
    volume: { label: "Volume", unit: "mL", domain: [0, Math.max(100, effectiveVt * 1.1)], points: volume },
    peakPressure: round2(peakPressure), plateauPressure: round2(plateauPressure), cycleTime: round2(cycleTime), timeConstant: round2(tau),
    highPressureAlarm: peakPressure >= HIGH_PRESSURE_ALARM_THRESHOLD,
    lowPressureAlarm: disconnected || maxP < peep + LOW_PRESSURE_ALARM_MARGIN,
  };
}

function round2(n: number) { return Math.round(n * 100) / 100; }
