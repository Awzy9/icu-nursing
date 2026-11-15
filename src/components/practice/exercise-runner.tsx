"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { LText } from "@/components/question-bank/localized";
import { localize } from "@/lib/content/localize";
import { COMPETENCY_LEVELS, presentedOrder, scoreChoice, scoreClassify, scoreSequence, scoreSpot, summariseLevels, type PracticeExercise, type PracticeScore } from "@/lib/practice/types";
import { readLocal, writeLocal } from "./local-progress";

const Mark = ({ ok, t }: { ok: boolean; t: (k: string) => string }) => ok
  ? <span className="inline-flex items-center gap-1 font-medium text-success-foreground"><Check className="size-4" aria-hidden />{t("right")}</span>
  : <span className="inline-flex items-center gap-1 font-medium text-danger-foreground"><X className="size-4" aria-hidden />{t("notQuite")}</span>;

/** Runs one synthetic practice exercise. Scoring is the shared pure engine; the only thing stored is a score or self-rating, on this device. */
export function ExerciseRunner({ exercise, locale }: { exercise: PracticeExercise; locale: string }) {
  const t = useTranslations("Practice");
  const [checked, setChecked] = useState(false);
  const [classify, setClassify] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [choice, setChoice] = useState<string | undefined>();
  const order0 = useMemo(() => (exercise.kind === "sequence" ? presentedOrder(exercise.steps.map((s) => s.id), exercise.code) : []), [exercise]);
  const [order, setOrder] = useState<string[]>(order0);
  const [levels, setLevels] = useState<Record<string, string>>({});
  const [live, setLive] = useState("");
  const resultRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (exercise.kind === "checklist") setLevels(readLocal().levels); }, [exercise.kind]);

  const score: PracticeScore | null = !checked ? null
    : exercise.kind === "classify" ? scoreClassify(exercise, classify)
    : exercise.kind === "spot" ? scoreSpot(exercise, flags)
    : exercise.kind === "sequence" ? scoreSequence(exercise, order)
    : exercise.kind === "choice" ? scoreChoice(exercise, choice) : null;
  const ok = (id: string) => score?.items.find((i) => i.id === id)?.correct ?? false;

  const check = () => {
    setChecked(true);
    const s = exercise.kind === "classify" ? scoreClassify(exercise, classify) : exercise.kind === "spot" ? scoreSpot(exercise, flags) : exercise.kind === "sequence" ? scoreSequence(exercise, order) : exercise.kind === "choice" ? scoreChoice(exercise, choice) : null;
    if (s) { writeLocal((p) => ({ ...p, done: { ...p.done, [exercise.code]: { correct: s.correct, total: s.total, at: Date.now() } } })); setLive(t("scoreLive", { correct: s.correct, total: s.total })); }
    setTimeout(() => resultRef.current?.focus(), 0);
  };
  const reset = () => { setChecked(false); setClassify({}); setFlags(new Set()); setChoice(undefined); setOrder(order0); setLive(""); };
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= order.length) return; const n = [...order]; [n[i], n[j]] = [n[j]!, n[i]!]; setOrder(n); setLive(t("moved", { n: j + 1 })); };
  const setLevel = (id: string, level: string) => { setLevels((l) => ({ ...l, [id]: level })); writeLocal((p) => ({ ...p, levels: { ...p.levels, [id]: level } })); setLive(t("savedHere")); };

  const ready = exercise.kind === "classify" ? exercise.items.every((i) => classify[i.id]) : exercise.kind === "choice" ? Boolean(choice) : true;
  const LABEL = { not_started: t("lvlNot"), learning: t("lvlLearning"), with_support: t("lvlSupport"), independent: t("lvlIndependent") } as const;

  return (
    <div className="space-y-6">
      <p className="max-w-prose"><LText value={exercise.intro} locale={locale} /></p>
      <p role="status" aria-live="polite" className="sr-only">{live}</p>

      {exercise.kind === "classify" ? (
        <ol className="space-y-4">
          {exercise.items.map((it) => (
            <li key={it.id}>
              <fieldset className="rounded-lg border border-border bg-card p-4">
                <legend className="px-1 font-medium"><LText value={it.text} locale={locale} /></legend>
                <div className="mt-2 flex flex-wrap gap-3">
                  {exercise.categories.map((c) => (
                    <label key={c.id} className="inline-flex min-h-11 items-center gap-2">
                      <input type="radio" name={`${exercise.code}-${it.id}`} value={c.id} checked={classify[it.id] === c.id} disabled={checked} onChange={() => setClassify((a) => ({ ...a, [it.id]: c.id }))} />
                      <LText value={c.label} locale={locale} />
                    </label>
                  ))}
                </div>
                {checked ? <p className="mt-2 text-sm"><Mark ok={ok(it.id)} t={t} /> <LText value={it.why} locale={locale} /></p> : null}
              </fieldset>
            </li>
          ))}
        </ol>
      ) : null}

      {exercise.kind === "spot" ? (
        <fieldset className="space-y-3">
          <legend className="font-medium"><LText value={exercise.prompt} locale={locale} /></legend>
          {exercise.lines.map((l) => (
            <div key={l.id} className="rounded-lg border border-border bg-card p-3">
              <label className="flex min-h-11 items-start gap-3">
                <input type="checkbox" className="mt-1" checked={flags.has(l.id)} disabled={checked} onChange={(e) => setFlags((f) => { const n = new Set(f); if (e.target.checked) n.add(l.id); else n.delete(l.id); return n; })} />
                <span><LText value={l.text} locale={locale} /></span>
              </label>
              {checked ? <p className="mt-1 text-sm ps-8"><Mark ok={ok(l.id)} t={t} /> {l.problem ? t("hadProblem") : t("wasSound")} <LText value={l.why} locale={locale} /></p> : null}
            </div>
          ))}
        </fieldset>
      ) : null}

      {exercise.kind === "sequence" ? (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">{t("sequenceHelp")}</p>
          <ol className="space-y-2">
            {order.map((id, i) => { const s = exercise.steps.find((x) => x.id === id)!; return (
              <li key={id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <span className="w-6 text-center font-semibold tabular-nums" aria-hidden>{i + 1}</span>
                <span className="flex-1"><LText value={s.text} locale={locale} />{checked ? <span className="block text-sm"><Mark ok={ok(id)} t={t} /> <LText value={s.why} locale={locale} /></span> : null}</span>
                {!checked ? (
                  <span className="flex gap-1">
                    <Button type="button" size="sm" variant="outline" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t("moveUp", { n: i + 1 })}><ArrowUp className="size-4" aria-hidden /></Button>
                    <Button type="button" size="sm" variant="outline" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={t("moveDown", { n: i + 1 })}><ArrowDown className="size-4" aria-hidden /></Button>
                  </span>
                ) : null}
              </li>); })}
          </ol>
        </div>
      ) : null}

      {exercise.kind === "choice" ? (
        <div className="space-y-4">
          {exercise.table ? (
            <table className="w-full max-w-xl border-collapse text-sm">
              <caption className="sr-only"><LText value={exercise.stem} locale={locale} /></caption>
              <thead><tr>{exercise.table.columns.map((c, i) => <th key={i} scope="col" className="border border-border bg-muted p-2 text-start"><LText value={c} locale={locale} /></th>)}</tr></thead>
              <tbody>{exercise.table.rows.map((r, i) => <tr key={i}><th scope="row" className="border border-border p-2 text-start font-medium"><LText value={r.label} locale={locale} /></th>{r.values.map((v, j) => <td key={j} className="border border-border p-2"><LText value={v} locale={locale} /></td>)}</tr>)}</tbody>
            </table>
          ) : null}
          <fieldset className="space-y-2">
            <legend className="font-medium"><LText value={exercise.stem} locale={locale} /></legend>
            {exercise.options.map((o) => (
              <div key={o.id} className="rounded-lg border border-border bg-card p-3">
                <label className="flex min-h-11 items-start gap-3">
                  <input type="radio" name={`${exercise.code}-choice`} className="mt-1" checked={choice === o.id} disabled={checked} onChange={() => setChoice(o.id)} />
                  <span><LText value={o.text} locale={locale} /></span>
                </label>
                {checked && (choice === o.id || o.correct) ? <p className="mt-1 text-sm ps-8"><Mark ok={o.correct} t={t} /> <LText value={o.feedback} locale={locale} /></p> : null}
              </div>
            ))}
          </fieldset>
        </div>
      ) : null}

      {exercise.kind === "checklist" ? (
        <div className="space-y-4">
          <Callout tone="warning" role="note">{t("selfAssessNotice")}</Callout>
          <ul className="space-y-3">
            {exercise.items.map((it) => (
              <li key={it.id}>
                <fieldset className="rounded-lg border border-border bg-card p-4">
                  <legend className="px-1 font-medium"><LText value={it.text} locale={locale} /></legend>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {COMPETENCY_LEVELS.map((lv) => (
                      <label key={lv} className="inline-flex min-h-11 items-center gap-2">
                        <input type="radio" name={`${exercise.code}-${it.id}`} value={lv} checked={(levels[it.id] ?? "not_started") === lv} onChange={() => setLevel(it.id, lv)} />
                        {LABEL[lv]}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </li>
            ))}
          </ul>
          <ChecklistSummary ids={exercise.items.map((i) => i.id)} levels={levels} />
          <Button type="button" variant="outline" onClick={() => window.print()}>{t("print")}</Button>
        </div>
      ) : null}

      {exercise.kind !== "checklist" ? (
        <div className="flex flex-wrap gap-3">
          {!checked ? <Button type="button" onClick={check} disabled={!ready}>{t("check")}</Button> : <Button type="button" variant="outline" onClick={reset}>{t("tryAgain")}</Button>}
        </div>
      ) : null}

      {checked && score ? (
        <section aria-labelledby="px-result" className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
          <h2 id="px-result" ref={resultRef} tabIndex={-1} className="text-xl font-semibold" data-testid="px-score">{t("scoreHeading", { correct: score.correct, total: score.total })}</h2>
          {score.extra ? <p className="text-sm">{t("spotExtra", { missed: score.extra.missed ?? 0, falseFlags: score.extra.falseFlags ?? 0 })}</p> : null}
          <h3 className="font-medium">{t("keyPoints")}</h3>
          <ul className="list-disc space-y-1 ps-5">{(exercise.debrief[locale] ?? exercise.debrief.en ?? []).map((p, i) => <li key={i}>{p}</li>)}</ul>
        </section>
      ) : null}
      {exercise.kind === "checklist" ? (
        <section className="space-y-2"><h2 className="text-xl font-semibold">{t("keyPoints")}</h2><ul className="list-disc space-y-1 ps-5">{(exercise.debrief[locale] ?? exercise.debrief.en ?? []).map((p, i) => <li key={i}>{p}</li>)}</ul></section>
      ) : null}
    </div>
  );
}

export function ChecklistSummary({ ids, levels }: { ids: readonly string[]; levels: Record<string, string | undefined> }) {
  const t = useTranslations("Practice");
  const s = summariseLevels(levels, ids);
  return (
    <p data-testid="px-levels" className="rounded-md border border-border bg-card p-3 text-sm">
      {t("levelsSummary", { independent: s.independent, support: s.with_support, learning: s.learning, notStarted: s.not_started })}
    </p>
  );
}
export { localize };
