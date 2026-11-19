// Pure waveform-trace plotting, mirroring src/lib/working/waveform.ts's tracePolyline/zeroLineY
// exactly - a deterministic transform from authored [time, value] data points onto pixel
// coordinates for an SVG polyline. Nothing is interpolated or invented beyond straight lines
// between the authored points; the shape on screen is exactly the authored data.
import { z } from "zod";

export const waveformTraceSchema = z.object({
  label: z.string(),
  unit: z.string(),
  domain: z.tuple([z.number(), z.number()]),
  points: z.array(z.tuple([z.number(), z.number()])),
});
export type WaveformTrace = z.infer<typeof waveformTraceSchema>;

export function tracePolyline(trace: WaveformTrace, width: number, height: number, padding = 4): string {
  const maxTime = Math.max(...trace.points.map((p) => p[0])) || 1;
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
