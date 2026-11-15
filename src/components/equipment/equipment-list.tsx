"use client";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import type { EquipmentState } from "@/lib/equipment/state";

export type ListItem = { code: string; category: string; categoryLabel: string; title: string; summary: string; parts: string[]; synthetic: boolean };
type Labels = { onlyBookmarked: string; view: string; bookmarked: string; explored: string; none: string; synthetic: string; partsDone: string; stats: string };

export function EquipmentList({ items, labels, state }: { items: ListItem[]; labels: Labels; state: EquipmentState }) {
  const store = state, ready = true;
  const [only, setOnly] = useState(false);
  const bm = new Set(store.bookmarks);
  const shown = items.filter((i) => !only || bm.has(i.code));
  const explored = items.filter((i) => i.parts.every((p) => (store.viewed[i.code] ?? []).includes(p))).length;
  const cats = [...new Set(shown.map((i) => i.category))];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex min-h-11 items-center gap-2"><input type="checkbox" className="size-4" checked={only} onChange={(e) => setOnly(e.target.checked)} />{labels.onlyBookmarked}</label>
        <p role="status" className="text-sm text-muted-foreground" data-testid="eq-stats">{ready ? labels.stats.replace("{done}", String(explored)).replace("{total}", String(items.length)).replace("{bm}", String(bm.size)) : ""}</p>
      </div>
      {shown.length === 0 ? <p role="status" className="rounded-md border border-border p-3 text-sm">{labels.none}</p> : null}
      {cats.map((c) => {
        const group = shown.filter((i) => i.category === c);
        return (
          <section key={c} aria-labelledby={`eqc-${c}`} className="space-y-3">
            <h2 id={`eqc-${c}`} className="text-xl font-semibold">{group[0]!.categoryLabel}</h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {group.map((i) => {
                const done = i.parts.filter((p) => (store.viewed[i.code] ?? []).includes(p)).length;
                return (
                  <li key={i.code} className="space-y-3 rounded-lg border border-border bg-card p-4">
                    <h3 className="text-lg font-semibold">{i.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {i.synthetic ? <Badge tone="warning">{labels.synthetic}</Badge> : null}
                      {bm.has(i.code) ? <Badge tone="success">{labels.bookmarked}</Badge> : null}
                      {ready ? <span className="text-muted-foreground">{labels.partsDone.replace("{done}", String(done)).replace("{total}", String(i.parts.length))}</span> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{i.summary}</p>
                    <Button asChild variant="outline"><Link href={`/equipment/${i.code}`}>{labels.view}<span className="sr-only"> — {i.title}</span></Link></Button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
