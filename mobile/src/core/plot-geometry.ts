import type { WaveformTrace } from "./waveform";
export type WaveformPoint = { x: number; y: number };

/** Compute native on-screen waveform geometry without relying on an SVG renderer. */
export function plotWaveform(trace: WaveformTrace, width: number, height = 152, pad = 7): { points: WaveformPoint[]; zero: number | null } {
  if (!Number.isFinite(width) || width < pad * 2 + 1) return { points: [], zero: null };
  const maxTime = Math.max(1, ...trace.points.map(([time]) => time));
  const [lo, hi] = trace.domain;
  const span = hi - lo || 1;
  const x = (time: number) => pad + (time / maxTime) * (width - 2 * pad);
  const y = (value: number) => pad + (1 - (value - lo) / span) * (height - 2 * pad);
  return {
    points: trace.points.map(([time, value]) => ({ x: x(time), y: y(value) })),
    zero: lo <= 0 && hi >= 0 ? y(0) : null,
  };
}
