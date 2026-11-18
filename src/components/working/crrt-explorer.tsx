"use client";
import { useState } from "react";
import type { CrrtComponent } from "@/lib/working/crrt";

export function CrrtExplorer({ components, locale }: { components: CrrtComponent[]; locale: string }) {
  const ar = locale === "ar";
  const [active, setActive] = useState(components[0]!.key);
  const selected = components.find((c) => c.key === active)!;

  return (
    <section aria-label={ar ? "استكشاف دائرة CRRT" : "CRRT circuit explorer"} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <nav aria-label={ar ? "مكونات الدائرة" : "Circuit components"} className="flex flex-wrap gap-2">
        {components.map((c) => (
          <button key={c.key} onClick={() => setActive(c.key)} aria-pressed={active === c.key} className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${active === c.key ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-muted"}`}>
            {c.label[ar ? 1 : 0]}
          </button>
        ))}
      </nav>
      <div role="status" className="rounded-xl bg-muted/40 p-4 space-y-2">
        <h3 className="font-bold">{selected.label[ar ? 1 : 0]}</h3>
        <p className="leading-7 text-sm">{selected.description[ar ? 1 : 0]}</p>
        {selected.alarms.length ? (
          <p className="text-sm font-semibold text-primary">{ar ? "إنذار مرتبط: " : "Related alarm: "}{selected.alarms[ar ? 1 : 0]}</p>
        ) : null}
      </div>
    </section>
  );
}
