import type { WaveformTrace } from "./waveform";

// Deterministic volume-control ventilation breath model, built directly from the standard
// single-compartment equation of motion taught in respiratory mechanics:
//   Paw(t) = PEEP + V(t)/C + R * flow(t)
// Inspiration uses a constant ("square") flow, as volume-control ventilators deliver; the
// pressure therefore rises as a straight ramp (elastic component) with an instantaneous step at
// flow onset/offset (the resistive component) - this is exactly why peak-minus-plateau pressure
// is taught as a bedside measure of airway resistance. Expiration is passive, unforced exponential
// decay with time constant tau = R*C. This is a simplified, schematic teaching model, not a
// validated device simulator - it deliberately keeps expiratory circuit resistance out of the
// airway-pressure trace (treated as returning cleanly toward PEEP) to stay legible for teaching,
// the same simplification already used in the hand-authored WV-01..03 traces.

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

const HIGH_PRESSURE_ALARM_THRESHOLD = 40; // cmH2O, an illustrative trigger for this model
const LOW_PRESSURE_ALARM_MARGIN = 3; // cmH2O below set PEEP that suggests a disconnect/leak

export function simulateVentCycle(params: VentParams): VentCycleResult {
  const { tidalVolume, respRate, peep, inspiratoryTime: ti, compliance, resistance, inspiratoryPauseTime = 0 } = params;
  const cycleTime = 60 / respRate;
  const disconnected = params.circuitDisconnected === true;

  // A severe circuit leak/disconnect: almost none of the set tidal volume is actually delivered
  // or returned, so pressure never builds and the low-pressure alarm should fire.
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
