"use client";
import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EquipmentDiagram } from "./diagram";
import { useEquipmentState } from "./progress-store";
import type { EquipmentState } from "@/lib/equipment/state";

export type ExplorerPart = { id: string; label: string; detail: string };
type Labels = { parts: string; select: string; viewed: string; progress: string; bookmark: string; bookmarked: string; hint: string };

export function EquipmentExplorer({ code, kind, parts, rtl, title, alt, labels, initial }: { initial: EquipmentState; code: string; kind: "loop" | "signal" | "flow"; parts: ExplorerPart[]; rtl: boolean; title: string; alt: string; labels: Labels }) {
  const [sel, setSel] = useState<number | null>(null);
  const { state, error, markViewed, toggleBookmark } = useEquipmentState(initial);
  const viewed = new Set(state.viewed[code] ?? []);
  const isBm = state.bookmarks.includes(code);
  const choose = (i: number) => { setSel(i); markViewed(code, parts[i]!.id); };
  const count = parts.filter((p) => viewed.has(p.id)).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" aria-pressed={isBm} onClick={() => toggleBookmark(code)}>
          {isBm ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
          <span className="ms-2">{isBm ? labels.bookmarked : labels.bookmark}</span>
        </Button>
        <p role="status" className="text-sm text-muted-foreground" data-testid="eq-progress">{labels.progress.replace("{done}", String(count)).replace("{total}", String(parts.length))}</p>
      </div>
      {error ? <p role="alert" className="text-sm text-danger-foreground">{error}</p> : null}
      <figure className="space-y-3 rounded-lg border border-border bg-card p-4">
        <EquipmentDiagram kind={kind} labels={parts.map((p) => p.label)} selected={sel} rtl={rtl} title={title} desc={alt} />
        <figcaption className="text-sm text-muted-foreground">{alt}</figcaption>
      </figure>
      <section aria-labelledby="eq-parts" className="space-y-2">
        <h2 id="eq-parts" className="text-xl font-semibold">{labels.parts}</h2>
        <p className="text-sm text-muted-foreground">{labels.hint}</p>
        <ol className="grid gap-2 sm:grid-cols-2">
          {parts.map((p, i) => (
            <li key={p.id}>
              <button type="button" onClick={() => choose(i)} aria-pressed={sel === i} aria-describedby={sel === i ? "eq-detail" : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-md border px-3 text-start hover:bg-muted ${sel === i ? "border-primary bg-muted font-semibold" : "border-border"}`}>
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-sm" aria-hidden>{i + 1}</span>
                <span>{p.label}</span>
                {viewed.has(p.id) ? <span className="ms-auto text-xs text-muted-foreground">{labels.viewed}</span> : null}
              </button>
            </li>
          ))}
        </ol>
        <div id="eq-detail" role="status" aria-live="polite" className="min-h-12 rounded-md border border-border p-3 text-sm">{sel === null ? labels.select : `${parts[sel]!.label}: ${parts[sel]!.detail}`}</div>
      </section>
    </div>
  );
}
