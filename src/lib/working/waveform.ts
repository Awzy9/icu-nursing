import waveformData from "../../../content/working-waveforms.json";

export interface WaveformTrace { label: string; unit: string; domain: [number, number]; points: [number, number][] }
export interface WaveformExercise {
  key: string; title: [string, string]; objective: [string, string]; lessonHref: string;
  accessibleDescription: [string, string, string]; traces: WaveformTrace[];
  question: { prompt: string; options: string[]; answer: number; explanation: string };
  evidenceSources: string[];
}

const exercises = waveformData as WaveformExercise[];
export function allWaveformExercises(): WaveformExercise[] { return exercises; }
export function waveformExercise(key: string): WaveformExercise | undefined { return exercises.find((e) => e.key === key); }

// Maps authored [time, value] data points onto SVG pixel coordinates for a <polyline points="...">
// string. A pure, deterministic transform - the shape on screen is exactly the authored data,
// nothing is interpolated or invented beyond straight lines between the authored points.
export function tracePolyline(trace: WaveformTrace, width: number, height: number, padding = 4, timeAxisEnd?: number): string {
  const maxTime = timeAxisEnd ?? (Math.max(...trace.points.map((p) => p[0])) || 1);
  const [lo, hi] = trace.domain;
  const span = hi - lo || 1;
  const x = (t: number) => padding + (t / maxTime) * (width - 2 * padding);
  const y = (v: number) => padding + (1 - (v - lo) / span) * (height - 2 * padding);
  return trace.points.map(([t, v]) => `${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
}

export const zeroLineY = (trace: WaveformTrace, height: number, padding = 4): number | null => {
  const [lo, hi] = trace.domain;
  if (0 < lo || 0 > hi) return null;
  const span = hi - lo || 1;
  return padding + (1 - (0 - lo) / span) * (height - 2 * padding);
};
