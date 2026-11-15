"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge, Callout, ProgressBar } from "@/components/ui/feedback";
import { Link, useRouter } from "@/i18n/navigation";
import { LText } from "@/components/question-bank/localized";
import { completeSkillSessionAction, discardSkillSessionAction, markSkillItemAction } from "@/app/[locale]/skills/actions";
import { CHECKLIST_PHASES, RESULTS, type Result, type SkillSessionView } from "@/lib/skills/types";

type Item = SkillSessionView["items"][number];

/** Self-study checklist. Every tick is the learner's own report: nothing is verified, scored or certified. */
export function ChecklistRunner({ initial, locale }: { initial: SkillSessionView; locale: string }) {
  const t = useTranslations("Skills");
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const summaryRef = useRef<HTMLHeadingElement>(null);
  const done = view.status === "completed";
  const ticked = view.items.filter((i) => i.result === "done").length;
  const total = view.items.length;

  const mark = async (item: Item, result: Result) => {
    setError(null);
    const before = view;
    setView({ ...view, items: view.items.map((i) => (i.id === item.id ? { ...i, result } : i)) });
    const r = await markSkillItemAction(view.id, item.id, result);
    if (!r.ok) { setView(before); setError(t("saveError")); } else setLive(t("savedAnnounce"));
  };
  const finish = async () => {
    setBusy(true); setError(null);
    const r = await completeSkillSessionAction(view.id);
    setBusy(false);
    if (!r.ok) { setError(t("finishError")); return; }
    setView(r.data);
    setTimeout(() => summaryRef.current?.focus(), 0);
  };
  const discard = async () => {
    setBusy(true);
    await discardSkillSessionAction(view.id);
    router.push(`/skills/${view.skill.code}`);
  };

  const phases = CHECKLIST_PHASES.filter((p) => view.items.some((i) => i.phase === p));
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">{t("sessionTitle")}</p>
        <h1 className="text-3xl font-bold"><LText value={view.skill.title} locale={locale} /></h1>
        {view.skill.synthetic ? <Badge tone="warning">{t("syntheticBadge")}</Badge> : null}
      </header>
      <Callout tone="warning" role="note">{t("selfStudyNotice")}</Callout>

      {done && view.summary ? (
        <section aria-labelledby="sum" className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 id="sum" ref={summaryRef} tabIndex={-1} className="text-xl font-semibold">{t("summaryTitle")}</h2>
          <p>{t("summaryBody", { done: view.summary.items_done, total: view.summary.items_total, unsure: view.summary.items_unsure })}</p>
          <p>{t("summaryCritical", { done: view.summary.critical_done, total: view.summary.critical_total })}</p>
          <p className="text-sm text-muted-foreground">{t("summaryNote")}</p>
          <Button asChild variant="outline"><Link href={`/skills/${view.skill.code}`}>{t("summaryBack")}</Link></Button>
        </section>
      ) : (
        <div className="space-y-2" aria-live="off">
          <p className="text-sm" id="prog-label">{t("progressText", { done: ticked, total })}</p>
          <ProgressBar value={total ? (ticked / total) * 100 : 0} label={t("progressText", { done: ticked, total })} />
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">{live}</p>

      {phases.map((phase) => (
        <section key={phase} aria-labelledby={`ph-${phase}`} className="space-y-3">
          <h2 id={`ph-${phase}`} className="text-lg font-semibold">{t(`phases.${phase}`)}</h2>
          <ol className="space-y-3">
            {view.items.filter((i) => i.phase === phase).map((i) => (
              <li key={i.id} className="rounded-lg border border-border bg-card p-3">
                <fieldset disabled={done} className="space-y-2">
                  <legend className="flex flex-wrap items-center gap-2 text-base">
                    <span className="font-medium"><LText value={i.text} locale={locale} /></span>
                    {i.critical ? <Badge tone="danger">{t("critical")}</Badge> : null}
                    {i.support === "local_protocol" ? <Badge>{t("support.local_protocol")}</Badge> : i.support === "partial" ? <Badge>{t("support.partial")}</Badge> : null}
                  </legend>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("stepResult", { n: i.position })}>
                    {RESULTS.map((r) => (
                      <label key={r} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 ${i.result === r ? "border-primary ring-2 ring-primary" : "border-border"}`}>
                        <input type="radio" className="size-4" name={`item-${i.id}`} value={r} checked={i.result === r} onChange={() => mark(i, r)} />
                        <span>{t(r === "done" ? "tickDone" : r === "unsure" ? "tickUnsure" : "tickNot")}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {error ? <Callout tone="danger">{error}</Callout> : null}
      {!done ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={finish} disabled={busy} aria-busy={busy}>{busy ? t("finishing") : t("finish")}</Button>
          {!confirmDiscard ? <Button type="button" variant="outline" onClick={() => setConfirmDiscard(true)}>{t("discard")}</Button> : (
            <div role="group" aria-label={t("discard")} className="flex flex-wrap items-center gap-2">
              <p className="text-sm">{t("discardConfirm")}</p>
              <Button type="button" variant="danger" size="sm" disabled={busy} onClick={discard}>{t("discard")}</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDiscard(false)}>{t("keep")}</Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
