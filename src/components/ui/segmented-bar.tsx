import { cn } from "@/lib/utils";

export interface Segment { value: number; label: string; className: string }

/**
 * Stacked proportional bar with a text alternative: never relies on colour alone. `description` is read by screen readers
 * (for example "3 correct, 2 incorrect, 5 not yet answered"); the visible legend repeats it.
 */
export function SegmentedBar({ segments, label, legend = true }: { segments: Segment[]; label: string; legend?: boolean }) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  const description = segments.map((s) => `${s.value} ${s.label}`).join(", ");
  return (
    <div className="space-y-1">
      <div role="img" aria-label={`${label}: ${description}`} className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {total > 0 ? segments.filter((s) => s.value > 0).map((s) => <div key={s.label} className={cn("h-full", s.className)} style={{ width: `${(s.value / total) * 100}%` }} />) : null}
      </div>
      {legend ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
          {segments.map((s) => (
            <li key={s.label} className="inline-flex items-center gap-1"><span className={cn("inline-block size-2.5 rounded-sm border border-border", s.className)} />{s.value} {s.label}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
