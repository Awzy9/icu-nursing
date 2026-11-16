"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Callout, ProgressBar } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { tenthsToPercentString } from "@/lib/question-bank/score";
import { LText } from "@/components/question-bank/localized";
import type { CaseAttemptView, CaseObservation, CaseTrailStep } from "@/lib/cases/types";
import { chooseCaseAction } from "@/app/[locale]/cases/actions";

const LETTERS: Record<string, string[]> = { en: ["A", "B", "C", "D"], ar: ["أ", "ب", "ج", "د"] };

/** The readings of the changing situation, with the change since the previous decision and the position against an authored band, all in words (never colour alone). */
function Observations({ items, previous, locale, title }: { items: CaseObservation[]; previous?: CaseObservation[]; locale: string; title: string }) {
  const t = useTranslations("Cases");
  if (items.length === 0) return null;
  const fmt = new Intl.NumberFormat(locale);
  const show = (o: CaseObservation) => `${typeof o.value === "number" ? fmt.format(o.value) : o.value}${o.unit ? ` ${o.unit}` : ""}`;
  return (
    <div className="space-y-1" data-testid="observations">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={title}>
        <table className="w-full min-w-[28rem] text-sm">
          <thead><tr className="text-start text-muted-foreground"><th scope="col" className="py-1 pe-3 text-start font-medium">{t("colReading")}</th><th scope="col" className="py-1 pe-3 text-start font-medium">{t("colValue")}</th><th scope="col" className="py-1 pe-3 text-start font-medium">{t("colChange")}</th><th scope="col" className="py-1 text-start font-medium">{t("colStatus")}</th></tr></thead>
          <tbody>
            {items.map((o) => {
              const prev = previous?.find((x) => x.key === o.key);
              const change = !prev ? t("changeFirst") : prev.value === o.value ? t("changeSame") : typeof o.value === "number" && typeof prev.value === "number" ? (o.value > prev.value ? t("changeUp", { from: fmt.format(prev.value) }) : t("changeDown", { from: fmt.format(prev.value) })) : t("changeUp", { from: String(prev.value) });
              const band = typeof o.value !== "number" || (o.low === undefined && o.high === undefined) ? t("bandNone") : o.high !== undefined && o.value > o.high ? t("bandAbove") : o.low !== undefined && o.value < o.low ? t("bandBelow") : t("bandWithin");
              return (
                <tr key={o.key} className="border-t border-border">
                  <th scope="row" className="py-1 pe-3 text-start font-medium"><LText value={o.label} locale={locale} /></th>
                  <td className="py-1 pe-3 tabular-nums">{show(o)}</td><td className="py-1 pe-3">{change}</td><td className="py-1">{band}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Structured debrief shown after a completed attempt: learning points, decisions to revisit, scope-of-practice summary and related learning. */
function Debrief({ view, locale }: { view: CaseAttemptView; locale: string }) {
  const t = useTranslations("Cases");
  const topic = useTranslations("Topic");
  const d = view.summary?.debrief;
  if (!d) return null;
  const points = d.learning_points ? (d.learning_points[locale] ?? d.learning_points.en ?? []) : [];
  const fallback = Boolean(d.learning_points) && locale !== "en" && !d.learning_points![locale];
  const href = (l: { kind: string; code: string }) => (l.kind === "skill" ? `/skills/${l.code}` : l.kind === "medication" ? `/medications/${l.code}` : `/library/${l.code}`);
  const label = (l: { kind: string; code: string }) => (l.kind === "skill" ? t("openSkill", { code: l.code }) : l.kind === "medication" ? t("openMedication", { code: l.code }) : t("openTopic", { code: l.code }));
  return (
    <section aria-labelledby="cs-debrief" className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6" data-testid="debrief">
      <div className="space-y-1">
        <h2 id="cs-debrief" className="text-xl font-semibold">{t("debriefTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("debriefIntro")}</p>
      </div>
      {points.length ? (
        <div className="space-y-1">
          <h3 className="font-semibold">{t("learningPoints")}</h3>
          <ul className="list-disc space-y-1 ps-5" {...(fallback ? { lang: "en", dir: "ltr" } : {})}>{points.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="font-semibold">{t("revisitTitle")}</h3>
        {d.revisit_positions.length ? <ul className="list-disc space-y-1 ps-5">{d.revisit_positions.map((n) => <li key={n}>{t("revisitItem", { n })}</li>)}</ul> : <p>{t("revisitNone")}</p>}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">{t("scopeCountsTitle")}</h3>
        <ul className="list-disc space-y-1 ps-5">{Object.entries(d.scope_counts).map(([k, n]) => <li key={k}>{t("scopeCountItem", { label: topic("scope." + k), n })}</li>)}</ul>
      </div>
      {d.links.length ? (
        <div className="space-y-1">
          <h3 className="font-semibold">{t("linksTitle")}</h3>
          <ul className="list-disc space-y-1 ps-5">{d.links.map((l) => <li key={`${l.kind}-${l.code}`}><Link href={href(l)}>{label(l)}</Link></li>)}</ul>
        </div>
      ) : null}
    </section>
  );
}

function Trail({ step, locale, expanded }: { step: CaseTrailStep; locale: string; expanded: boolean }) {
  const t = useTranslations("Cases");
  const topic = useTranslations("Topic");
  const letters = LETTERS[locale] ?? LETTERS.en!;
  return (
    <details open={expanded} className="rounded-lg border border-border bg-card p-4">
      <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-2 font-semibold">
        <span>{t("decisionOf", { n: step.position })}</span>
        <Badge tone={step.points === 2 ? "success" : step.points === 1 ? "warning" : "danger"}>{t("points", { points: step.points })}</Badge>
      </summary>
      <div className="mt-3 space-y-3">
        <LText as="p" value={step.info} locale={locale} />
        <Observations items={step.observations} locale={locale} title={t("observationsAt", { n: step.position })} />
        <LText as="p" value={step.prompt} locale={locale} className="font-medium" />
        <ul className="space-y-2">
          {step.options.map((o, oi) => {
            const mine = o.id === step.chosen_option_id;
            return (
              <li key={o.id} className={cn("rounded-md border p-3 text-sm", mine ? "border-primary ring-2 ring-primary" : "border-border", o.points === 2 && "bg-success text-success-foreground")}>
                <p className="flex flex-wrap items-center gap-2">
                  <span aria-hidden className="inline-flex size-6 items-center justify-center rounded-full border border-current text-xs font-semibold">{letters[oi]}</span>
                  <LText value={o.text} locale={locale} />
                  {mine ? <span className="font-semibold">· {t("yourChoice")}</span> : null}
                  {o.points === 2 ? <span className="inline-flex items-center gap-1 font-semibold"><CheckCircle2 className="size-4" aria-hidden />{t("bestChoice")}</span> : null}
                  <Badge>{t("points", { points: o.points })}</Badge>
                </p>
                <p className="mt-1"><span className="font-semibold">{topic("scope." + o.scope)}</span> — <LText value={o.feedback} locale={locale} /></p>
                {o.consequence ? <p className="mt-1"><span className="font-semibold">{mine ? t("whatHappened") : t("consequence")}:</span> <LText value={o.consequence} locale={locale} /></p> : null}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">{t("scopeNote")}</p>
      </div>
    </details>
  );
}

export function CaseRunner({ initial, locale }: { initial: CaseAttemptView; locale: string }) {
  const t = useTranslations("Cases");
  const [view, setView] = useState(initial);
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState("");
  const feedbackRef = useRef<HTMLHeadingElement>(null);
  const stepRef = useRef<HTMLHeadingElement>(null);
  const committed = useRef(false);
  const letters = LETTERS[locale] ?? LETTERS.en!;

  useEffect(() => { if (committed.current) feedbackRef.current?.focus(); }, [view.trail.length]);

  const cur = view.current;
  const done = view.status === "completed";
  const latest = view.trail.at(-1);

  async function commit() {
    if (!cur || !choice || busy) return;
    setBusy(true);
    setError(null);
    const r = await chooseCaseAction(view.id, cur.position, choice);
    setBusy(false);
    if (r.ok) {
      committed.current = true;
      setView(r.data);
      setChoice(null);
      setLive(t("feedbackTitle", { n: r.data.trail.at(-1)!.position }));
    } else setError(r.code === "not_found" ? t("attemptGone") : t("actionError"));
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold"><LText value={view.case.title} locale={locale} /></h1>
          {view.case.synthetic ? <Badge tone="warning">{t("syntheticBadge")}</Badge> : null}
          <Badge>{t(`difficulty${view.case.difficulty}` as "difficulty1")}</Badge>
        </div>
        <LText as="p" value={view.case.vignette} locale={locale} className="text-sm text-muted-foreground" />
        {!done ? <ProgressBar value={(view.trail.length / view.case.steps) * 100} label={t("progressLabel")} /> : null}
      </header>
      <div role="status" aria-live="polite" className="sr-only">{live}</div>

      {done && view.summary ? (
        <section aria-labelledby="cs-sum" className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-[auto_1fr] sm:p-6">
          <div>
            <h2 id="cs-sum" className="text-sm text-muted-foreground">{t("summaryTitle")} · {t("summaryScore")}</h2>
            <p className="text-5xl font-bold tabular-nums" data-testid="case-score">{tenthsToPercentString(view.summary.score_tenths)}%</p>
          </div>
          <div className="space-y-1 self-center text-sm">
            <p data-testid="case-points">{t("summaryPoints", { points: view.summary.points, max: view.summary.max_points, steps: view.summary.steps })}</p>
            <p className="text-muted-foreground">{t("summaryTime")}: {t("durationValue", { m: Math.floor(view.summary.duration_seconds / 60), s: view.summary.duration_seconds % 60 })}</p>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">{t("scoreNote")}</p>
        </section>
      ) : null}

      {done ? <Debrief view={view} locale={locale} /> : null}

      {view.trail.length ? (
        <section aria-labelledby="cs-trail" className="space-y-3">
          <h2 id="cs-trail" className="text-xl font-semibold">{done ? t("pathTitle") : t("feedbackTitle", { n: latest!.position })}</h2>
          <h3 ref={feedbackRef} tabIndex={-1} className="sr-only">{t("feedbackTitle", { n: latest!.position })}</h3>
          <div className="space-y-3">
            {view.trail.map((s, i) => <Trail key={s.position} step={s} locale={locale} expanded={done ? false : i === view.trail.length - 1} />)}
          </div>
        </section>
      ) : null}

      {cur ? (
        <section aria-labelledby="cs-step" className="space-y-4 rounded-lg border-2 border-primary bg-card p-4 sm:p-6">
          <h2 id="cs-step" ref={stepRef} tabIndex={-1} className="text-lg font-semibold outline-none">{t("decisionOf", { n: cur.position })}</h2>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">{t("situation")}</p>
            <LText as="p" value={cur.info} locale={locale} />
          </div>
          <Observations items={cur.observations} previous={latest?.observations} locale={locale} title={t("observationsTitle")} />
          <fieldset className="space-y-3">
            <legend className="mb-2 font-medium"><LText value={cur.prompt} locale={locale} /><span className="sr-only"> {t("yourDecision")}</span></legend>
            <ul className="space-y-3">
              {cur.options.map((o, oi) => (
                <li key={o.id}>
                  <label className={cn("flex min-h-12 cursor-pointer gap-3 rounded-md border p-3 hover:bg-muted has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2", choice === o.id ? "border-primary bg-muted ring-2 ring-primary" : "border-border")}>
                    <input type="radio" name={`step-${cur.position}`} value={o.id} checked={choice === o.id} disabled={busy} onChange={() => setChoice(o.id)} className="mt-1 size-5 shrink-0" />
                    <span aria-hidden className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">{letters[oi]}</span>
                    <span className="flex-1"><LText value={o.text} locale={locale} /></span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          {error ? <Callout tone="danger">{error}</Callout> : null}
          <div className="space-y-2">
            <Button type="button" onClick={() => void commit()} disabled={!choice || busy} aria-busy={busy}>{busy ? t("committing") : t("commit")}</Button>
            <p className="text-xs text-muted-foreground">{t("commitHelp")}</p>
          </div>
        </section>
      ) : null}

      {done ? (
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link href="/cases">{t("startAnother")}</Link></Button>
          <Button asChild variant="outline"><Link href="/cases">{t("backToCases")}</Link></Button>
        </div>
      ) : (
        <p><Link href="/cases">{t("backToCases")}</Link></p>
      )}
    </div>
  );
}
