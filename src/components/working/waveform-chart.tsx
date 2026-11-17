import { tracePolyline, zeroLineY, type WaveformTrace } from "@/lib/working/waveform";

const WIDTH = 480, HEIGHT = 90;

// A precisely plotted, authored diagram (straight lines between real data points), not a generated
// image: every pixel comes from the trace's own [time, value] points via tracePolyline().
export function WaveformChart({ trace, locale }: { trace: WaveformTrace; locale: string }) {
  const ar = locale === "ar";
  const points = tracePolyline(trace, WIDTH, HEIGHT);
  const zeroY = zeroLineY(trace, HEIGHT);
  return (
    <figure className="space-y-1" role="img" aria-label={`${trace.label} ${ar ? "مقابل الزمن" : "versus time"}, ${trace.unit}`}>
      <figcaption className="flex items-baseline justify-between text-xs font-semibold text-muted-foreground">
        <span lang="en" dir="ltr">{trace.label}</span>
        <span lang="en" dir="ltr">{trace.unit}</span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-24 w-full rounded-lg border border-border bg-card" preserveAspectRatio="none" aria-hidden="true">
        {zeroY !== null ? <line x1={0} x2={WIDTH} y1={zeroY} y2={zeroY} className="stroke-border" strokeWidth={1} strokeDasharray="3 3" /> : null}
        <polyline points={points} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </figure>
  );
}
