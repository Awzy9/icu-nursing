import type { WaveformExercise } from "./waveformExercise";
import type { WaveformTrace } from "./waveform";

export type WaveformUnit = "cmH2O" | "L/min" | "mL";
export interface WaveformPair {
  reference: WaveformTrace;
  comparison: WaveformTrace;
  timeAxisEnd: number;
}

/** Use identical x/y scales so comparing two clinical traces cannot distort differences. */
export function comparableWaveforms(reference: WaveformExercise, other: WaveformExercise, unit: WaveformUnit): WaveformPair | null {
  const first = reference.traces.find((trace) => trace.unit === unit);
  const second = other.traces.find((trace) => trace.unit === unit);
  if (!first || !second || !first.points.length || !second.points.length) return null;
  const bounds = [
    ...first.points.map((p) => p[1]),
    ...second.points.map((p) => p[1]),
    ...first.domain,
    ...second.domain,
  ];
  const lo = Math.min(...bounds);
  const hi = Math.max(...bounds);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
  const domain: [number, number] = lo === hi ? [lo - 1, hi + 1] : [lo, hi];
  const timeAxisEnd = Math.max(1, ...[...first.points, ...second.points].map(([t]) => t));
  return {
    reference: { ...first, label: `Reference — ${first.label}`, domain },
    comparison: { ...second, label: `Compare — ${second.label}`, domain },
    timeAxisEnd,
  };
}
