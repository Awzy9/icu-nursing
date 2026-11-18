import type { WaveformTrace } from "./waveform";

// Deterministic volume-control ventilation breath model, built directly from the standard
// single-compartment equation of motion taught in respiratory mechanics:
//   Paw(t) = PEEP + V(t)/C + R * flow(t)
// This is one passive breath, starting at set PEEP, with square inspiratory flow.
// During passive expiration the airway opening is held at set PEEP in this model.
// The volume and flow traces show incomplete emptying without modelling repeated breaths.

export interface VentParams {
  tidalVolume: number; // mL
  respRate: number; // breaths/min
  peep: number; // cmH2O
  inspiratoryTime: number; // s
  compliance: number; // mL/cmH2O
  resistance: number; // cmH2O/(L/s)
  inspiratoryPauseTime?: number; // s, default 0
  circuitDisconnected?: boolean; // idealized complete loss of ventilator support
}

export interface VentCycleResult {
  pressure: WaveformTrace; flow: WaveformTrace; volume: WaveformTrace;
  peakPressure: number; plateauPressure: number; cycleTime: number; timeConstant: number; expiratoryTime: number;
  highPressureAlarm: boolean; lowPressureAlarm: boolean;
}

const HIGH_PRESSURE_ALARM_THRESHOLD = 40; // cmH2O, an illustrative trigger for this model

export function simulateVentCycle(params: VentParams): VentCycleResult {
  const { tidalVolume, respRate, peep, inspiratoryTime: ti, compliance, resistance, inspiratoryPauseTime = 0 } = params;
  const cycleTime = 60 / respRate;
  const disconnected = params.circuitDisconnected === true;

  const pauseEnd = ti + inspiratoryPauseTime;
  const expiratoryTime = cycleTime - pauseEnd;
  if (!(expiratoryTime > 0)) throw new RangeError("Breath settings must leave time for expiration");

  const effectiveVt = disconnected ? 0 : tidalVolume;
  const baselinePressure = disconnected ? 0 : peep;
  const flowLps = effectiveVt / 1000 / ti;
  const tau = resistance * compliance / 1000;
  const plateauPressure = baselinePressure + effectiveVt / compliance;
  const peakPressure = plateauPressure + resistance * flowLps;
  const pressure: [number, number][] = [], flow: [number, number][] = [], volume: [number, number][] = [];

  function addPoint(t: number, p: number, f: number, v: number) {
    pressure.push([t, round2(p)]);
    flow.push([t, round2(f)]);
    volume.push([t, round2(v)]);
  }

  addPoint(0, baselinePressure + resistance * flowLps, flowLps * 60, 0);
  addPoint(ti, peakPressure, flowLps * 60, effectiveVt);
  if (inspiratoryPauseTime > 0) {
    addPoint(ti, plateauPressure, 0, effectiveVt);
    addPoint((ti + pauseEnd) / 2, plateauPressure, 0, effectiveVt);
    addPoint(pauseEnd, plateauPressure, 0, effectiveVt);
  }
  for (let i = 0; i <= 40; i++) {
    const elapsed = i / 40 * expiratoryTime;
    const remaining = effectiveVt * Math.exp(-elapsed / tau);
    addPoint(pauseEnd + elapsed, baselinePressure, -remaining / tau * 60 / 1000, remaining);
  }

  const maxP = Math.max(...pressure.map((p) => p[1]));
  const flowVals = flow.map((p) => p[1]);
  const maxFlow = Math.max(...flowVals), minFlow = Math.min(...flowVals);
  return {
    pressure: { label: "Pressure", unit: "cmH2O", domain: [0, Math.max(40, Math.ceil(maxP / 5) * 5)], points: pressure },
    flow: { label: "Flow", unit: "L/min", domain: [Math.floor(minFlow - 5), Math.ceil(maxFlow + 5)], points: flow },
    volume: { label: "Volume", unit: "mL", domain: [0, Math.max(100, effectiveVt * 1.1)], points: volume },
    peakPressure: round2(peakPressure), plateauPressure: round2(plateauPressure), cycleTime: round2(cycleTime), timeConstant: round2(tau), expiratoryTime,
    highPressureAlarm: peakPressure >= HIGH_PRESSURE_ALARM_THRESHOLD,
    lowPressureAlarm: disconnected,
  };
}

function round2(n: number) { return Math.round(n * 100) / 100; }
