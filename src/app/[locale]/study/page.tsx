import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, Callout, ProgressBar } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/content/localize";
import { getQuestionBankService, resolveMode } from "@/lib/question-bank";
import { daysForBox } from "@/lib/question-bank/leitner";
import type { HistoryItem, RevisionKind, StudyOverview } from "@/lib/question-bank/types";
import { RevisionLauncher } from "@/components/question-bank/revision-launcher";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Study" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function StudyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Study");
  const mode = resolveMode();
  if (mode === "disabled") {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Callout tone="info" title={t("disabledTitle")}>{t("disabledBody")}</Callout>
      </div>
    );
  }
  if (mode === "database") await requireUser(locale, "/study");

  let overview: StudyOverview | null = null;
  let history: HistoryItem[] = [];
  let failed = false;
  try {
    const svc = await getQuestionBankService();
    if (svc) [overview, history] = await Promise.all([svc.studyOverview(), svc.history(15)]);
  } catch {
    failed = true;
  }

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const totalAvailable = overview?.domains.reduce((n, d) => n + d.available, 0) ?? 0;
  const kinds: { kind: RevisionKind; count: number }[] = overview
    ? [
        { kind: "incorrect", count: overview.incorrect },
        { kind: "flagged", count: overview.flagged },
        { kind: "bookmarked", count: overview.bookmarked },
      ]
    : [];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
      </header>

      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      {failed ? <Callout tone="danger">{t("loadError")}</Callout> : null}

      {overview ? (
        totalAvailable === 0 ? (
          <Callout tone="info" title={t("emptyTitle")}>{t("emptyBody")}</Callout>
        ) : (
          <>
            <section aria-labelledby="st-due-h" className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-[auto_1fr] sm:p-6">
              <div>
                <h2 id="st-due-h" className="text-sm text-muted-foreground">{t("dueTitle")}</h2>
                <p className="text-5xl font-bold tabular-nums" data-testid="due-count">{overview.due}</p>
              </div>
              <div className="space-y-3 self-center">
                <p>{t("dueCount", { n: overview.due })}</p>
                <p className="text-sm text-muted-foreground">
                  {overview.next_due_at ? t("nextDue", { when: dateFmt.format(new Date(overview.next_due_at)) }) : overview.due === 0 ? t("nothingScheduled") : ""}
                </p>
                <p className="text-sm text-muted-foreground">{t("reviewedToday", { n: overview.reviewed_today })}</p>
                <RevisionLauncher kind="due" count={overview.due} primary />
              </div>
            </section>

            <section aria-labelledby="st-sets-h" className="space-y-3">
              <h2 id="st-sets-h" className="text-xl font-semibold">{t("launchersTitle")}</h2>
              <ul className="grid gap-4 md:grid-cols-3">
                {kinds.map(({ kind, count }) => (
                  <li key={kind} className="space-y-2 rounded-lg border border-border bg-card p-4">
                    <h3 className="font-semibold">{t(`kind${kind[0]!.toUpperCase()}${kind.slice(1)}` as "kindDue")}</h3>
                    <p className="text-2xl font-bold tabular-nums" data-testid={`count-${kind}`}>{count}</p>
                    <p className="text-sm text-muted-foreground">{t(`kind${kind[0]!.toUpperCase()}${kind.slice(1)}Help` as "kindDueHelp")}</p>
                    <RevisionLauncher kind={kind} count={count} />
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="st-box-h" className="space-y-3">
              <h2 id="st-box-h" className="text-xl font-semibold">{t("boxesTitle")}</h2>
              <p className="max-w-prose text-sm text-muted-foreground">{t("boxesIntro")}</p>
              <ol className="grid gap-3 sm:grid-cols-5">
                {overview.boxes.map((n, i) => (
                  <li key={i} className="rounded-md border border-border bg-card p-3">
                    <p className="font-semibold">{t("boxLabel", { n: i + 1 })}</p>
                    <p className="text-2xl font-bold tabular-nums">{n}</p>
                    <p className="text-xs text-muted-foreground">{t("boxInterval", { n: daysForBox(i + 1) })}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="st-prog-h" className="space-y-3">
              <h2 id="st-prog-h" className="text-xl font-semibold">{t("progressTitle")}</h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {overview.domains.filter((d) => d.available > 0).map((d) => (
                  <li key={d.slug} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{localize(d.title, locale)}</p>
                      {d.due > 0 ? <Badge tone="warning">{t("kindDue")}: {d.due}</Badge> : null}
                    </div>
                    <ProgressBar value={(d.answered / d.available) * 100} label={localize(d.title, locale)} />
                    <p className="text-sm text-muted-foreground">{t("progressOf", { answered: d.answered, available: d.available, correct: d.correct, due: d.due })}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="st-hist-h" className="space-y-3">
              <h2 id="st-hist-h" className="text-xl font-semibold">{t("historyTitle")}</h2>
              {history.length === 0 ? <p className="text-muted-foreground">{t("historyEmpty")}</p> : (
                <div role="region" aria-label={t("historyTitle")} tabIndex={0} className="overflow-x-auto rounded-lg border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                  <table className="w-full text-sm">
                    <caption className="sr-only">{t("historyTitle")}</caption>
                    <thead className="bg-muted"><tr>{(["colWhen", "colQuestion", "colTopic", "colResult"] as const).map((c) => <th key={c} scope="col" className="px-3 py-2 text-start font-semibold">{t(c)}</th>)}</tr></thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={`${h.attempt_id}-${i}`} className="border-t border-border">
                          <td className="whitespace-nowrap px-3 py-2">{dateFmt.format(new Date(h.answered_at))}</td>
                          <td className="px-3 py-2">{localize(h.stem, locale)}</td>
                          <td className="px-3 py-2">{localize(h.domain_title, locale)}</td>
                          <td className="px-3 py-2">{h.is_correct ? <Badge tone="success">{t("resultCorrect")}</Badge> : <Badge tone="danger">{t("resultIncorrect")}</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link href="/study/sheets">{t("sheetsTitle")}</Link></Button>
        <Button asChild variant="outline"><Link href="/question-bank">{t("openBank")}</Link></Button>
      </div>
    </div>
  );
}
