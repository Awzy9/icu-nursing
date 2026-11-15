import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, Flag, XCircle } from "lucide-react";
import { Badge, Callout, ProgressBar } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Link, redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/content/localize";
import { getQuestionBankService, resolveMode } from "@/lib/question-bank";
import { tenthsToPercentString } from "@/lib/question-bank/score";
import { LText } from "@/components/question-bank/localized";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "QuestionBank" });
  return { title: t("resultsTitle"), robots: { index: false, follow: false } };
}
const FILTERS = ["all", "incorrect", "flagged", "unanswered"] as const;
type Filter = (typeof FILTERS)[number];
const LETTERS: Record<string, string[]> = { en: ["A", "B", "C", "D"], ar: ["أ", "ب", "ج", "د"] };

export default async function ResultsPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ show?: string }> }) {
  const { locale, id } = await params;
  const { show } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("QuestionBank");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const mode = resolveMode();
  if (mode === "disabled") notFound();
  if (mode === "database") await requireUser(locale, `/question-bank/attempt/${id}/results`);
  const svc = await getQuestionBankService().catch(() => null);
  if (!svc) notFound();
  const attempt = await svc.getAttempt(id).catch(() => undefined);
  if (attempt === undefined) return <Callout tone="danger">{t("loadError")}</Callout>;
  if (!attempt || attempt.status === "abandoned") notFound();
  if (attempt.status !== "completed" || !attempt.summary) redirect({ href: `/question-bank/attempt/${id}`, locale });
  const s = attempt.summary!;
  const filter: Filter = (FILTERS as readonly string[]).includes(show ?? "") ? (show as Filter) : "all";
  const letters = LETTERS[locale] ?? LETTERS.en!;

  const visible = attempt.items.filter((i) => {
    if (filter === "incorrect") return !i.voided && i.selected_option_id !== null && i.feedback?.is_correct === false;
    if (filter === "flagged") return i.flagged;
    if (filter === "unanswered") return !i.voided && i.selected_option_id === null;
    return true;
  });
  const fmt = new Intl.NumberFormat(locale);
  const mins = Math.floor(s.duration_seconds / 60);

  return (
    <div className="space-y-8">
      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("resultsTitle")} · {t(attempt.mode)}</h1>
        {s.timed_out ? <Callout tone="warning">{t("timedOutNotice")}</Callout> : null}
      </header>

      <section aria-labelledby="qb-score-h" className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-[auto_1fr] sm:p-6">
        <div>
          <h2 id="qb-score-h" className="text-sm text-muted-foreground">{t("scoreLabel")}</h2>
          <p className="text-5xl font-bold tabular-nums" data-testid="score">{tenthsToPercentString(s.score_tenths)}%</p>
          <p className="text-sm" data-testid="score-detail">{t("correctOfTotal", { correct: s.correct, total: s.total })}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 self-center text-sm sm:grid-cols-4">
          <div><dt className="text-muted-foreground">{t("answeredCount")}</dt><dd className="font-semibold tabular-nums">{fmt.format(s.answered)}</dd></div>
          <div><dt className="text-muted-foreground">{t("unansweredCount")}</dt><dd className="font-semibold tabular-nums">{fmt.format(s.total - s.answered)}</dd></div>
          <div><dt className="text-muted-foreground">{t("flaggedCount")}</dt><dd className="font-semibold tabular-nums">{fmt.format(s.flagged)}</dd></div>
          <div><dt className="text-muted-foreground">{t("duration")}</dt><dd className="font-semibold">{t("durationValue", { m: mins, s: s.duration_seconds % 60 })}</dd></div>
        </dl>
        <p className="text-xs text-muted-foreground sm:col-span-2">{t("scoreNote")}</p>
      </section>

      <section aria-labelledby="qb-dom-h" className="space-y-3">
        <h2 id="qb-dom-h" className="text-xl font-semibold">{t("byDomain")}</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {s.by_domain.map((d) => (
            <li key={d.slug} className="space-y-1">
              <div className="flex justify-between gap-2 text-sm"><span className="font-medium">{localize(d.title, locale)}</span><span className="tabular-nums text-muted-foreground">{d.correct}/{d.total}</span></div>
              <ProgressBar value={d.total ? (d.correct / d.total) * 100 : 0} label={localize(d.title, locale)} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="qb-rev-h" className="space-y-4">
        <h2 id="qb-rev-h" className="text-xl font-semibold">{t("reviewTitle")}</h2>
        <nav aria-label={t("reviewTitle")} className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link key={f} href={f === "all" ? `/question-bank/attempt/${id}/results` : `/question-bank/attempt/${id}/results?show=${f}`} aria-current={filter === f ? "page" : undefined}
              className={cn("inline-flex min-h-11 items-center rounded-md border px-4 no-underline", filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted")}>
              {t(`filter${f[0]!.toUpperCase()}${f.slice(1)}` as "filterAll")}
            </Link>
          ))}
        </nav>
        {visible.length === 0 ? <p className="text-muted-foreground">{t("noMatches")}</p> : (
          <ol className="space-y-4">
            {visible.map((i) => {
              const fb = i.feedback;
              const state = i.voided ? t("unavailableQuestion") : i.selected_option_id === null ? t("notAnsweredLabel") : fb?.is_correct ? t("correct") : t("incorrect");
              return (
                <li key={i.position}>
                  <article aria-labelledby={`rq-${i.position}`} className="space-y-3 rounded-lg border border-border bg-card p-4">
                    <header className="flex flex-wrap items-center gap-2">
                      <h3 id={`rq-${i.position}`} className="font-semibold">{t("questionOf", { n: i.position, total: attempt.question_count })}</h3>
                      <Badge tone={i.voided ? "info" : i.selected_option_id === null ? "warning" : fb?.is_correct ? "success" : "danger"}>
                        {fb?.is_correct ? <CheckCircle2 className="me-1 size-3" aria-hidden /> : i.selected_option_id ? <XCircle className="me-1 size-3" aria-hidden /> : null}{state}
                      </Badge>
                      {i.flagged ? <Badge tone="warning"><Flag className="me-1 size-3" aria-hidden />{t("navFlagged")}</Badge> : null}
                      {i.synthetic ? <Badge tone="warning">{t("fixturesBadge")}</Badge> : null}
                    </header>
                    <LText as="p" value={i.stem} locale={locale} className="font-medium" />
                    <ul className="space-y-2">
                      {i.options.map((o, oi) => {
                        const correct = o.id === fb?.correct_option_id;
                        const mine = o.id === i.selected_option_id;
                        const expl = fb?.explanations[o.id];
                        return (
                          <li key={o.id} className={cn("rounded-md border p-3 text-sm", correct ? "border-success-foreground/60 bg-success text-success-foreground" : mine ? "border-danger-foreground/60 bg-danger text-danger-foreground" : "border-border")}>
                            <p className="flex flex-wrap items-center gap-2">
                              <span aria-hidden className="inline-flex size-6 items-center justify-center rounded-full border border-current text-xs font-semibold">{letters[oi]}</span>
                              <LText value={o.text} locale={locale} />
                              {correct ? <span className="inline-flex items-center gap-1 font-semibold"><CheckCircle2 className="size-4" aria-hidden />{t("correctAnswer")}</span> : null}
                              {mine && !correct ? <span className="inline-flex items-center gap-1 font-semibold"><XCircle className="size-4" aria-hidden />{t("yourAnswer")}</span> : null}
                              {mine && correct ? <span className="font-semibold">· {t("yourAnswer")}</span> : null}
                            </p>
                            {expl ? <p className="mt-1"><span className="font-semibold">{correct ? t("whyCorrect") : t("whyWrong")}: </span><LText value={expl} locale={locale} /></p> : null}
                          </li>
                        );
                      })}
                    </ul>
                    {fb ? <p className="text-sm"><span className="font-semibold">{t("summary")}: </span><LText value={fb.rationale} locale={locale} /></p> : null}
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild><Link href="/question-bank">{t("startAnother")}</Link></Button>
        <Button asChild variant="outline"><Link href="/question-bank">{t("backToBank")}</Link></Button>
      </div>
    </div>
  );
}
