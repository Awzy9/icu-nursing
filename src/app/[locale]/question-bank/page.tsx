import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, Callout, ProgressBar } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/content/localize";
import { getQuestionBankService, resolveMode } from "@/lib/question-bank";
import { tenthsToPercentString } from "@/lib/question-bank/score";
import type { AttemptListItem, ProgressView } from "@/lib/question-bank/types";
import { StartForm } from "@/components/question-bank/start-form";
import { DiscardButton } from "@/components/question-bank/discard-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "QuestionBank" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function QuestionBankPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("QuestionBank");
  const mode = resolveMode();
  if (mode === "disabled") {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Callout tone="info" title={t("disabledTitle")}>{t("disabledBody")}</Callout>
      </div>
    );
  }
  if (mode === "database") await requireUser(locale, "/question-bank");

  let progress: ProgressView | null = null;
  let attempts: AttemptListItem[] = [];
  let failed = false;
  try {
    const svc = await getQuestionBankService();
    if (svc) [progress, attempts] = await Promise.all([svc.progress(), svc.listAttempts()]);
  } catch {
    failed = true;
  }

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const totalAvailable = progress?.domains.reduce((n, d) => n + d.available, 0) ?? 0;
  const answeredTotal = progress?.domains.reduce((n, d) => n + d.answered, 0) ?? 0;
  const inProgress = attempts.filter((a) => a.status === "in_progress");
  const history = attempts.filter((a) => a.status === "completed");

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
      </header>

      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      {failed ? <Callout tone="danger">{t("loadError")}</Callout> : null}

      {progress ? (
        <>
          <section aria-labelledby="qb-stats-h">
            <h2 id="qb-stats-h" className="sr-only">{t("progressTitle")}</h2>
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                [t("statAnswered"), String(answeredTotal)],
                [t("statAttempts"), String(progress.completed_attempts)],
                [t("statAverage"), progress.average_tenths === null ? t("noAverage") : `${tenthsToPercentString(progress.average_tenths)}%`],
                [t("statBookmarked"), String(progress.bookmarked)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-card p-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {inProgress.length ? (
            <section aria-labelledby="qb-resume-h" className="space-y-3">
              <h2 id="qb-resume-h" className="text-xl font-semibold">{t("resumeTitle")}</h2>
              <ul className="space-y-3">
                {inProgress.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{t(a.mode)} · {a.answered}/{a.question_count}</p>
                      <p className="text-sm text-muted-foreground">{dateFmt.format(new Date(a.started_at))}</p>
                      <div className="w-48"><ProgressBar value={(a.answered / a.question_count) * 100} label={`${a.answered}/${a.question_count}`} /></div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild><Link href={`/question-bank/attempt/${a.id}`}>{t("resume")}</Link></Button>
                      <DiscardButton attemptId={a.id} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {totalAvailable === 0 ? (
            <Callout tone="info" title={t("emptyTitle")}>{t("emptyBody")}</Callout>
          ) : (
            <section aria-labelledby="qb-start-h" className="space-y-4">
              <h2 id="qb-start-h" className="text-xl font-semibold">{t("startTitle")}</h2>
              <StartForm
                domains={progress.domains.map((d) => ({ slug: d.slug, title: d.title, available: d.available }))}
                bookmarked={progress.bookmarked}
                totalAvailable={totalAvailable}
              />
            </section>
          )}

          {totalAvailable > 0 ? (
            <section aria-labelledby="qb-prog-h" className="space-y-3">
              <h2 id="qb-prog-h" className="text-xl font-semibold">{t("progressTitle")}</h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {progress.domains.filter((d) => d.available > 0).map((d) => (
                  <li key={d.slug} className="space-y-1">
                    <p className="font-medium">{localize(d.title, locale)}</p>
                    <ProgressBar value={(d.answered / d.available) * 100} label={localize(d.title, locale)} />
                    <p className="text-sm text-muted-foreground">{t("progressOf", { answered: d.answered, available: d.available, correct: d.correct })}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="qb-hist-h" className="space-y-3">
            <h2 id="qb-hist-h" className="text-xl font-semibold">{t("historyTitle")}</h2>
            {history.length === 0 ? (
              <p className="text-muted-foreground">{t("historyEmpty")}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-start text-sm">
                  <caption className="sr-only">{t("historyTitle")}</caption>
                  <thead className="bg-muted">
                    <tr>
                      {["colDate", "colMode", "colScore", "colStatus"].map((c) => <th key={c} scope="col" className="px-3 py-2 text-start font-semibold">{t(c as "colDate")}</th>)}
                      <th scope="col" className="px-3 py-2"><span className="sr-only">{t("viewResults")}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((a) => (
                      <tr key={a.id} className="border-t border-border">
                        <td className="px-3 py-2">{dateFmt.format(new Date(a.completed_at ?? a.started_at))}</td>
                        <td className="px-3 py-2">{t(a.mode)}</td>
                        <td className="px-3 py-2 tabular-nums">{a.score_tenths === null ? "" : `${tenthsToPercentString(a.score_tenths)}% (${a.correct}/${a.total})`}</td>
                        <td className="px-3 py-2">{a.timed_out ? <Badge tone="warning">{t("timedOut")}</Badge> : <Badge tone="success">{t("statusCompleted")}</Badge>}</td>
                        <td className="px-3 py-2 text-end"><Link href={`/question-bank/attempt/${a.id}/results`}>{t("viewResults")}</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
