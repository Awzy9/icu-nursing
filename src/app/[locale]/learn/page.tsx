import { workingEditionEnabled, workingQuery } from "@/lib/working";
import { WorkingCatalog } from "@/components/working/catalog";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, BookOpen, ClipboardCheck, ClipboardList, Layers, ListChecks, Pill, Cpu, Search, Workflow } from "lucide-react";
import { Callout } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { localize } from "@/lib/content/localize";
import { getContentRepository } from "@/lib/content";
import { getCaseService } from "@/lib/cases";
import { getSkillService } from "@/lib/skills";
import { listPractice } from "@/lib/practice";
import { listEquipment } from "@/lib/equipment";
import { getMedicationService } from "@/lib/medications";
import type { SkillProgress } from "@/lib/skills/types";
import { getQuestionBankService, resolveMode } from "@/lib/question-bank";
import type { CaseListItem, CaseProgress } from "@/lib/cases/types";
import type { AttemptListItem, StudyOverview } from "@/lib/question-bank/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Learn" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** One page that joins the four learning areas: what to do next, what is unfinished, and progress at a glance. */
export default async function LearnPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (workingEditionEnabled()) return <WorkingCatalog query={await workingQuery(searchParams)} locale={locale} />;
  const t = await getTranslations("Learn");
  const ts = await getTranslations("Skills");
  const tp = await getTranslations("Practice");
  const mode = resolveMode();
  const topics = await (await getContentRepository()).listTopics({ locale }).catch(() => []);
  if (mode === "database") await requireUser(locale, "/learn");

  let study: StudyOverview | null = null, attempts: AttemptListItem[] = [], cases: CaseListItem[] = [], caseProgress: CaseProgress | null = null, skillProgress: SkillProgress | null = null, medCount = 0, failed = false;
  if (mode !== "disabled") {
    try {
      const [qb, cs, sk] = await Promise.all([getQuestionBankService(), getCaseService(), getSkillService()]);
      if (qb) [study, attempts] = await Promise.all([qb.studyOverview(), qb.listAttempts()]);
      if (cs) [caseProgress, cases] = await Promise.all([cs.progress(), cs.list()]);
      if (sk) skillProgress = await sk.progress();
      medCount = (await (await getMedicationService())?.progress())?.available ?? 0;
    } catch {
      failed = true;
    }
  }

  const answered = study?.domains.reduce((n, d) => n + d.answered, 0) ?? 0;
  const correct = study?.domains.reduce((n, d) => n + d.correct, 0) ?? 0;
  const available = study?.domains.reduce((n, d) => n + d.available, 0) ?? 0;
  const unfinishedAttempt = attempts.find((a) => a.status === "in_progress");
  const unfinishedCase = cases.find((c) => c.in_progress_attempt);

  type Next = { text: string; help?: string; href: string };
  let next: Next | null = null;
  if (study && study.due > 0) next = { text: t("nextDue", { n: study.due }), help: t("nextDueHelp"), href: "/study" };
  else if (unfinishedAttempt) next = { text: t("nextResumeAttempt", { mode: unfinishedAttempt.mode }), href: `/question-bank/attempt/${unfinishedAttempt.id}` };
  else if (unfinishedCase) next = { text: t("nextResumeCase", { title: localize(unfinishedCase.title, locale) }), href: `/cases/attempt/${unfinishedCase.in_progress_attempt}` };
  else if (study && available > 0 && answered === 0) next = { text: t("nextStart"), help: t("nextStartHelp"), href: "/question-bank" };
  else if (caseProgress && caseProgress.available > 0 && caseProgress.completed_cases === 0) next = { text: t("nextCase"), help: t("nextCaseHelp"), href: "/cases" };
  else if (study) next = { text: t("nextAll"), href: "/question-bank" };

  const areas = [
    { Icon: BookOpen, title: t("libraryTitle"), body: t("libraryBody"), stat: t("libraryStat", { n: topics.length }), href: "/library" },
    { Icon: ClipboardCheck, title: t("bankTitle"), body: t("bankBody"), stat: t("bankStat", { n: answered }), href: "/question-bank" },
    { Icon: Layers, title: t("studyTitle"), body: t("studyBody"), stat: t("studyStat", { n: study?.due ?? 0 }), href: "/study" },
    { Icon: Workflow, title: t("casesTitle"), body: t("casesBody"), stat: t("casesStat", { done: caseProgress?.completed_cases ?? 0, total: caseProgress?.available ?? 0 }), href: "/cases" },
    { Icon: ClipboardList, title: ts("hubTitle"), body: ts("hubBody"), stat: ts("hubStat", { n: skillProgress?.available ?? 0 }), href: "/skills" },
    ...(mode === "disabled" ? [] : [{ Icon: Pill, title: t("medsTitle"), body: t("medsBody"), stat: t("medsStat", { n: medCount }), href: "/medications" }, { Icon: Cpu, title: t("equipTitle"), body: t("equipBody"), stat: t("equipStat", { n: listEquipment().length }), href: "/equipment" }]),
    ...(mode === "disabled" ? [] : [{ Icon: ListChecks, title: tp("title"), body: tp("hubBody"), stat: tp("hubStat", { n: listPractice().length }), href: "/practice" }]),
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("intro")}</p>
        <Button asChild variant="outline" size="sm"><Link href="/search"><Search className="size-4" aria-hidden />{t("searchLink")}</Link></Button>
      </header>
      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      {mode === "disabled" ? <Callout tone="info" title={t("disabledTitle")}>{t("disabledBody")}</Callout> : null}
      {failed ? <Callout tone="danger">{t("loadError")}</Callout> : null}

      {next ? (
        <section aria-labelledby="ln-next" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-primary bg-card p-4 sm:p-6">
          <div className="space-y-1">
            <h2 id="ln-next" className="text-sm font-semibold text-muted-foreground">{t("nextTitle")}</h2>
            <p className="text-lg font-semibold">{next.text}</p>
            {next.help ? <p className="text-sm text-muted-foreground">{next.help}</p> : null}
          </div>
          <Button asChild size="lg"><Link href={next.href}>{t("go")}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></Link></Button>
        </section>
      ) : null}

      <section aria-labelledby="ln-cont" className="space-y-3">
        <h2 id="ln-cont" className="text-xl font-semibold">{t("continueTitle")}</h2>
        {!unfinishedAttempt && !unfinishedCase ? <p className="text-muted-foreground">{t("continueEmpty")}</p> : (
          <ul className="space-y-2">
            {attempts.filter((a) => a.status === "in_progress").map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-3">
                <span>{t(a.mode === "exam" ? "modeExam" : "modePractice")} · {a.answered}/{a.question_count}</span>
                <Button asChild size="sm"><Link href={`/question-bank/attempt/${a.id}`}>{t("go")}</Link></Button>
              </li>
            ))}
            {cases.filter((c) => c.in_progress_attempt).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-3">
                <span>{localize(c.title, locale)}</span>
                <Button asChild size="sm"><Link href={`/cases/attempt/${c.in_progress_attempt}`}>{t("go")}</Link></Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {study && available > 0 ? (
        <section aria-labelledby="ln-prog" className="space-y-2">
          <h2 id="ln-prog" className="text-xl font-semibold">{t("progressTitle")}</h2>
          <SegmentedBar
            label={t("progressAnswered")}
            segments={[
              { value: correct, label: t("correctLabel"), className: "bg-success-foreground" },
              { value: answered - correct, label: t("incorrectLabel"), className: "bg-danger-foreground" },
              { value: Math.max(0, available - answered), label: t("unansweredLabel"), className: "bg-muted" },
            ]}
          />
        </section>
      ) : null}

      <section aria-labelledby="ln-areas" className="space-y-3">
        <h2 id="ln-areas" className="text-xl font-semibold">{t("areasTitle")}</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {areas.map(({ Icon, title, body, stat, href }) => (
            <li key={href} className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 font-semibold"><Icon className="size-5" aria-hidden />{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
                <p className="text-sm font-medium">{stat}</p>
              </div>
              <Link href={href}>{t("open")}<span className="sr-only">: {title}</span></Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
