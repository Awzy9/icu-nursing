import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge, Callout } from "@/components/ui/feedback";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/content/localize";
import { getCaseService } from "@/lib/cases";
import { resolveMode } from "@/lib/question-bank";
import { tenthsToPercentString } from "@/lib/question-bank/score";
import type { CaseListItem, CaseProgress } from "@/lib/cases/types";
import { CaseCardActions } from "@/components/cases/case-card-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cases" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cases");
  const mode = resolveMode();
  if (mode === "disabled") {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Callout tone="info" title={t("disabledTitle")}>{t("disabledBody")}</Callout>
      </div>
    );
  }
  if (mode === "database") await requireUser(locale, "/cases");

  let progress: CaseProgress | null = null;
  let list: CaseListItem[] = [];
  let failed = false;
  try {
    const svc = await getCaseService();
    if (svc) [progress, list] = await Promise.all([svc.progress(), svc.list()]);
  } catch {
    failed = true;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
      </header>
      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      {failed ? <Callout tone="danger">{t("loadError")}</Callout> : null}

      {progress ? (
        <>
          <section aria-labelledby="cs-stats">
            <h2 id="cs-stats" className="sr-only">{t("title")}</h2>
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                [t("statAvailable"), String(progress.available)],
                [t("statCompleted"), String(progress.completed_cases)],
                [t("statInProgress"), String(progress.in_progress)],
                [t("statAverage"), progress.average_tenths === null ? t("noAverage") : `${tenthsToPercentString(progress.average_tenths)}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-card p-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="max-w-prose text-sm text-muted-foreground">{t("scoreNote")}</p>

          {list.length === 0 ? <Callout tone="info" title={t("emptyTitle")}>{t("emptyBody")}</Callout> : (
            <ul className="grid gap-4 md:grid-cols-2">
              {list.map((c) => (
                <li key={c.id} className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{localize(c.title, locale)}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {c.synthetic ? <Badge tone="warning">{t("syntheticBadge")}</Badge> : null}
                      <Badge>{t(`difficulty${c.difficulty}` as "difficulty1")}</Badge>
                      <span className="text-muted-foreground">{localize(c.domain_title, locale)} · {t("steps", { n: c.steps })}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("completedTimes", { n: c.completed })}{c.best_score_tenths !== null ? ` · ${t("bestScore", { score: tenthsToPercentString(c.best_score_tenths) })}` : ""}
                    </p>
                  </div>
                  <CaseCardActions caseId={c.id} inProgress={c.in_progress_attempt} inProgressPosition={c.in_progress_position} lastCompleted={c.last_completed_attempt} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
